<?php

namespace App\Console\Commands;

use App\Enums\FoodStatus;
use App\Models\FoodDonation;
use App\Services\FoodSplitService;
use Illuminate\Console\Command;

/**
 * Turns whole published donations into bundles of smaller consumable units, so
 * there is realistic split stock to test the basket and unit stepper against.
 * Idempotent: anything already split is left alone.
 */
class SplitDemoFood extends Command
{
    protected $signature = 'food:split-demo
        {--points=10 : Points to charge per unit}
        {--all : Also split approved, collected and stored items, not just published}';

    protected $description = 'Split whole food donations into bundles of smaller units for testing';

    /** Count units where a portion is always a whole number of the same thing. */
    private const COUNT_UNITS = ['pcs', 'loaves', 'bunches', 'trays', 'plates', 'pkt'];

    public function handle(FoodSplitService $splitter): int
    {
        $points = max(0, (int) $this->option('points'));

        $statuses = $this->option('all')
            ? [FoodStatus::Published, FoodStatus::Approved, FoodStatus::Collected, FoodStatus::Stored]
            : [FoodStatus::Published];

        $donations = FoodDonation::with('unit')
            ->whereIn('status', $statuses)
            ->whereNull('units_total')
            ->orderBy('id')
            ->get();

        if ($donations->isEmpty()) {
            $this->info('No whole donations left to split.');

            return self::SUCCESS;
        }

        $rows = [];

        foreach ($donations as $donation) {
            $unitAmount = $this->unitSizeFor((float) $donation->amount, $donation->unit?->symbol);

            // A whole that is already one indivisible unit stays whole.
            if ($splitter->unitsFor($donation, $unitAmount) < 2) {
                $rows[] = [$donation->id, $donation->title, $donation->quantity, 'left whole'];

                continue;
            }

            $splitter->split($donation, $unitAmount, $points);
            $donation->refresh()->load('unit');

            $rows[] = [
                $donation->id,
                $donation->title,
                $donation->quantity,
                "{$donation->units_total} × {$donation->unit_quantity} at {$points} pts",
            ];
        }

        $this->table(['ID', 'Title', 'Whole', 'Result'], $rows);
        $this->info('Done. ' . count($donations) . ' donations processed.');

        return self::SUCCESS;
    }

    /**
     * Picks a portion size that leaves a handful of units. Counts stay whole;
     * weights and volumes may be fractional so a small amount still divides.
     */
    private function unitSizeFor(float $amount, ?string $symbol): float
    {
        $isCount = in_array($symbol, self::COUNT_UNITS, true);

        if ($isCount) {
            // 1 piece per unit until there are too many; then group into bundles.
            return $amount <= 10 ? 1.0 : (float) (int) ceil($amount / 10);
        }

        // Aim for roughly `amount` units of 1 for mid sizes, 4 units for tiny
        // amounts, and ~10 bundles for large ones.
        if ($amount < 2) {
            return round($amount / 4, 2);
        }

        $target = min(10, max(2, (int) round($amount)));

        return round($amount / $target, 2);
    }
}
