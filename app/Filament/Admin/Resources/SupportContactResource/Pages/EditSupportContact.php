<?php

namespace App\Filament\Admin\Resources\SupportContactResource\Pages;

use App\Filament\Admin\Resources\SupportContactResource;
use Filament\Resources\Pages\EditRecord;

class EditSupportContact extends EditRecord
{
    protected static string $resource = SupportContactResource::class;

    protected function getRedirectUrl(): ?string
    {
        return $this->getResource()::getUrl('index');
    }
}
