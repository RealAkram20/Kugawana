<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
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
    }
}
