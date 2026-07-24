<?php

namespace App\Filament\Admin\Resources\SupportContactResource\Pages;

use App\Filament\Admin\Resources\SupportContactResource;
use App\Models\SupportContact;
use Filament\Resources\Pages\ListRecords;

class ListSupportContacts extends ListRecords
{
    protected static string $resource = SupportContactResource::class;

    /**
     * Creating is disabled, so make sure the single settings row exists before the
     * table renders — otherwise an admin lands on an empty list with no way in.
     */
    public function mount(): void
    {
        SupportContact::current();

        parent::mount();
    }
}
