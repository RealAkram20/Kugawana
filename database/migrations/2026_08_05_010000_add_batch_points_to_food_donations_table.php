<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Splitting overwrites points_required with the per-unit price. Undoing the
     * split has to be able to put the whole-batch price back, or a 10 Kg sack
     * that was split into 1 Kg units goes back on sale at the 1 Kg price.
     */
    public function up(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            $table->unsignedInteger('batch_points_required')->nullable()->after('points_required');
        });
    }

    public function down(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            $table->dropColumn('batch_points_required');
        });
    }
};
