<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailSetting extends Model
{
    protected $fillable = [
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'from_address',
        'from_name',
        'verify_users_enabled',
        'verify_admins_enabled',
    ];

    protected $casts = [
        'smtp_port' => 'integer',
        'smtp_password' => 'encrypted',
        'verify_users_enabled' => 'boolean',
        'verify_admins_enabled' => 'boolean',
    ];

    /** The one and only settings row, created on demand. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /** Whether a working SMTP host has been entered — mail can actually be sent. */
    public function isSmtpConfigured(): bool
    {
        return filled($this->smtp_host);
    }

    /**
     * Does this user have to verify their email before signing in? Driven by the
     * two per-audience switches; admins and members are toggled separately.
     */
    public function requiresVerification(User $user): bool
    {
        return $user->isAdmin()
            ? $this->verify_admins_enabled
            : $this->verify_users_enabled;
    }
}
