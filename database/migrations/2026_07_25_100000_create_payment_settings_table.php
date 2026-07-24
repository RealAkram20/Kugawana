<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Single-row settings for the payment gateway, editable by a super admin so
     * credentials no longer have to be baked into the server's .env. The secret is
     * stored encrypted, hence a text column rather than a fixed-length string.
     */
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('pesapal_enabled')->default(false);
            $table->string('pesapal_environment')->default('sandbox'); // sandbox | live
            $table->string('pesapal_consumer_key')->nullable();
            $table->text('pesapal_consumer_secret')->nullable();
            $table->string('pesapal_ipn_id')->nullable();
            $table->string('pesapal_callback_url')->nullable();
            $table->string('pesapal_ipn_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
