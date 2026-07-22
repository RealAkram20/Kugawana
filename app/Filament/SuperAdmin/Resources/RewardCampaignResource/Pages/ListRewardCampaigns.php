<?php

namespace App\Filament\SuperAdmin\Resources\RewardCampaignResource\Pages;

use App\Filament\SuperAdmin\Resources\RewardCampaignResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRewardCampaigns extends ListRecords
{
    protected static string $resource = RewardCampaignResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
