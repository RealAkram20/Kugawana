<?php

namespace App\Services;

use App\Enums\TopupStatus;
use App\Enums\TransactionType;
use App\Exceptions\InsufficientPointsException;
use App\Models\User;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function applyTopup(WalletTopup $topup, ?int $approverId = null): bool
    {
        return DB::transaction(function () use ($topup, $approverId) {
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
