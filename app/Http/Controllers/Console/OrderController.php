<?php

namespace App\Http\Controllers\Console;

use App\Enums\OrderStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Order;
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
        $order->update(['status' => OrderStatus::Accepted]);

        return back()->with('toast', "Order {$order->id} accepted");
    }

    public function deliver(Order $order): RedirectResponse
    {
        $order->update([
            'status' => OrderStatus::Completed,
            'completed_at' => now(),
        ]);

        return back()->with('toast', "Order {$order->id} marked delivered");
    }

    public function cancel(Order $order): RedirectResponse
    {
        DB::transaction(fn () => $this->cancelOrder($order));

        return back()->with('toast', "Order {$order->id} cancelled and refunded");
    }

    public function acceptGroup(string $group): RedirectResponse
    {
        $this->groupOrders($group)
            ->filter(fn (Order $order) => $order->status === OrderStatus::Pending)
            ->each(fn (Order $order) => $order->update(['status' => OrderStatus::Accepted]));

        return back()->with('toast', 'Basket accepted');
    }

    public function deliverGroup(string $group): RedirectResponse
    {
        $this->groupOrders($group)
            ->filter(fn (Order $order) => $order->status === OrderStatus::Accepted)
            ->each(fn (Order $order) => $order->update([
                'status' => OrderStatus::Completed,
                'completed_at' => now(),
            ]));

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
     * Assumed to run inside a transaction.
     */
    private function cancelOrder(Order $order): void
    {
        if (! in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
            return;
        }

        $order->update(['status' => OrderStatus::Cancelled]);

        if ($order->points_spent > 0) {
            app(WalletService::class)->credit($order->receiver, $order->points_spent, 'order refund', (string) $order->id);
        }

        $food = $order->foodDonation;

        if ($food) {
            app(FoodSplitService::class)->release($food, $order->units);
            app(FoodSplitService::class)->republishIfBackInStock($food);
        }
    }
}
