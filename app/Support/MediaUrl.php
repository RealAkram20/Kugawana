<?php

namespace App\Support;

class MediaUrl
{
    /**
     * Absolute URL for a stored media path.
     *
     * Built from the *incoming request host* rather than APP_URL, so the same
     * backend serves working image links to a desktop browser on localhost and
     * to a phone on the LAN without any per-network configuration. Paths that
     * are already absolute (seeded remote images) are returned untouched.
     */
    public static function for(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    /** @param  array<int, string>|null  $paths */
    public static function all(?array $paths): array
    {
        return collect($paths ?? [])
            ->map(fn ($path) => self::for($path))
            ->filter()
            ->values()
            ->all();
    }
}
