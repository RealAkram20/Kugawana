<?php

namespace App\Http\Controllers\Console\Concerns;

use App\Enums\UserRole;

trait ScopesCountry
{
    protected function countryId(): ?int
    {
        $user = auth()->user();

        return $user->role === UserRole::CountryAdmin ? $user->country_id : null;
    }
}
