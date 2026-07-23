<?php

namespace App\Http\Controllers\Api;

use App\Enums\TopupStatus;
use App\Http\Controllers\Controller;
use App\Models\PointPackage;
use App\Models\WalletTopup;
use App\Services\PesapalService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    public function topup(Request $request, PesapalService $pesapal): JsonResponse
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

        if ($data['payment_method'] === 'manual') {
            return response()->json([
                'success' => true,
                'data' => ['id' => $topup->id, 'status' => $topup->status->value],
                'message' => 'Topup request received. Points arrive after approval',
            ], 201);
        }

        if (! $pesapal->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Online payment is not available yet',
            ], 503);
        }

        try {
            $order = $pesapal->submitOrder($topup);
        } catch (\Throwable $e) {
            Log::error('Pesapal submit order failed', ['topup' => $topup->id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Could not start the payment. Please try again',
            ], 502);
        }

        $topup->update([
            'merchant_reference' => $order['reference'],
            'order_tracking_id' => $order['order_tracking_id'],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $topup->id,
                'status' => $topup->status->value,
                'redirect_url' => $order['redirect_url'],
                'order_tracking_id' => $order['order_tracking_id'],
            ],
            'message' => 'Payment ready',
        ], 201);
    }

    public function topupStatus(Request $request, WalletTopup $topup, PesapalService $pesapal, WalletService $wallet): JsonResponse
    {
        abort_unless($topup->user_id === $request->user()->id, 403);

        if ($topup->status === TopupStatus::Pending && $topup->order_tracking_id && $pesapal->isConfigured()) {
            try {
                $result = $pesapal->transactionStatus($topup->order_tracking_id);

                if ($result['status'] === 'COMPLETED') {
                    $wallet->applyTopup($topup);
                } elseif ($result['status'] === 'FAILED' || $result['status'] === 'INVALID') {
                    $topup->update(['status' => TopupStatus::Rejected]);
                }
            } catch (\Throwable $e) {
                Log::warning('Pesapal status check failed', ['topup' => $topup->id, 'error' => $e->getMessage()]);
            }

            $topup->refresh();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $topup->id,
                'status' => $topup->status->value,
                'balance' => $request->user()->fresh()->wallet_balance,
            ],
            'message' => 'Status retrieved',
        ]);
    }

    public function pesapalIpn(Request $request, PesapalService $pesapal, WalletService $wallet): JsonResponse
    {
        $trackingId = $request->query('OrderTrackingId');
        $topup = WalletTopup::where('order_tracking_id', $trackingId)->first();

        if ($topup && $topup->status === TopupStatus::Pending && $pesapal->isConfigured()) {
            try {
                if ($pesapal->transactionStatus($trackingId)['status'] === 'COMPLETED') {
                    $wallet->applyTopup($topup);
                }
            } catch (\Throwable $e) {
                Log::warning('Pesapal IPN handling failed', ['tracking' => $trackingId, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'orderNotificationType' => $request->query('OrderNotificationType'),
            'orderTrackingId' => $trackingId,
            'orderMerchantReference' => $request->query('OrderMerchantReference'),
            'status' => 200,
        ]);
    }

    public function pesapalCallback()
    {
        return response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<body style="font-family:sans-serif;text-align:center;padding:48px">'
            . '<h2>Payment complete</h2><p>You can return to the app.</p></body>'
        )->header('Content-Type', 'text/html');
    }
}
