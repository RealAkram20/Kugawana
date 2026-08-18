<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MailSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View|RedirectResponse
    {
        if (Auth::check() && Auth::user()->isAdmin()) {
            return redirect()->route('console.dashboard');
        }

        return view('console.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, true)) {
            $user = Auth::user();

            if (! $user->isAdmin() || ! $user->is_active) {
                Auth::logout();

                return back()->withErrors(['email' => 'This account does not have admin access'])->onlyInput('email');
            }

            // Admin verification gate: send a fresh link and hold them at the login
            // screen until the address is confirmed.
            if (MailSetting::current()->requiresVerification($user) && ! $user->hasVerifiedEmail()) {
                try {
                    $user->sendEmailVerificationNotification();
                } catch (\Throwable $e) {
                    Log::error('Admin verification email failed', ['user' => $user->id, 'error' => $e->getMessage()]);
                }

                Auth::logout();

                return back()
                    ->withErrors(['email' => 'Verify your email to continue — we sent a link to ' . $user->email])
                    ->onlyInput('email');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('console.dashboard'));
        }

        return back()->withErrors(['email' => 'These credentials do not match our records'])->onlyInput('email');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('console.login');
    }
}
