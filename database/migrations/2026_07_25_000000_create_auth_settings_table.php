<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('google_enabled')->default(false);
            $table->string('google_web_client_id')->nullable();
            $table->string('google_android_client_id')->nullable();
            $table->string('google_ios_client_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_settings');
    }
};
