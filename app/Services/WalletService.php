<?php

namespace App\Services;

use App\Enums\TopupStatus;
use App\Enums\TransactionType;
use App\Exceptions\InsufficientPointsException;
use App\Models\User;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use App\Notifications\KugawanaNotification;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function applyTopup(WalletTopup $topup, ?int $approverId = null): bool
    {
        $applied = DB::transaction(function () use ($topup, $approverId) {
            $locked = WalletTopup::lockForUpdate()->find($topup->id);

            if ($locked->status !== TopupStatus::Pending) {
                return false;
            }

            $locked->update([
                'status' => TopupStatus::Approved,
                'approved_by' => $approverId,
                'approved_at' => now(),
            ]);

            $this->credit($locked->user, $locked->points, 'topup', (string) $locked->id);

            return true;
        });

        // Told after the transaction commits so the push never holds the row lock
        // open while it waits on Expo.
        if ($applied) {
            $topup->fresh()->user?->notify(new KugawanaNotification(
                'topup.confirmed',
                'Top-up confirmed',
                $topup->points . ' points were added to your wallet.',
                'wallet',
            ));
        }

        return $applied;
    }

    public function grant(User $user, int $points, string $reason, ?string $reference = null): void
    {
        $this->credit($user, $points, $reason, $reference);

        $user->notify(new KugawanaNotification(
            'points.granted',
            'Points added',
            $points . ' points were added to your wallet.',
            'wallet',
        ));
    }

    public function deduct(User $user, int $points, string $reason, ?string $reference = null): void
    {
        DB::transaction(function () use ($user, $points, $reason, $reference) {
            $locked = User::lockForUpdate()->find($user->id);

            if ($locked->wallet_balance < $points) {
                throw new InsufficientPointsException();
            }

            $locked->decrement('wallet_balance', $points);

            WalletTransaction::create([
                'user_id' => $locked->id,
                'type' => TransactionType::Debit,
                'points' => $points,
                'reason' => $reason,
                'reference' => $reference,
            ]);
        });
    }

    public function credit(User $user, int $points, string $reason, ?string $reference = null): void
    {
        DB::transaction(function () use ($user, $points, $reason, $reference) {
            $user->increment('wallet_balance', $points);

            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => TransactionType::Credit,
                'points' => $points,
                'reason' => $reason,
                'reference' => $reference,
            ]);
        });
    }
}
