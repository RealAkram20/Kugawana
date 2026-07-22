<?php

namespace App\Filament\Admin\Resources\WalletTopupResource\Pages;

use App\Filament\Admin\Resources\WalletTopupResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListWalletTopups extends ListRecords
{
    protected static string $resource = WalletTopupResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
