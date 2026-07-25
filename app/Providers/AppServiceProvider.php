<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Livewire\Mechanisms\HandleRequests\HandleRequests;

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
}
