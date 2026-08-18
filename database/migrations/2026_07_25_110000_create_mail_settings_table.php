<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Single-row settings for outgoing email: the SMTP connection a super admin
     * enters, and the two switches that decide whether users and admins must
     * verify their address before signing in. Password stored encrypted.
     */
    public function up(): void
    {
        Schema::create('mail_settings', function (Blueprint $table) {
            $table->id();
            $table->string('smtp_host')->nullable();
            $table->unsignedInteger('smtp_port')->default(587);
            $table->string('smtp_username')->nullable();
            $table->text('smtp_password')->nullable();
            $table->string('smtp_encryption')->default('tls'); // tls | ssl | none
            $table->string('from_address')->nullable();
            $table->string('from_name')->nullable();
            $table->boolean('verify_users_enabled')->default(false);
            $table->boolean('verify_admins_enabled')->default(false);
            $table->timestamps();
        });

        // Existing admin accounts predate verification — treat them as verified so
        // switching admin verification on can never lock the super admin out.
        DB::table('users')
            ->whereIn('role', [UserRole::SuperAdmin->value, UserRole::CountryAdmin->value])
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_settings');
    }
};
