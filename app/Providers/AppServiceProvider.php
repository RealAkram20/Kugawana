<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Livewire\Mechanisms\HandleRequests\HandleRequests;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->extend(HandleRequests::class, function (HandleRequests $handler) {
            return new class extends HandleRequests
            {
                public function getUpdateUri()
                {
                    return url('/livewire/update');
                }
            };
        });
    }

    public function boot(): void
    {
        if (! $this->app->runningInConsole()) {
            config(['livewire.asset_url' => url('/livewire/livewire.js')]);
        }

        Paginator::defaultView('console.partials.pagination');
        Paginator::defaultSimpleView('console.partials.pagination');

        // Route outgoing mail through the SMTP connection the super admin saved.
        \App\Support\MailConfig::apply();

        // The web-push library raises an E_USER_NOTICE when neither GMP nor
        // BCMath is installed ("highly recommended ... to speed up"), and
        // Laravel escalates notices to exceptions — which killed every console
        // push on shared hosting. The library works fine without them, so
        // construct the client with that notice masked. This contextual binding
        // replaces the one the package registered.
        $this->app->when(WebPushChannel::class)
            ->needs(WebPush::class)
            ->give(function (): WebPush {
                $level = error_reporting();
                error_reporting($level & ~E_USER_NOTICE);

                try {
                    return (new WebPush(
                        $this->webPushAuth(), [], 30, config('webpush.client_options', [])
                    ))
                        ->setReuseVAPIDHeaders(true)
                        ->setAutomaticPadding(config('webpush.automatic_padding'));
                } finally {
                    error_reporting($level);
                }
            });

        // Credential guessing / account enumeration guards for the login and
        // sign-up surfaces (mobile API and console). Keyed by IP + the
        // identifier being tried, so one IP can't lock out someone else's
        // account by hammering it, but is still capped overall.
        RateLimiter::for('auth', function ($request) {
            $identifier = (string) ($request->input('identifier') ?? $request->input('email') ?? '');

            return Limit::perMinute(10)->by($request->ip().'|'.$identifier);
        });

        RateLimiter::for('email-verification', function ($request) {
            $email = (string) $request->input('email');

            return Limit::perMinutes(5, 3)->by($request->ip().'|'.$email);
        });
    }

    /**
     * VAPID credentials in the shape the web-push client expects — the same
     * logic the package's own provider uses, duplicated here because our
     * binding replaces its.
     *
     * @return array<string, mixed>
     */
    private function webPushAuth(): array
    {
        $publicKey = config('webpush.vapid.public_key');
        $privateKey = config('webpush.vapid.private_key');

        if (empty($publicKey) || empty($privateKey)) {
            return [];
        }

        return [
            'VAPID' => [
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
                'subject' => config('webpush.vapid.subject') ?: url('/'),
            ],
        ];
    }
}
