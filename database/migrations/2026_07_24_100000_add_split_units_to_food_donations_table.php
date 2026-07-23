<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            // A donation stays one listing after it is split: `amount` remains the
            // whole batch the donor handed over, while these describe the smaller
            // pieces receivers actually claim. Null means the batch was never split.
            $table->decimal('unit_amount', 8, 2)->nullable()->after('unit_id');
            $table->unsignedInteger('units_total')->nullable()->after('unit_amount');
            $table->unsignedInteger('units_available')->nullable()->after('units_total');
            $table->foreignId('split_by')->nullable()->after('units_available')->constrained('users')->nullOnDelete();
            $table->timestamp('split_at')->nullable()->after('split_by');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('units')->default(1)->after('points_spent');
        });
    }

    public function down(): void
    {
        Schema::table('food_donations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('split_by');
            $table->dropColumn(['unit_amount', 'units_total', 'units_available', 'split_at']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('units');
        });
    }
};
