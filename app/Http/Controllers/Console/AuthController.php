<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            if (! Auth::user()->isAdmin() || ! Auth::user()->is_active) {
                Auth::logout();

                return back()->withErrors(['email' => 'This account does not have admin access'])->onlyInput('email');
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
