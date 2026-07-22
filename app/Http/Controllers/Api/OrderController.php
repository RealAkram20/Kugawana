<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Enums\OrderStatus;
use App\Exceptions\InsufficientPointsException;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['foodDonation.category'])
            ->where('receiver_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
            'message' => 'Orders retrieved',
        ]);
    }

    public function store(Request $request, WalletService $wallet): JsonResponse
    {
        $data = $request->validate([
            'food_donation_id' => ['required', 'exists:food_donations,id'],
            'delivery_method' => ['required', 'in:pickup,delivery'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
        ]);

        $food = FoodDonation::findOrFail($data['food_donation_id']);

        if ($food->status !== FoodStatus::Published || $food->expiry_date->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'This food is no longer available',
            ], 422);
        }

        try {
            $order = DB::transaction(function () use ($request, $wallet, $food, $data) {
                $wallet->deduct($request->user(), $food->points_required, 'order', 'food ' . $food->id);

                $food->update(['status' => FoodStatus::Reserved]);

                return Order::create([
                    'receiver_id' => $request->user()->id,
                    'food_donation_id' => $food->id,
                    'points_spent' => $food->points_required,
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
        }

        $order->load('foodDonation.category');

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
            'message' => 'Request placed',
        ], 201);
    }
}
