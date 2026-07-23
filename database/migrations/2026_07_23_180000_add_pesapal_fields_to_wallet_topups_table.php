<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_topups', function (Blueprint $table) {
            $table->string('merchant_reference')->nullable()->after('payment_reference');
            $table->string('order_tracking_id')->nullable()->index()->after('merchant_reference');
        });
    }

    public function down(): void
    {
        Schema::table('wallet_topups', function (Blueprint $table) {
            $table->dropColumn(['merchant_reference', 'order_tracking_id']);
        });
    }
};
