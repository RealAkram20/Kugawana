<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

enum TransactionType: string implements HasLabel
{
    case Credit = 'credit';
    case Debit = 'debit';

    public function getLabel(): string
    {
        return ucfirst($this->value);
    }
}
