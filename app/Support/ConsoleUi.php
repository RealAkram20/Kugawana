<?php

namespace App\Support;

class ConsoleUi
{
    public static function tagClass(string $status): string
    {
        return match (strtolower($status)) {
            'pending', 'flagged', 'out for delivery' => 'tag-accent',
            'reviewed', 'rejected', 'cancelled', 'suspended', 'scheduled', 'draft', 'off', 'hidden', 'disabled' => 'tag-outline',
            default => 'tag-neutral',
        };
    }

    public static function initials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name)) ?: [];
        $letters = array_map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)), array_slice($words, 0, 2));

        return implode('', $letters) ?: '?';
    }
}
