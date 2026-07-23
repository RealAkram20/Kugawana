<?php

namespace App\Services;

use App\Models\RewardCampaign;
use App\Models\User;
use App\Models\WalletTransaction;

class RewardService
{
    public function __construct(private WalletService $wallet)
    {
    }

    public function award(User $user, string $type, ?string $reference = null): int
    {
        $now = now();

        $campaigns = RewardCampaign::where('is_active', true)
            ->where('type', $type)
            ->where(fn ($q) => $q->whereNull('country_id')->orWhere('country_id', $user->country_id))
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->get();

        $awarded = 0;

        foreach ($campaigns as $campaign) {
            $ref = 'reward:' . $campaign->id . ':' . ($reference ?? $user->id);

            if (WalletTransaction::where('user_id', $user->id)->where('reference', $ref)->exists()) {
                continue;
            }

            $this->wallet->credit($user, $campaign->points, 'reward: ' . $campaign->name, $ref);
            $awarded += $campaign->points;
        }

        return $awarded;
    }
}
