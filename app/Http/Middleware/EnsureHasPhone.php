<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasPhone
{
    /**
     * Google sign-in issues a working token before any phone number exists,
     * so the app's phone screen is only a suggestion to a stale or modified
     * client. Transactional routes sit behind this guard so nobody can order,
     * donate, or post while unreachable by phone.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->phone) {
            return response()->json([
                'success' => false,
                'code' => 'phone_required',
                'message' => 'Add your phone number to continue.',
            ], 403);
        }

        return $next($request);
    }
}
