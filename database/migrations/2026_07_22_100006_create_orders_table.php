<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('food_donation_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('points_spent')->default(0);
            $table->string('delivery_method')->default('pickup');
            $table->string('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
