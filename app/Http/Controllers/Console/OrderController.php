<?php

namespace App\Http\Controllers\Console;

use App\Enums\OrderStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\WalletService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class OrderController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $orders = Order::query()
            ->with(['receiver', 'foodDonation'])
            ->when($this->countryId(), fn ($q) => $q->whereHas('foodDonation', fn ($f) => $f->where('country_id', $this->countryId())))
            ->latest()
            ->paginate(25);

        return view('console.orders.index', [
            'title' => 'Orders',
            'orders' => $orders,
        ]);
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
        DB::transaction(function () use ($order) {
            $order->update(['status' => OrderStatus::Cancelled]);
            if ($order->points_spent > 0) {
                app(WalletService::class)->credit($order->receiver, $order->points_spent, 'order refund', (string) $order->id);
            }
        });

        return back()->with('toast', "Order {$order->id} cancelled and refunded");
    }
}
