<?php

namespace App\Http\Controllers\Api;

use App\Enums\TopupStatus;
use App\Http\Controllers\Controller;
use App\Models\PointPackage;
use App\Models\WalletTopup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $transactions = $request->user()->walletTransactions()
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($txn) => [
                'id' => $txn->id,
                'type' => $txn->type->value,
                'points' => $txn->points,
                'reason' => $txn->reason,
                'created_at' => $txn->created_at->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $request->user()->wallet_balance,
                'transactions' => $transactions,
            ],
            'message' => 'Wallet retrieved',
        ]);
    }

    public function packages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => PointPackage::where('is_active', true)
                ->orderBy('points')
                ->get(['id', 'name', 'points', 'price', 'currency']),
            'message' => 'Packages retrieved',
        ]);
    }

    public function topup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'point_package_id' => ['required', 'exists:point_packages,id'],
            'payment_method' => ['required', 'in:pesapal,manual'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ]);

        $package = PointPackage::findOrFail($data['point_package_id']);

        $topup = WalletTopup::create([
            'user_id' => $request->user()->id,
            'point_package_id' => $package->id,
            'points' => $package->points,
            'amount' => $package->price,
            'currency' => $package->currency,
            'payment_method' => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'status' => TopupStatus::Pending,
        ]);

        return response()->json([
            'success' => true,
            'data' => ['id' => $topup->id, 'status' => $topup->status->value],
            'message' => 'Topup request received. Points arrive after approval',
        ], 201);
    }
}
