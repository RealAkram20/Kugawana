<?php

namespace App\Support;

class PhoneNumber
{
    /**
     * Dial codes for the countries Kugawana operates in. Kept here rather than
     * on the countries table because it is reference data, not configuration.
     */
    public const DIAL_CODES = [
        'UG' => '256',
        'KE' => '254',
        'TZ' => '255',
        'RW' => '250',
        'BI' => '257',
        'SS' => '211',
        'CD' => '243',
    ];

    /**
     * Normalise a locally-written number to bare E.164 digits so it can be used
     * in a wa.me link. Returns null when there is nothing usable, so callers can
     * hide the contact button instead of opening a broken chat.
     */
    public static function toE164(?string $number, ?string $countryCode): ?string
    {
        if (blank($number)) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $number);

        if (blank($digits)) {
            return null;
        }

        $dial = self::DIAL_CODES[strtoupper((string) $countryCode)] ?? null;

        // Already international.
        if (str_starts_with($number, '+') || ($dial && str_starts_with($digits, $dial))) {
            return $digits;
        }

        if (! $dial) {
            return null;
        }

        // Local trunk format, e.g. 0700123456 -> 256700123456.
        return $dial . ltrim($digits, '0');
    }
}
