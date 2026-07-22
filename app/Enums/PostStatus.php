<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum PostStatus: string implements HasLabel, HasColor
{
    case Published = 'published';
    case Hidden = 'hidden';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Published => 'success',
            self::Hidden => 'danger',
        };
    }
}
