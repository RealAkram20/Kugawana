<?php

namespace App\Filament\SuperAdmin\Resources\CountryAdminResource\Pages;

use App\Filament\SuperAdmin\Resources\CountryAdminResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListCountryAdmins extends ListRecords
{
    protected static string $resource = CountryAdminResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
