<?php

namespace App\Support;

use App\Models\MailSetting;
use Illuminate\Support\Facades\Schema;
use Throwable;

class MailConfig
{
    /**
     * Point Laravel's mailer at the SMTP connection a super admin saved. Called on
     * every boot; a no-op until a host is entered, so a fresh install (or one that
     * never configures SMTP) keeps whatever the .env mailer is.
     */
    public static function apply(): void
    {
        try {
            if (! Schema::hasTable('mail_settings')) {
                return;
            }
        } catch (Throwable) {
            // Database not reachable yet (e.g. during install) — nothing to apply.
            return;
        }

        $setting = MailSetting::current();

        if (! $setting->isSmtpConfigured()) {
            return;
        }

        // 'smtps' means implicit TLS on the wire (port 465); plain 'smtp' lets the
        // transport negotiate STARTTLS where the server offers it (port 587).
        $scheme = $setting->smtp_encryption === 'ssl' ? 'smtps' : 'smtp';

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.scheme' => $scheme,
            'mail.mailers.smtp.host' => $setting->smtp_host,
            'mail.mailers.smtp.port' => $setting->smtp_port,
            'mail.mailers.smtp.username' => $setting->smtp_username,
            'mail.mailers.smtp.password' => $setting->smtp_password,
        ]);

        if (filled($setting->from_address)) {
            config([
                'mail.from.address' => $setting->from_address,
                'mail.from.name' => $setting->from_name ?: config('app.name'),
            ]);
        }
    }
}
