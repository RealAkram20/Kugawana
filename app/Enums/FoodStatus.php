<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum FoodStatus: string implements HasLabel, HasColor
{
    case Pending = 'pending';
    case Reviewed = 'reviewed';
    case Approved = 'approved';
    case Collected = 'collected';
    case Stored = 'stored';
    case Published = 'published';
    case Reserved = 'reserved';
    case Delivered = 'delivered';
    case Completed = 'completed';
    case Rejected = 'rejected';
    case Expired = 'expired';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Reviewed => 'info',
            self::Approved => 'primary',
            self::Collected, self::Stored => 'gray',
            self::Published => 'success',
            self::Reserved => 'info',
            self::Delivered, self::Completed => 'success',
            self::Rejected, self::Expired => 'danger',
        };
    }
}
