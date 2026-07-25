<?php

namespace App\Services;

use App\Enums\TopupStatus;
use App\Enums\TransactionType;
use App\Exceptions\InsufficientPointsException;
use App\Models\User;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use App\Notifications\KugawanaNotification;
use Illuminate\Support\Facades\Cache;
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

    /**
     * Manual admin-initiated grant. Returns false without applying anything
     * if the same admin just made this exact grant to this user a moment
     * ago — guards against a double-submitted form (double click, retried
     * request) granting points twice.
     */
    public function grant(User $user, int $points, string $reason, ?string $reference = null): bool
    {
        $lockKey = sprintf('wallet-grant:%d:%d:%s:%s', $user->id, $points, md5($reason), auth()->id() ?? 'system');

        if (! Cache::add($lockKey, true, now()->addSeconds(5))) {
            return false;
        }

        $this->credit($user, $points, $reason, $reference);

        $user->notify(new KugawanaNotification(
            'points.granted',
            'Points added',
            $points . ' points were added to your wallet.',
            'wallet',
        ));

        return true;
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
