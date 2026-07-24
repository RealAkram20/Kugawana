<?php

namespace App\Filament\Admin\Resources\SupportPageResource\Pages;

use App\Filament\Admin\Resources\SupportPageResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSupportPages extends ListRecords
{
    protected static string $resource = SupportPageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
