<?php

namespace App\Filament\Admin\Widgets;

use App\Enums\FoodStatus;
use App\Enums\TopupStatus;
use App\Enums\UserRole;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTopup;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class CountryStatsWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        $countryId = auth()->user()->role === UserRole::CountryAdmin
            ? auth()->user()->country_id
            : null;

        $donations = FoodDonation::query()
            ->when($countryId, fn ($q) => $q->where('country_id', $countryId));

        $pendingTopups = WalletTopup::query()
            ->where('status', TopupStatus::Pending)
            ->when($countryId, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('country_id', $countryId)));

        return [
            Stat::make('Pending donations', (clone $donations)->where('status', FoodStatus::Pending)->count()),
            Stat::make('Active listings', (clone $donations)->published()->count()),
            Stat::make('Pending topups', $pendingTopups->count()),
            Stat::make('Orders today', Order::whereDate('created_at', today())->count()),
            Stat::make('Users', User::whereIn('role', [UserRole::Donor, UserRole::Receiver])
                ->when($countryId, fn ($q) => $q->where('country_id', $countryId))
                ->count()),
        ];
    }
}
