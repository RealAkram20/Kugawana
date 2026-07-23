<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('preferred_quantity')->nullable()->after('points_spent');
            $table->timestamp('need_by')->nullable()->after('scheduled_pickup_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['preferred_quantity', 'need_by']);
        });
    }
};
