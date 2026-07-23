<?php

namespace App\Services;

use App\Enums\FoodStatus;
use App\Enums\UserRole;
use App\Exceptions\OutOfStockException;
use App\Models\FoodDonation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Breaking a bulk donation down into portions people can actually finish. A
 * 10 Kg sack nobody can use becomes ten 1 Kg units, all still on the one
 * listing so the feed does not fill up with copies of the same food.
 */
class FoodSplitService
{
    /** A guard against a typo turning 10 Kg into ten thousand 1 g units. */
    public const MAX_UNITS = 500;

    /**
     * How many whole units a batch yields at this unit size. Anything that does
     * not divide evenly is left over rather than rounded into a short unit.
     */
    public function unitsFor(FoodDonation $donation, float $unitAmount): int
    {
        if ($unitAmount <= 0) {
            return 0;
        }

        return (int) floor(round((float) $donation->amount / $unitAmount, 4));
    }

    public function split(
        FoodDonation $donation,
        float $unitAmount,
        int $pointsPerUnit,
        ?User $admin = null,
        ?User $source = null,
    ): FoodDonation {
        $units = $this->unitsFor($donation, $unitAmount);

        abort_if($units < 1, 422, 'One unit is larger than the whole donation.');
        abort_if($units > self::MAX_UNITS, 422, 'That unit size would create too many units.');

        // Re-splitting an already published batch must not hand back units that
        // receivers have already claimed and paid for.
        $claimed = $donation->unitsClaimed();
        $available = max(0, $units - $claimed);

        $donation->update([
            'unit_amount' => $unitAmount,
            'units_total' => $units,
            'units_available' => $available,
            'points_required' => $pointsPerUnit,
            'split_by' => $admin?->id,
            'split_at' => now(),
            'donor_id' => $source?->id ?? $donation->donor_id,
        ]);

        return $donation->refresh();
    }

    /** Puts the batch back to a single all-or-nothing listing. */
    public function unsplit(FoodDonation $donation): FoodDonation
    {
        $donation->update([
            'unit_amount' => null,
            'units_total' => null,
            'units_available' => null,
            'split_by' => null,
            'split_at' => null,
        ]);

        return $donation->refresh();
    }

    /**
     * Takes units off the shelf. The conditional update is what makes this safe
     * when two receivers claim the last unit at the same moment.
     *
     * @throws OutOfStockException
     */
    public function claim(FoodDonation $donation, int $units): void
    {
        if (! $donation->isSplit()) {
            return;
        }

        $affected = FoodDonation::query()
            ->whereKey($donation->id)
            ->where('units_available', '>=', $units)
            ->decrement('units_available', $units);

        if ($affected === 0) {
            throw new OutOfStockException();
        }

        $donation->refresh();
    }

    /** Returns units to the shelf when a request is cancelled. */
    public function release(FoodDonation $donation, int $units): void
    {
        if (! $donation->isSplit() || $units < 1) {
            return;
        }

        FoodDonation::query()
            ->whereKey($donation->id)
            ->update([
                'units_available' => DB::raw("LEAST(units_total, units_available + {$units})"),
            ]);

        $donation->refresh();
    }

    /**
     * A split batch only leaves the feed once the last unit is gone, so
     * reserving it on the first request would strand the rest.
     */
    public function shouldReserve(FoodDonation $donation): bool
    {
        return ! $donation->isSplit() || $donation->isSoldOut();
    }

    /** Frees a sold out batch back up when units come back from a cancellation. */
    public function republishIfBackInStock(FoodDonation $donation): void
    {
        if ($donation->status === FoodStatus::Reserved && $donation->isSplit() && ! $donation->isSoldOut()) {
            $donation->update(['status' => FoodStatus::Published]);
        }
    }

    /**
     * Records an offline donor so the person who actually brought the food gets
     * the credit on the listing. They get a real account, just without a
     * password until they sign in through the app themselves.
     */
    public function createSource(array $data, ?int $countryId = null): User
    {
        return DB::transaction(fn () => User::create([
            'name' => $data['name'],
            'email' => $data['email'] ?: $this->placeholderEmail($data['name']),
            'phone' => $data['phone'] ?: null,
            'district' => $data['district'] ?? null,
            'country_id' => $data['country_id'] ?? $countryId,
            'role' => UserRole::Donor,
            'password' => null,
        ]));
    }

    /**
     * The users table needs a unique email even for someone who only ever
     * donated at the warehouse counter.
     */
    private function placeholderEmail(string $name): string
    {
        $slug = Str::slug($name) ?: 'donor';

        return "{$slug}." . Str::lower(Str::random(6)) . '@donor.kugawana.local';
    }
}
