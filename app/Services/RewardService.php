<?php

namespace App\Services;

use App\Models\RewardCampaign;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\KugawanaNotification;
use Illuminate\Support\Facades\DB;

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

            // The already-paid check and the credit must sit under one user
            // row lock, or two concurrent triggers with the same reference
            // both pass the check and both pay. A unique index can't back
            // this up — order debits legitimately reuse their reference —
            // so the lock is the only line of defence.
            $paid = DB::transaction(function () use ($user, $campaign, $ref) {
                $locked = User::lockForUpdate()->find($user->id);

                if (WalletTransaction::where('user_id', $locked->id)->where('reference', $ref)->exists()) {
                    return false;
                }

                $this->wallet->credit($locked, $campaign->points, 'reward: ' . $campaign->name, $ref);

                return true;
            });

            if ($paid) {
                $awarded += $campaign->points;
            }
        }

        if ($awarded > 0) {
            $user->notify(new KugawanaNotification(
                'reward.earned',
                'You earned points',
                $awarded . ' points were added to your wallet.',
                'wallet',
            ));
        }

        return $awarded;
    }
}
