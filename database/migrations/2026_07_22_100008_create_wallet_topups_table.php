<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_topups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('point_package_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('points');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('UGX');
            $table->string('payment_method')->default('manual');
            $table->string('payment_reference')->nullable();
            $table->string('status')->default('pending')->index();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_topups');
    }
};
