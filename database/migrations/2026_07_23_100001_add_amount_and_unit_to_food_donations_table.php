<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The starter vocabulary. Seeded here rather than in DatabaseSeeder so the
     * backfill below has something to map the old free-text values onto — the
     * seeder repeats these with firstOrCreate so a fresh install stays correct.
     */
    private const UNITS = [
        ['name' => 'Gram', 'symbol' => 'g', 'sort_order' => 1, 'aliases' => ['g', 'gram', 'grams', 'gm', 'gms']],
        ['name' => 'Kilogram', 'symbol' => 'Kg', 'sort_order' => 2, 'aliases' => ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms']],
        ['name' => 'Millilitre', 'symbol' => 'ml', 'sort_order' => 3, 'aliases' => ['ml', 'mls', 'millilitre', 'millilitres', 'milliliter', 'milliliters']],
        ['name' => 'Litre', 'symbol' => 'L', 'sort_order' => 4, 'aliases' => ['l', 'ltr', 'litre', 'litres', 'liter', 'liters']],
        ['name' => 'Piece', 'symbol' => 'pcs', 'sort_order' => 5, 'aliases' => ['pc', 'pcs', 'piece', 'pieces', 'item', 'items']],
        ['name' => 'Bunch', 'symbol' => 'bunches', 'sort_order' => 6, 'aliases' => ['bunch', 'bunches']],
        ['name' => 'Loaf', 'symbol' => 'loaves', 'sort_order' => 7, 'aliases' => ['loaf', 'loaves']],
        ['name' => 'Packet', 'symbol' => 'pkt', 'sort_order' => 8, 'aliases' => ['pkt', 'pkts', 'packet', 'packets', 'pack', 'packs']],
        ['name' => 'Tray', 'symbol' => 'trays', 'sort_order' => 9, 'aliases' => ['tray', 'trays']],
        ['name' => 'Plate', 'symbol' => 'plates', 'sort_order' => 10, 'aliases' => ['plate', 'plates']],
    ];

    public function up(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            $table->decimal('amount', 8, 2)->default(1)->after('description');
            $table->foreignId('unit_id')->nullable()->after('amount')->constrained()->nullOnDelete();
        });

        $this->seedUnits();
        $this->backfill();

        Schema::table('food_donations', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            $table->string('quantity')->default('')->after('description');
        });

        // Rebuild the free-text value so a rollback is not lossy.
        DB::table('food_donations')
            ->leftJoin('units', 'units.id', '=', 'food_donations.unit_id')
            ->update([
                'food_donations.quantity' => DB::raw(
                    "TRIM(CONCAT(TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM food_donations.amount)), ' ', COALESCE(units.symbol, '')))"
                ),
            ]);

        Schema::table('food_donations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('unit_id');
            $table->dropColumn('amount');
        });
    }

    private function seedUnits(): void
    {
        foreach (self::UNITS as $unit) {
            $exists = DB::table('units')->where('symbol', $unit['symbol'])->exists();

            if ($exists) {
                continue;
            }

            DB::table('units')->insert([
                'name' => $unit['name'],
                'symbol' => $unit['symbol'],
                'is_active' => true,
                'sort_order' => $unit['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Turn values like "2 kg", "1 Litre" and "30 pieces" into an amount plus a
     * unit id. Anything unparseable falls back to 1 Piece so no row is orphaned.
     */
    private function backfill(): void
    {
        $unitIds = DB::table('units')->pluck('id', 'symbol');

        $aliasToSymbol = [];
        foreach (self::UNITS as $unit) {
            foreach ($unit['aliases'] as $alias) {
                $aliasToSymbol[$alias] = $unit['symbol'];
            }
        }

        $fallbackId = $unitIds['pcs'] ?? null;

        DB::table('food_donations')
            ->select('id', 'quantity')
            ->orderBy('id')
            ->chunk(200, function ($rows) use ($aliasToSymbol, $unitIds, $fallbackId) {
                foreach ($rows as $row) {
                    $raw = trim((string) $row->quantity);

                    $amount = 1;
                    $unitId = $fallbackId;

                    if (preg_match('/^([\d]+(?:[.,][\d]+)?)\s*(.*)$/u', $raw, $matches)) {
                        $amount = (float) str_replace(',', '.', $matches[1]);
                        $label = strtolower(trim($matches[2]));

                        if ($label !== '' && isset($aliasToSymbol[$label])) {
                            $unitId = $unitIds[$aliasToSymbol[$label]] ?? $fallbackId;
                        }
                    }

                    DB::table('food_donations')
                        ->where('id', $row->id)
                        ->update(['amount' => $amount, 'unit_id' => $unitId]);
                }
            });
    }
};
