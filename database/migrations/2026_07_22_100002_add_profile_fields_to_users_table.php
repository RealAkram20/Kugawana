<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('receiver')->index()->after('password');
            $table->string('phone')->nullable()->unique()->after('email');
            $table->string('gender')->nullable()->after('phone');
            $table->foreignId('country_id')->nullable()->after('gender')->constrained()->nullOnDelete();
            $table->string('district')->nullable()->after('country_id');
            $table->string('address')->nullable()->after('district');
            $table->decimal('latitude', 10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('profile_photo')->nullable()->after('longitude');
            $table->unsignedInteger('wallet_balance')->default(0)->after('profile_photo');
            $table->integer('responsibility_score')->default(100)->after('wallet_balance');
            $table->boolean('is_active')->default(true)->after('responsibility_score');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('country_id');
            $table->dropColumn([
                'role', 'phone', 'gender', 'district', 'address',
                'latitude', 'longitude', 'profile_photo',
                'wallet_balance', 'responsibility_score', 'is_active',
            ]);
        });
    }
};
