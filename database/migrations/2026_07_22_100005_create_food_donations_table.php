<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('food_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('quantity');
            $table->date('preparation_date')->nullable();
            $table->dateTime('expiry_date');
            $table->string('pickup_address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('special_instructions')->nullable();
            $table->json('images')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('points_required')->default(0);
            $table->text('admin_notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_donations');
    }
};
