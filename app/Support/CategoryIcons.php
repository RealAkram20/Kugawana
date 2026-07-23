<?php

namespace App\Support;

class CategoryIcons
{
    /**
     * Icon slug per food category. The app maps these to lucide components, so
     * the UI never depends on emoji glyphs rendering consistently per device.
     */
    private const MAP = [
        'Fresh' => 'salad',
        'Frozen' => 'snowflake',
        'Dry foods' => 'wheat',
        'Cooked foods' => 'cooking-pot',
        'Beverages' => 'cup-soda',
        'Bakery' => 'croissant',
        'Baby food' => 'baby',
        'Vegetables' => 'carrot',
        'Fruits' => 'apple',
    ];

    public const FALLBACK = 'utensils';

    public static function for(?string $categoryName): string
    {
        return self::MAP[$categoryName] ?? self::FALLBACK;
    }
}
