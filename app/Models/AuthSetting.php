<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthSetting extends Model
{
    protected $fillable = [
        'google_enabled',
        'google_web_client_id',
        'google_android_client_id',
        'google_ios_client_id',
    ];

    protected $casts = [
        'google_enabled' => 'boolean',
    ];

    /**
     * The one and only settings row, created on demand so a fresh install always
     * has something to edit rather than an empty table.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /**
     * Client IDs Google tokens are accepted from, as audiences. Uses whatever the
     * admin saved, falling back to the env values so an install configured the old
     * way keeps working until the console form is filled in.
     *
     * @return array<int, string>
     */
    public function googleClientIds(): array
    {
        $saved = array_filter([
            $this->google_web_client_id,
            $this->google_android_client_id,
            $this->google_ios_client_id,
        ]);

        return $saved
            ? array_values($saved)
            : config('services.google.client_ids', []);
    }
}
