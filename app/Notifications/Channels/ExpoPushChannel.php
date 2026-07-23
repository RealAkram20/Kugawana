<?php

namespace App\Notifications\Channels;

use App\Models\PushToken;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Delivers a notification to every device the user has registered, through
 * Expo's push service. Failures are logged rather than thrown — a dead handset
 * must never break the request that triggered the notification.
 */
class ExpoPushChannel
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /** Expo accepts up to 100 messages per request. */
    private const CHUNK = 100;

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toExpo')) {
            return;
        }

        $tokens = PushToken::where('user_id', $notifiable->getKey())->pluck('token');

        if ($tokens->isEmpty()) {
            return;
        }

        $payload = $notification->toExpo($notifiable);

        $messages = $tokens->map(fn (string $token) => [
            'to' => $token,
            'title' => $payload['title'],
            'body' => $payload['body'],
            'data' => $payload['data'] ?? [],
            'sound' => 'default',
            'channelId' => 'default',
        ]);

        foreach ($messages->chunk(self::CHUNK) as $chunk) {
            $this->deliver($chunk->values()->all());
        }
    }

    private function deliver(array $messages): void
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['Accept-Encoding' => 'gzip, deflate'])
                ->post(self::ENDPOINT, $messages);

            if (! $response->successful()) {
                Log::warning('Expo push rejected', ['status' => $response->status(), 'body' => $response->body()]);

                return;
            }

            $this->pruneDeadTokens($messages, $response->json('data') ?? []);
        } catch (\Throwable $e) {
            Log::warning('Expo push failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Expo reports uninstalled apps as DeviceNotRegistered. Dropping those keeps
     * us from pushing to dead handsets forever.
     */
    private function pruneDeadTokens(array $messages, array $receipts): void
    {
        $dead = [];

        foreach ($receipts as $index => $receipt) {
            $isDead = ($receipt['status'] ?? null) === 'error'
                && ($receipt['details']['error'] ?? null) === 'DeviceNotRegistered';

            if ($isDead && isset($messages[$index]['to'])) {
                $dead[] = $messages[$index]['to'];
            }
        }

        if ($dead) {
            PushToken::whereIn('token', $dead)->delete();
        }
    }
}
