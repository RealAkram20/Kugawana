<?php

namespace App\Filament\Admin\Resources\FoodDonationResource\Pages;

use App\Enums\FoodStatus;
use App\Filament\Admin\Resources\FoodDonationResource;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;

class ListFoodDonations extends ListRecords
{
    protected static string $resource = FoodDonationResource::class;

    public function getTabs(): array
    {
        return [
            'active' => Tab::make('Active')
                ->modifyQueryUsing(fn ($query) => $query->whereIn('status', [
                    FoodStatus::Pending,
                    FoodStatus::Reviewed,
                    FoodStatus::Approved,
                    FoodStatus::Collected,
                    FoodStatus::Stored,
                    FoodStatus::Published,
                    FoodStatus::Reserved,
                ])),
            'expired' => Tab::make('Expired')
                ->modifyQueryUsing(fn ($query) => $query->where('status', FoodStatus::Expired)),
            'completed' => Tab::make('Completed')
                ->modifyQueryUsing(fn ($query) => $query->whereIn('status', [
                    FoodStatus::Delivered,
                    FoodStatus::Completed,
                ])),
            'rejected' => Tab::make('Rejected')
                ->modifyQueryUsing(fn ($query) => $query->where('status', FoodStatus::Rejected)),
            'all' => Tab::make('All'),
        ];
    }
}
