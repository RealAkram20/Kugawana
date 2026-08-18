<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\JsonResponse;

class CountryController extends Controller
{
    /**
     * The countries Kugawana operates in. The app matches a phone's detected ISO
     * code against this list — anywhere not on it has no warehouses or admins, so
     * it cannot be set as a member's country.
     */
    public function index(): JsonResponse
    {
        $countries = Country::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Country $country) => [
                'id' => $country->id,
                'code' => $country->code,
                'name' => $country->name,
                'currency_code' => $country->currency_code,
            ]);

        return response()->json([
            'success' => true,
            'data' => $countries,
            'message' => 'Countries retrieved',
        ]);
    }
}
