<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VerifyEmailController extends Controller
{
    /**
     * Handles the signed link from a verification email. The 'signed' middleware
     * has already proven the URL was not tampered with; here we confirm the hash
     * matches the address and mark it verified.
     */
    public function __invoke(Request $request, string $id, string $hash): Response
    {
        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->page('This verification link is not valid.', false);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->page('Your email is already verified. You can sign in.', true);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return $this->page('Email verified. You can return to the app and sign in.', true);
    }

    private function page(string $message, bool $ok): Response
    {
        $colour = $ok ? '#2D6A2D' : '#E24B4A';
        $mark = $ok ? '&#10003;' : '&#10007;';

        return response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<body style="font-family:sans-serif;text-align:center;padding:56px 24px;color:#1A1A1A">'
            . '<div style="font-size:48px;color:' . $colour . '">' . $mark . '</div>'
            . '<h2 style="margin:12px 0 4px">Kugawana</h2>'
            . '<p style="font-size:16px;color:#6B6B6B">' . e($message) . '</p></body>'
        )->header('Content-Type', 'text/html');
    }
}
