<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum UserRole: string implements HasLabel
{
    case SuperAdmin = 'super_admin';
    case CountryAdmin = 'country_admin';
    case Donor = 'donor';
    case Receiver = 'receiver';

    public function getLabel(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super admin',
            self::CountryAdmin => 'Country admin',
            self::Donor => 'Donor',
            self::Receiver => 'Receiver',
        };
    }
}
