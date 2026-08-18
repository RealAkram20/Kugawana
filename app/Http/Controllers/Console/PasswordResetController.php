<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\View\View;

/**
 * "Forgot password" for the admin console. Only admin accounts can reset from
 * here — members reset through the mobile app — but the responses never say so,
 * because a message that changes with the address is an account-enumeration
 * oracle.
 */
class PasswordResetController extends Controller
{
    /** The same reply whether or not the address exists, or mail even sent. */
    private const NEUTRAL = 'If that email belongs to an admin account, a reset link is on its way. Check your inbox and spam folder.';

    public function request(): View
    {
        return view('console.passwords.request');
    }

    public function email(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        // Silently skip non-admins, deactivated accounts, and Google-only
        // logins (no password to reset) — all get NEUTRAL back regardless.
        if ($user && $user->isAdmin() && $user->is_active) {
            try {
                $status = Password::sendResetLink(['email' => $user->email]);

                if ($status !== Password::RESET_LINK_SENT) {
                    Log::warning('Console password reset link not sent', ['email' => $user->email, 'status' => $status]);
                }
            } catch (\Throwable $e) {
                // Almost always SMTP not configured or refusing the connection.
                Log::error('Console password reset mail failed', ['email' => $user->email, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('status', self::NEUTRAL);
    }

    public function reset(Request $request, string $token): View
    {
        return view('console.passwords.reset', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('console.login')->with('status', 'Password updated — sign in with your new password.');
        }

        return back()
            ->withInput($request->only('email'))
            ->withErrors(['email' => __($status)]);
    }
}
