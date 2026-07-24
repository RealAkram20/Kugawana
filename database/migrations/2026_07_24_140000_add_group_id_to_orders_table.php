<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Shared by every order placed in one basket checkout, so the admin
            // can treat the basket as a single order. Null for a standalone
            // "request now" order.
            $table->uuid('group_id')->nullable()->after('food_donation_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('group_id');
        });
    }
};
