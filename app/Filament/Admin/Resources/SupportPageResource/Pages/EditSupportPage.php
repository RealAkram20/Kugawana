<?php

namespace App\Filament\Admin\Resources\SupportPageResource\Pages;

use App\Filament\Admin\Resources\SupportPageResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSupportPage extends EditRecord
{
    protected static string $resource = SupportPageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
