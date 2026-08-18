<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\RewardCampaign;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class CampaignController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $campaigns = $this->scoped()
            ->latest()
            ->get()
            ->each(fn (RewardCampaign $c) => $c->display_status = $this->statusOf($c));

        return view('console.campaigns.index', [
            'title' => 'Reward campaigns',
            'campaigns' => $campaigns,
            'countries' => $this->countryOptions(),
            'isSuper' => $this->isSuper(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        RewardCampaign::create($data);

        return redirect()->route('console.campaigns.index')->with('toast', "{$data['name']} created");
    }

    public function edit(RewardCampaign $campaign): View
    {
        $this->guard($campaign);

        return view('console.campaigns.edit', [
            'title' => 'Edit campaign',
            'campaign' => $campaign,
            'countries' => $this->countryOptions(),
            'isSuper' => $this->isSuper(),
        ]);
    }

    public function update(Request $request, RewardCampaign $campaign): RedirectResponse
    {
        $this->guard($campaign);

        $campaign->update($this->validated($request));

        return redirect()->route('console.campaigns.index')->with('toast', "{$campaign->name} updated");
    }

    public function toggle(RewardCampaign $campaign): RedirectResponse
    {
        $this->guard($campaign);

        $campaign->update(['is_active' => ! $campaign->is_active]);

        return back()->with('toast', $campaign->is_active ? "{$campaign->name} activated" : "{$campaign->name} ended");
    }

    public function destroy(RewardCampaign $campaign): RedirectResponse
    {
        $this->guard($campaign);

        $campaign->delete();

        return redirect()->route('console.campaigns.index')->with('toast', "{$campaign->name} deleted");
    }

    /**
     * Validates the form and forces a country admin's campaign onto their own
     * country, so they can never reward another country or everyone globally.
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['required', 'integer', 'min:1', 'max:1000000'],
            'type' => ['required', Rule::in(['signup', 'donation', 'manual'])],
            'country_id' => ['nullable', 'exists:countries,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['is_active'] = $request->boolean('is_active');
        $data['country_id'] = $this->isSuper() ? ($data['country_id'] ?? null) : $this->countryId();

        return $data;
    }

    /** Country admins only touch their own country's campaigns. */
    private function guard(RewardCampaign $campaign): void
    {
        abort_if($this->countryId() && $campaign->country_id !== $this->countryId(), 403);
    }

    private function scoped()
    {
        return RewardCampaign::query()
            ->when($this->countryId(), fn ($q) => $q->where(fn ($sub) => $sub
                ->whereNull('country_id')
                ->orWhere('country_id', $this->countryId())));
    }

    private function isSuper(): bool
    {
        return auth()->user()->role === UserRole::SuperAdmin;
    }

    private function countryOptions()
    {
        return $this->isSuper() ? Country::orderBy('name')->get(['id', 'name']) : collect();
    }

    private function statusOf(RewardCampaign $campaign): string
    {
        if (! $campaign->is_active) {
            return 'Ended';
        }

        if ($campaign->starts_at && $campaign->starts_at->isFuture()) {
            return 'Scheduled';
        }

        if ($campaign->ends_at && $campaign->ends_at->isPast()) {
            return 'Ended';
        }

        return 'Active';
    }
}
