<?php

namespace App\Http\Controllers\Console;

use App\Enums\OrderStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Notifications\KugawanaNotification;
use App\Services\FoodSplitService;
use App\Services\WalletService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class OrderController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $orders = Order::query()
            ->with(['receiver', 'foodDonation.unit'])
            ->when($this->countryId(), fn ($q) => $q->whereHas('foodDonation', fn ($f) => $f->where('country_id', $this->countryId())))
            ->latest()
            ->get();

        // A basket checkout shares one group id; a standalone request is its own
        // group. Grouping in memory keeps refunds and stock per line while the
        // admin sees and acts on the basket as one order.
        $groups = $orders
            ->groupBy(fn (Order $order) => $order->group_id ?? 'single-' . $order->id)
            ->map(fn (Collection $items) => $this->buildGroup($items))
            ->values();

        $perPage = 20;
        $page = LengthAwarePaginator::resolveCurrentPage();
        $paginated = new LengthAwarePaginator(
            $groups->forPage($page, $perPage)->values(),
            $groups->count(),
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath()]
        );

        return view('console.orders.index', [
            'title' => 'Orders',
            'groups' => $paginated,
        ]);
    }

    /** @param  Collection<int, Order>  $items */
    private function buildGroup(Collection $items): array
    {
        $first = $items->first();
        $isBasket = $first->group_id !== null;
        $statuses = $items->map(fn (Order $order) => $order->status)->unique();

        return [
            'is_basket' => $isBasket,
            'group_id' => $first->group_id,
            'reference' => $isBasket
                ? 'BSK-' . strtoupper(substr($first->group_id, 0, 6))
                : 'OR-' . $first->id,
            'receiver' => $first->receiver,
            'delivery_method' => $first->delivery_method,
            'created_at' => $first->created_at,
            'orders' => $items->values(),
            'count' => $items->count(),
            'total_points' => $items->sum('points_spent'),
            'status_label' => $statuses->count() === 1 ? $statuses->first()->getLabel() : 'Mixed',
            'status_value' => $statuses->count() === 1 ? $statuses->first()->value : 'reviewed',
            'can_accept' => $items->contains(fn (Order $order) => $order->status === OrderStatus::Pending),
            'can_deliver' => $items->contains(fn (Order $order) => $order->status === OrderStatus::Accepted),
            'can_cancel' => $items->contains(fn (Order $order) => in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true)),
        ];
    }

    public function accept(Order $order): RedirectResponse
    {
        $this->guardScope($order);

        // Locked and re-checked like cancelOrder(): without this, a stale list
        // page (or a replayed POST) could accept an order that was already
        // cancelled and refunded, leaving the receiver holding both.
        if (! $this->transition($order, [OrderStatus::Pending], OrderStatus::Accepted)) {
            return back()->with('toast', "Order {$order->id} is no longer pending");
        }

        $this->notifyReceiver(
            $order,
            'order.accepted',
            'Your request was accepted',
            "Your request for \"{$order->foodDonation?->title}\" was accepted."
        );

        return back()->with('toast', "Order {$order->id} accepted");
    }

    public function deliver(Order $order): RedirectResponse
    {
        $this->guardScope($order);

        if (! $this->transition($order, [OrderStatus::Pending, OrderStatus::Accepted], OrderStatus::Completed)) {
            return back()->with('toast', "Order {$order->id} can no longer be marked delivered");
        }

        $this->notifyReceiver(
            $order,
            'order.completed',
            'Order delivered',
            "\"{$order->foodDonation?->title}\" was marked as delivered."
        );

        return back()->with('toast', "Order {$order->id} marked delivered");
    }

    /**
     * Moves an order to $to only if it is still in one of $from, deciding under
     * a row lock. Returns false when someone else already moved it, so callers
     * can report that instead of silently acting on stale state.
     *
     * @param  array<int, OrderStatus>  $from
     */
    private function transition(Order $order, array $from, OrderStatus $to): bool
    {
        return DB::transaction(function () use ($order, $from, $to): bool {
            $locked = Order::whereKey($order->id)->lockForUpdate()->first();

            if (! $locked || ! in_array($locked->status, $from, true)) {
                return false;
            }

            $locked->update([
                'status' => $to,
                ...($to === OrderStatus::Completed ? ['completed_at' => now()] : []),
            ]);

            return true;
        });
    }

    /** Tells the person who requested the food that an admin acted on their order. */
    private function notifyReceiver(?Order $order, string $type, string $title, string $body): void
    {
        $order?->receiver?->notify(new KugawanaNotification($type, $title, $body, 'orders'));
    }

    public function cancel(Order $order): RedirectResponse
    {
        $this->guardScope($order);

        DB::transaction(fn () => $this->cancelOrder($order));

        return back()->with('toast', "Order {$order->id} cancelled and refunded");
    }

    /** A CountryAdmin may only act on orders for food donated in their own country. */
    private function guardScope(Order $order): void
    {
        $countryId = $this->countryId();

        abort_if($countryId && $order->foodDonation?->country_id !== $countryId, 403);
    }

    public function acceptGroup(string $group): RedirectResponse
    {
        $orders = $this->groupOrders($group);

        $orders->filter(fn (Order $order) => $order->status === OrderStatus::Pending)
            ->each(fn (Order $order) => $order->update(['status' => OrderStatus::Accepted]));

        // One ping for the whole basket, not one per line — a basket shares a
        // single receiver.
        $this->notifyReceiver(
            $orders->first(),
            'order.accepted',
            'Your request was accepted',
            'Your basket request was accepted.'
        );

        return back()->with('toast', 'Basket accepted');
    }

    public function deliverGroup(string $group): RedirectResponse
    {
        $orders = $this->groupOrders($group);

        $orders->filter(fn (Order $order) => $order->status === OrderStatus::Accepted)
            ->each(fn (Order $order) => $order->update([
                'status' => OrderStatus::Completed,
                'completed_at' => now(),
            ]));

        $this->notifyReceiver(
            $orders->first(),
            'order.completed',
            'Order delivered',
            'Your basket order was marked as delivered.'
        );

        return back()->with('toast', 'Basket marked delivered');
    }

    public function cancelGroup(string $group): RedirectResponse
    {
        $orders = $this->groupOrders($group)
            ->filter(fn (Order $order) => in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true));

        DB::transaction(function () use ($orders) {
            $orders->each(fn (Order $order) => $this->cancelOrder($order));
        });

        return back()->with('toast', 'Basket cancelled and refunded');
    }

    /** Every order in a basket, scoped to the admin's country. */
    private function groupOrders(string $group): Collection
    {
        return Order::query()
            ->where('group_id', $group)
            ->when($this->countryId(), fn ($q) => $q->whereHas('foodDonation', fn ($f) => $f->where('country_id', $this->countryId())))
            ->with(['receiver', 'foodDonation'])
            ->get();
    }

    /**
     * Cancels one line: refunds its points and returns its stock to the shelf.
     * Assumed to run inside a transaction. Locks and re-checks status itself so
     * a double-click or two admins acting on the same order can't both refund it.
     */
    private function cancelOrder(Order $order): void
    {
        $locked = Order::lockForUpdate()->find($order->id);

        if (! in_array($locked->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
            return;
        }

        $locked->update(['status' => OrderStatus::Cancelled]);

        if ($locked->points_spent > 0) {
            app(WalletService::class)->credit($locked->receiver, $locked->points_spent, 'order refund', (string) $locked->id);
        }

        $food = $locked->foodDonation;

        if ($food) {
            app(FoodSplitService::class)->release($food, $locked->units);
            app(FoodSplitService::class)->republishIfBackInStock($food);
        }
    }
}
