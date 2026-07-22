<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum TopupStatus: string implements HasLabel, HasColor
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Approved => 'success',
            self::Rejected => 'danger',
        };
    }
}
