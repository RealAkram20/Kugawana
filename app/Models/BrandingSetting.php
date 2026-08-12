<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Throwable;

class BrandingSetting extends Model
{
    protected $fillable = [
        'logo_path',
        'favicon_path',
    ];

    /**
     * The one and only settings row, created on demand so a fresh install always
     * has something to edit rather than an empty table. Every console page and
     * the sign-in screen render through this, so a missing table (mid-deploy,
     * before the migration ran) falls back to defaults instead of a 500.
     */
    public static function current(): self
    {
        try {
            return static::query()->firstOrCreate([]);
        } catch (Throwable) {
            return new self;
        }
    }

    /** The uploaded logo's URL, or null when the built-in wordmark should show. */
    public function logoUrl(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    /** Always resolves — falls back to the favicon shipped with the app. */
    public function faviconUrl(): string
    {
        return $this->favicon_path
            ? Storage::disk('public')->url($this->favicon_path)
            : asset('favicon.ico');
    }
}
