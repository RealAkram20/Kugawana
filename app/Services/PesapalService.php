<?php

namespace App\Services;

use App\Models\WalletTopup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PesapalService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.pesapal.base_url'), '/');
    }

    public function isConfigured(): bool
    {
        return filled(config('services.pesapal.consumer_key'))
            && filled(config('services.pesapal.consumer_secret'));
    }

    public function token(): string
    {
        return Cache::remember('pesapal_token', now()->addMinutes(4), function () {
            $response = Http::acceptJson()
                ->post($this->baseUrl . '/api/Auth/RequestToken', [
                    'consumer_key' => config('services.pesapal.consumer_key'),
                    'consumer_secret' => config('services.pesapal.consumer_secret'),
                ]);

            $token = $response->json('token');

            if (! $response->successful() || blank($token)) {
                throw new RuntimeException('Pesapal authentication failed: ' . $response->body());
            }

            return $token;
        });
    }

    public function notificationId(): string
    {
        $configured = config('services.pesapal.ipn_id');

        if (filled($configured)) {
            return $configured;
        }

        return Cache::rememberForever('pesapal_ipn_id', function () {
            $response = Http::acceptJson()
                ->withToken($this->token())
                ->post($this->baseUrl . '/api/URLSetup/RegisterIPN', [
                    'url' => config('services.pesapal.ipn_url'),
                    'ipn_notification_type' => 'GET',
                ]);

            $id = $response->json('ipn_id');

            if (! $response->successful() || blank($id)) {
                throw new RuntimeException('Pesapal IPN registration failed: ' . $response->body());
            }

            return $id;
        });
    }

    public function submitOrder(WalletTopup $topup): array
    {
        $user = $topup->user;
        $reference = 'KGW-' . $topup->id;

        $response = Http::acceptJson()
            ->withToken($this->token())
            ->post($this->baseUrl . '/api/Transactions/SubmitOrderRequest', [
                'id' => $reference,
                'currency' => $topup->currency,
                'amount' => (float) $topup->amount,
                'description' => $topup->points . ' Kugawana points',
                'callback_url' => config('services.pesapal.callback_url'),
                'notification_id' => $this->notificationId(),
                'billing_address' => [
                    'email_address' => $user->email,
                    'phone_number' => $user->phone,
                    'first_name' => $user->name,
                ],
            ]);

        $trackingId = $response->json('order_tracking_id');
        $redirectUrl = $response->json('redirect_url');

        if (! $response->successful() || blank($trackingId) || blank($redirectUrl)) {
            throw new RuntimeException('Pesapal order request failed: ' . $response->body());
        }

        return [
            'reference' => $reference,
            'order_tracking_id' => $trackingId,
            'redirect_url' => $redirectUrl,
        ];
    }

    public function transactionStatus(string $orderTrackingId): array
    {
        $response = Http::acceptJson()
            ->withToken($this->token())
            ->get($this->baseUrl . '/api/Transactions/GetTransactionStatus', [
                'orderTrackingId' => $orderTrackingId,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Pesapal status check failed: ' . $response->body());
        }

        return [
            'status' => strtoupper((string) $response->json('payment_status_description')),
            'reference' => $response->json('merchant_reference'),
            'method' => $response->json('payment_method'),
        ];
    }
}
