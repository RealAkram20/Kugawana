<?php

namespace App\Jobs;

use App\Enums\TopupStatus;
use App\Models\WalletTopup;
use App\Services\PesapalService;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * A member who opens Pesapal checkout and closes it leaves a Pending row behind
 * forever. Those rows are the bait for the "approve it anyway" mistake, so each
 * one is settled here: asked once more at the gateway, credited if it really did
 * pay, and otherwise rejected so it leaves the admin queue.
 */
class ExpireStalePesapalTopupsJob implements ShouldQueue
{
    use Queueable;

    /** Long enough for slow mobile-money confirmations to land. */
    private const STALE_AFTER_HOURS = 6;

    public function handle(PesapalService $pesapal, WalletService $wallet): void
    {
        $stale = WalletTopup::query()
            ->where('status', TopupStatus::Pending)
            ->where('payment_method', 'pesapal')
            ->where('created_at', '<', now()->subHours(self::STALE_AFTER_HOURS))
            ->limit(100)
            ->get();

        foreach ($stale as $topup) {
            if (blank($topup->order_tracking_id) || ! $pesapal->isConfigured()) {
                $topup->update(['status' => TopupStatus::Rejected]);

                continue;
            }

            try {
                $result = $pesapal->transactionStatus($topup->order_tracking_id);
            } catch (Throwable $e) {
                // Gateway unreachable: leave it pending and retry next run rather
                // than rejecting a payment that may have gone through.
                Log::warning('Stale top-up check failed', ['topup' => $topup->id, 'error' => $e->getMessage()]);

                continue;
            }

            if ($result['status'] === 'COMPLETED'
                && $pesapal->matches($topup, $result)
                && $pesapal->mayCredit()) {
                $wallet->applyTopup($topup);

                continue;
            }

            $topup->update(['status' => TopupStatus::Rejected]);
        }
    }
}
