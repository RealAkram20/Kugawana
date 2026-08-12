<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class WarehouseController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $warehouses = Warehouse::withCount('donations')
            ->with('country')
            ->when($this->countryId(), fn ($q) => $q->where('country_id', $this->countryId()))
            ->orderBy('name')
            ->get();

        return view('console.warehouses.index', [
            'title' => 'Warehouses',
            'warehouses' => $warehouses,
        ]);
    }

    public function create(): View
    {
        return view('console.warehouses.form', [
            'title' => 'Add warehouse',
            'warehouse' => new Warehouse,
            'countries' => $this->countryOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $warehouse = Warehouse::create($this->validated($request) + ['is_active' => true]);

        return redirect()
            ->route('console.warehouses.index')
            ->with('toast', "{$warehouse->name} added");
    }

    public function edit(Warehouse $warehouse): View
    {
        $this->guardScope($warehouse);

        return view('console.warehouses.form', [
            'title' => 'Edit warehouse',
            'warehouse' => $warehouse,
            'countries' => $this->countryOptions(),
        ]);
    }

    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $this->guardScope($warehouse);

        $warehouse->update($this->validated($request));

        return redirect()
            ->route('console.warehouses.index')
            ->with('toast', "{$warehouse->name} updated");
    }

    /**
     * Deactivated rather than deleted: donations keep pointing at the row, so
     * history stays intact while the pickers stop offering it.
     */
    public function toggle(Warehouse $warehouse): RedirectResponse
    {
        $this->guardScope($warehouse);

        $warehouse->update(['is_active' => ! $warehouse->is_active]);

        return back()->with('toast', $warehouse->is_active
            ? "{$warehouse->name} activated"
            : "{$warehouse->name} deactivated");
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'country_id' => ['required', Rule::exists('countries', 'id')->where('is_active', true)],
            'district' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_refrigerated' => ['nullable', 'boolean'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        // A country admin's warehouses always live in their own country, no
        // matter what the form claims.
        if ($this->countryId()) {
            $data['country_id'] = $this->countryId();
        }

        $data['is_refrigerated'] = $request->boolean('is_refrigerated');

        return $data;
    }

    private function guardScope(Warehouse $warehouse): void
    {
        abort_if($this->countryId() && $warehouse->country_id !== $this->countryId(), 403);
    }

    private function countryOptions()
    {
        return Country::where('is_active', true)
            ->when($this->countryId(), fn ($q) => $q->whereKey($this->countryId()))
            ->orderBy('name')
            ->get();
    }
}
