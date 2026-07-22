<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum OrderStatus: string implements HasLabel, HasColor
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Accepted => 'info',
            self::Completed => 'success',
            self::Cancelled => 'danger',
        };
    }
}
