<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\AdminAlert;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Fans an operational alert out to the admins who can act on it: every super
 * admin, plus the country admins responsible for the country the event belongs
 * to. A null country means the event is platform wide, so only super admins are
 * told. Delivery never throws — a push failure must not break the member action
 * that raised the alert.
 */
class AdminNotifier
{
    public static function alert(?int $countryId, string $type, string $title, string $body, ?string $url = null): void
    {
        $admins = User::query()
            ->where('is_active', true)
            ->where(function ($query) use ($countryId) {
                $query->where('role', UserRole::SuperAdmin);

                if ($countryId !== null) {
                    $query->orWhere(fn ($scope) => $scope
                        ->where('role', UserRole::CountryAdmin)
                        ->where('country_id', $countryId));
                }
            })
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        try {
            Notification::send($admins, new AdminAlert($type, $title, $body, $url));
        } catch (\Throwable $e) {
            Log::warning('Admin alert failed', ['type' => $type, 'error' => $e->getMessage()]);
        }
    }
}
