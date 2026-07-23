<?php

namespace App\Models;

use App\Enums\UserRole;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'google_id',
        'phone',
        'phone_country',
        'gender',
        'password',
        'role',
        'country_id',
        'district',
        'address',
        'latitude',
        'longitude',
        'profile_photo',
        'bio',
        'wallet_balance',
        'responsibility_score',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return match ($panel->getId()) {
            'super-admin' => $this->role === UserRole::SuperAdmin,
            'admin' => in_array($this->role, [UserRole::SuperAdmin, UserRole::CountryAdmin]),
            default => false,
        };
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function donations(): HasMany
    {
        return $this->hasMany(FoodDonation::class, 'donor_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'receiver_id');
    }

    /**
     * Ratings left on this user's donations — what their provider score is
     * built from. Exposed as a relation so callers can withAvg/withCount it
     * instead of querying per user.
     */
    public function ratingsReceived(): HasManyThrough
    {
        return $this->hasManyThrough(
            Rating::class,
            FoodDonation::class,
            'donor_id',
            'food_donation_id',
        );
    }

    public function walletTopups(): HasMany
    {
        return $this->hasMany(WalletTopup::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [UserRole::SuperAdmin, UserRole::CountryAdmin]);
    }
}
