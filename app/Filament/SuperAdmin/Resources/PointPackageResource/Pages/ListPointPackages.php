<?php

namespace App\Filament\SuperAdmin\Resources\PointPackageResource\Pages;

use App\Filament\SuperAdmin\Resources\PointPackageResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPointPackages extends ListRecords
{
    protected static string $resource = PointPackageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
