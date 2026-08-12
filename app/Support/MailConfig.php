<?php

namespace App\Support;

use App\Models\MailSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
            self::warnUnconfigured();

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

    /**
     * With no SMTP host saved, the mailer stays on whatever .env holds — which
     * ships as `log`. Password reset codes and verification links would then be
     * written to storage/logs and never delivered, while every screen still
     * reports success. Say so loudly, throttled so it cannot flood the log.
     */
    private static function warnUnconfigured(): void
    {
        if (app()->environment('local', 'testing') || app()->runningUnitTests()) {
            return;
        }

        try {
            if (! Cache::add('mail-unconfigured-warned', true, now()->addMinutes(15))) {
                return;
            }
        } catch (Throwable) {
            // No cache store available — warn anyway rather than stay silent.
        }

        Log::warning('SMTP is not configured: mail is going to the "' . config('mail.default')
            . '" mailer, so password reset codes and verification emails are NOT being delivered. '
            . 'Fill in every field under console Settings > Email.');
    }
}
