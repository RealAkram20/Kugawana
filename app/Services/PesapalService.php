<?php

namespace App\Services;

use App\Models\PaymentSetting;
use App\Models\WalletTopup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PesapalService
{
    private PaymentSetting $setting;

    public function __construct()
    {
        // Super-admin console settings take precedence; anything left blank there
        // falls back to config/.env, so existing deployments and local dev keep
        // working without a database row.
        $this->setting = PaymentSetting::current();
    }

    public function isConfigured(): bool
    {
        return $this->isEnabled()
            && filled($this->consumerKey())
            && filled($this->consumerSecret());
    }

    public function token(): string
    {
        return Cache::remember('pesapal_token', now()->addMinutes(4), function () {
            $response = Http::acceptJson()
                ->post($this->baseUrl() . '/api/Auth/RequestToken', [
                    'consumer_key' => $this->consumerKey(),
                    'consumer_secret' => $this->consumerSecret(),
                ]);

            $token = $response->json('token');

            if (! $response->successful() || blank($token)) {
                throw new RuntimeException('Pesapal authentication failed: ' . $response->body());
            }

            return $token;
        });
    }

    /**
     * The IPN id Pesapal notifies for this merchant. A stored id (set by the admin
     * or captured from an earlier registration) is reused; otherwise one is
     * registered now and persisted, so it survives cache clears and never
     * duplicates on Pesapal's side.
     */
    public function notificationId(): string
    {
        if (filled($this->setting->pesapal_ipn_id)) {
            return $this->setting->pesapal_ipn_id;
        }

        if (filled(config('services.pesapal.ipn_id'))) {
            return config('services.pesapal.ipn_id');
        }

        $id = $this->registerIpn();
        $this->setting->update(['pesapal_ipn_id' => $id]);

        return $id;
    }

    /**
     * Register this merchant's IPN URL with Pesapal and return the new id. Kept
     * separate from persistence so callers (a payment, a settings save, or the
     * admin's "Register IPN" button) decide when to store it.
     */
    public function registerIpn(): string
    {
        $response = Http::acceptJson()
            ->withToken($this->token())
            ->post($this->baseUrl() . '/api/URLSetup/RegisterIPN', [
                'url' => $this->ipnUrl(),
                'ipn_notification_type' => 'GET',
            ]);

        $id = $response->json('ipn_id');

        if (! $response->successful() || blank($id)) {
            throw new RuntimeException('Pesapal IPN registration failed: ' . $response->body());
        }

        return $id;
    }

    public function submitOrder(WalletTopup $topup): array
    {
        $user = $topup->user;
        $reference = 'KGW-' . $topup->id;

        $response = Http::acceptJson()
            ->withToken($this->token())
            ->post($this->baseUrl() . '/api/Transactions/SubmitOrderRequest', [
                'id' => $reference,
                'currency' => $topup->currency,
                'amount' => (float) $topup->amount,
                'description' => $topup->points . ' Kugawana points',
                'callback_url' => $this->callbackUrl(),
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
            ->get($this->baseUrl() . '/api/Transactions/GetTransactionStatus', [
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

    /** The gateway is live when switched on in the console, or when env holds keys. */
    private function isEnabled(): bool
    {
        return $this->setting->pesapal_enabled
            || filled(config('services.pesapal.consumer_key'));
    }

    private function consumerKey(): ?string
    {
        return $this->setting->pesapal_consumer_key ?: config('services.pesapal.consumer_key');
    }

    private function consumerSecret(): ?string
    {
        return $this->setting->pesapal_consumer_secret ?: config('services.pesapal.consumer_secret');
    }

    private function baseUrl(): string
    {
        // Use the console's chosen environment once a key has been entered there;
        // otherwise honour whatever base URL env is pointing at.
        return filled($this->setting->pesapal_consumer_key)
            ? rtrim($this->setting->pesapalBaseUrl(), '/')
            : rtrim((string) config('services.pesapal.base_url'), '/');
    }

    private function callbackUrl(): ?string
    {
        return $this->setting->pesapal_callback_url ?: config('services.pesapal.callback_url');
    }

    private function ipnUrl(): ?string
    {
        return $this->setting->pesapal_ipn_url ?: config('services.pesapal.ipn_url');
    }
}
