<?php

namespace App\Filament\SuperAdmin\Widgets;

use App\Enums\TopupStatus;
use App\Enums\UserRole;
use App\Models\Country;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTopup;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class GlobalStatsWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Active countries', Country::where('is_active', true)->count()),
            Stat::make('Total users', User::whereIn('role', [UserRole::Donor, UserRole::Receiver])->count()),
            Stat::make('Total donations', FoodDonation::count()),
            Stat::make('Orders completed', Order::whereNotNull('completed_at')->count()),
            Stat::make('Revenue', 'UGX ' . number_format((float) WalletTopup::where('status', TopupStatus::Approved)->sum('amount'))),
        ];
    }
}
