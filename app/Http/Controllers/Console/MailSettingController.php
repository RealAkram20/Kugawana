<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MailSetting;
use App\Support\MailConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class MailSettingController extends Controller
{
    public function edit(): View
    {
        $setting = MailSetting::current();

        return view('console.settings.mail', [
            'title' => 'Email settings',
            'setting' => $setting,
            'hasPassword' => filled($setting->smtp_password),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'smtp_host' => ['nullable', 'string', 'max:255'],
            'smtp_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'smtp_username' => ['nullable', 'string', 'max:255'],
            'smtp_password' => ['nullable', 'string', 'max:255'],
            'smtp_encryption' => ['required', Rule::in(['tls', 'ssl', 'none'])],
            'from_address' => ['nullable', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        $data['verify_users_enabled'] = $request->boolean('verify_users_enabled');
        $data['verify_admins_enabled'] = $request->boolean('verify_admins_enabled');

        // A blank password keeps the stored one — the form never echoes it back.
        if (blank($data['smtp_password'] ?? null)) {
            unset($data['smtp_password']);
        }

        MailSetting::current()->update($data);

        return redirect()
            ->route('console.settings.mail.edit')
            ->with('toast', 'Email settings saved');
    }

    /** Sends a test message to the signed-in admin using the saved SMTP settings. */
    public function test(Request $request): RedirectResponse
    {
        $setting = MailSetting::current();

        if (! $setting->isSmtpConfigured()) {
            return back()->with('toast', 'Enter an SMTP host first, then send a test.');
        }

        // Re-apply in case settings changed this request before sending.
        MailConfig::apply();
        $to = $request->user()->email;

        try {
            Mail::raw(
                'This is a test email from Kugawana. Your SMTP settings are working.',
                fn ($message) => $message->to($to)->subject('Kugawana test email'),
            );

            return back()->with('toast', "Test email sent to {$to}.");
        } catch (\Throwable $e) {
            report($e);

            return back()->with('toast', 'Could not send the test email. Check the SMTP host, port and credentials.');
        }
    }
}
