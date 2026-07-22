<?php

namespace App\Jobs;

use App\Enums\FoodStatus;
use App\Models\FoodDonation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireOverdueFoodJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        FoodDonation::where('status', FoodStatus::Published)
            ->where('expiry_date', '<', now())
            ->update(['status' => FoodStatus::Expired]);
    }
}
