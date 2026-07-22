<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class CountryController extends Controller
{
    public function index(): View
    {
        $countries = Country::withCount('users')->orderByDesc('is_active')->orderBy('name')->get();

        return view('console.countries.index', [
            'title' => 'Countries',
            'countries' => $countries,
        ]);
    }

    public function toggle(Country $country): RedirectResponse
    {
        $country->update(['is_active' => ! $country->is_active]);

        return back()->with('toast', $country->is_active ? "{$country->name} enabled" : "{$country->name} disabled");
    }
}
