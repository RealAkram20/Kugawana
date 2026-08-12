<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'console.admin' => \App\Http\Middleware\EnsureConsoleAdmin::class,
            'console.super' => \App\Http\Middleware\EnsureSuperAdmin::class,
            'phone.required' => \App\Http\Middleware\EnsureHasPhone::class,
        ]);

        $middleware->redirectGuestsTo(function ($request) {
            return $request->is('api/*') || $request->expectsJson()
                ? null
                : route('console.login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // The API has no login screen to send anyone to. Without this, an
        // unauthenticated /api call that doesn't ask for JSON falls through to
        // the web handler, which looks for a route named "login" and 500s
        // instead of answering 401.
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
