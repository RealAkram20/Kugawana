<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\PointPackage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PackageController extends Controller
{
    use ScopesCountry;

    public function store(Request $request): RedirectResponse
    {
        PointPackage::create($this->validated($request));

        return redirect()->route('console.wallet.index')->with('toast', 'Bundle created');
    }

    public function edit(PointPackage $package): View
    {
        $this->guard($package);

        return view('console.wallet.edit-package', [
            'title' => 'Edit bundle',
            'package' => $package,
            'countries' => $this->countryOptions(),
            'isSuper' => $this->isSuper(),
        ]);
    }

    public function update(Request $request, PointPackage $package): RedirectResponse
    {
        $this->guard($package);

        $package->update($this->validated($request));

        return redirect()->route('console.wallet.index')->with('toast', "{$package->name} updated");
    }

    public function toggle(PointPackage $package): RedirectResponse
    {
        $this->guard($package);

        $package->update(['is_active' => ! $package->is_active]);

        return back()->with('toast', $package->is_active ? "{$package->name} enabled" : "{$package->name} disabled");
    }

    public function destroy(PointPackage $package): RedirectResponse
    {
        $this->guard($package);

        $package->delete();

        return redirect()->route('console.wallet.index')->with('toast', "{$package->name} deleted");
    }

    /**
     * Validates the form and pins a country admin's bundle to their own
     * country, so pricing never leaks into another market.
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'points' => ['required', 'integer', 'min:1', 'max:10000000'],
            'price' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'currency' => ['required', 'string', 'size:3'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['currency'] = strtoupper($data['currency']);
        $data['is_active'] = $request->boolean('is_active');
        $data['country_id'] = $this->isSuper() ? ($data['country_id'] ?? null) : $this->countryId();

        return $data;
    }

    private function guard(PointPackage $package): void
    {
        abort_if($this->countryId() && $package->country_id !== $this->countryId(), 403);
    }

    private function isSuper(): bool
    {
        return auth()->user()->role === UserRole::SuperAdmin;
    }

    private function countryOptions()
    {
        return $this->isSuper() ? Country::orderBy('name')->get(['id', 'name']) : collect();
    }
}
