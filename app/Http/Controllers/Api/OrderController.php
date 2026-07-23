<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Enums\OrderStatus;
use App\Exceptions\InsufficientPointsException;
use App\Exceptions\OutOfStockException;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Notifications\KugawanaNotification;
use App\Services\FoodSplitService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with([
                'rating',
                'foodDonation.category',
                'foodDonation.donor.country',
                'foodDonation.donor' => fn ($query) => $query
                    ->withAvg('ratingsReceived', 'stars')
                    ->withCount('ratingsReceived'),
            ])
            ->where('receiver_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
            'message' => 'Orders retrieved',
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeReceiver($request, $order);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($this->withDetail($order)),
            'message' => 'Request retrieved',
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $this->authorizeReceiver($request, $order);

        if ($order->status !== OrderStatus::Pending) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only a pending request can be edited.',
            ], 422);
        }

        $data = $request->validate([
            'preferred_quantity' => ['nullable', 'string', 'max:100'],
            'need_by' => ['nullable', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
        ]);

        $order->update($data);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($this->withDetail($order)),
            'message' => 'Request updated',
        ]);
    }

    public function cancel(Request $request, Order $order, WalletService $wallet, FoodSplitService $splitter): JsonResponse
    {
        $this->authorizeReceiver($request, $order);

        if (! in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This request can no longer be cancelled.',
            ], 422);
        }

        DB::transaction(function () use ($order, $wallet, $splitter) {
            $order->update(['status' => OrderStatus::Cancelled]);

            if ($order->points_spent > 0) {
                $wallet->credit($order->receiver, $order->points_spent, 'order refund', (string) $order->id);
            }

            // store() takes the units off the shelf and reserves the listing;
            // both are undone here so the food stays available to others.
            $food = $order->foodDonation;

            if (! $food) {
                return;
            }

            $splitter->release($food, $order->units);

            if ($food->isSplit()) {
                $splitter->republishIfBackInStock($food);
            } elseif ($food->status === FoodStatus::Reserved) {
                $food->update(['status' => FoodStatus::Published]);
            }
        });

        $this->notifyDonor(
            $order,
            'order.cancelled',
            'A request was cancelled',
            "{$request->user()->name} cancelled their request for \"{$order->foodDonation?->title}\"."
        );

        return response()->json([
            'success' => true,
            'data' => new OrderResource($this->withDetail($order->fresh())),
            'message' => 'Request cancelled',
        ]);
    }

    public function complete(Request $request, Order $order): JsonResponse
    {
        $this->authorizeReceiver($request, $order);

        if (in_array($order->status, [OrderStatus::Completed, OrderStatus::Cancelled], true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This request can no longer be completed.',
            ], 422);
        }

        // Mirrors the console flow so the responsibility score and completed_at
        // stay consistent however an order is closed.
        $order->update([
            'status' => OrderStatus::Completed,
            'completed_at' => now(),
        ]);

        $this->notifyDonor(
            $order,
            'order.completed',
            'Food collected',
            "{$request->user()->name} confirmed receiving \"{$order->foodDonation?->title}\"."
        );

        return response()->json([
            'success' => true,
            'data' => new OrderResource($this->withDetail($order)),
            'message' => 'Request marked as completed',
        ]);
    }

    private function authorizeReceiver(Request $request, Order $order): void
    {
        abort_unless($order->receiver_id === $request->user()->id, 403, 'This request is not yours.');
    }

    /** Everything the request detail screen renders, in one trip. */
    private function withDetail(Order $order): Order
    {
        return $order->load([
            'rating',
            'receiver',
            'foodDonation.category',
            'foodDonation.donor.country',
            'foodDonation.donor' => fn ($query) => $query
                ->withAvg('ratingsReceived', 'stars')
                ->withCount('ratingsReceived'),
        ]);
    }

    public function store(Request $request, WalletService $wallet, FoodSplitService $splitter): JsonResponse
    {
        $data = $request->validate([
            'food_donation_id' => ['required', 'exists:food_donations,id'],
            'delivery_method' => ['required', 'in:pickup,delivery'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'units' => ['nullable', 'integer', 'min:1'],
        ]);

        $food = FoodDonation::findOrFail($data['food_donation_id']);

        if ($food->status !== FoodStatus::Published || $food->expiry_date->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'This food is no longer available',
            ], 422);
        }

        // A whole batch is always claimed in one piece; only a split one lets
        // the receiver decide how much they can actually use.
        $units = $food->isSplit() ? max(1, (int) ($data['units'] ?? 1)) : 1;

        if ($food->isSplit() && $units > $food->units_available) {
            return response()->json([
                'success' => false,
                'message' => $food->units_available > 0
                    ? "Only {$food->units_available} units are left."
                    : 'This food is no longer available',
            ], 422);
        }

        $points = $food->points_required * $units;

        try {
            $order = DB::transaction(function () use ($request, $wallet, $splitter, $food, $data, $units, $points) {
                $splitter->claim($food, $units);

                $wallet->deduct($request->user(), $points, 'order', 'food ' . $food->id);

                if ($splitter->shouldReserve($food)) {
                    $food->update(['status' => FoodStatus::Reserved]);
                }

                return Order::create([
                    'receiver_id' => $request->user()->id,
                    'food_donation_id' => $food->id,
                    'points_spent' => $points,
                    'units' => $units,
                    'delivery_method' => $data['delivery_method'],
                    'delivery_address' => $data['delivery_address'] ?? null,
                    'status' => OrderStatus::Pending,
                ]);
            });
        } catch (InsufficientPointsException) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have enough points for this food',
            ], 422);
        } catch (OutOfStockException) {
            return response()->json([
                'success' => false,
                'message' => 'Someone just claimed the last of this food',
            ], 422);
        }

        $order->load('foodDonation.category');

        $this->notifyDonor(
            $order,
            'order.requested',
            'New request for your food',
            "{$request->user()->name} requested \"{$food->title}\"."
        );

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
            'message' => 'Request placed',
        ], 201);
    }

    /**
     * Tells the person who shared the food that something happened to their
     * listing. Never notifies someone about their own action.
     */
    private function notifyDonor(Order $order, string $type, string $title, string $body): void
    {
        $donor = $order->foodDonation?->donor;

        if ($donor && $donor->id !== $order->receiver_id) {
            $donor->notify(new KugawanaNotification($type, $title, $body, 'food/shared', $order->food_donation_id));
        }
    }
}
