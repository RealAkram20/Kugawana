<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PaymentSetting extends Model
{
    protected $fillable = [
        'pesapal_enabled',
        'pesapal_environment',
        'pesapal_consumer_key',
        'pesapal_consumer_secret',
        'pesapal_ipn_id',
        'pesapal_callback_url',
        'pesapal_ipn_url',
    ];

    protected $casts = [
        'pesapal_enabled' => 'boolean',
        // Kept out of plain sight in the database; decrypted only when the service
        // actually talks to Pesapal.
        'pesapal_consumer_secret' => 'encrypted',
    ];

    /**
     * The one and only settings row, created on demand so a fresh install always
     * has something to edit rather than an empty table.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /** Pesapal's API host for the chosen environment. */
    public function pesapalBaseUrl(): string
    {
        return $this->pesapal_environment === 'live'
            ? 'https://pay.pesapal.com/v3'
            : 'https://cybqa.pesapal.com/pesapalv3';
    }

    /**
     * Registering an IPN and requesting a token are both tied to a specific set of
     * credentials, so their cached results have to be dropped whenever the config
     * changes — otherwise the service keeps using a token minted for the old keys.
     */
    public static function forgetCaches(): void
    {
        Cache::forget('pesapal_token');
        Cache::forget('pesapal_ipn_id');
    }
}
