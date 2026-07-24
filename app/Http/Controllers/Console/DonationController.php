<?php

namespace App\Http\Controllers\Console;

use App\Enums\FoodStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\FoodCategory;
use App\Models\FoodDonation;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\FoodSplitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DonationController extends Controller
{
    use ScopesCountry;

    private function scoped()
    {
        return FoodDonation::query()
            ->when($this->countryId(), fn ($q) => $q->where('country_id', $this->countryId()));
    }

    private function guardScope(FoodDonation $donation): void
    {
        abort_if($this->countryId() && $donation->country_id !== $this->countryId(), 403);
    }

    public function index(Request $request): View
    {
        $filter = $request->query('status', 'all');
        $search = $request->query('q');

        $donations = $this->scoped()
            ->with(['donor', 'category', 'unit'])
            ->when($filter !== 'all', fn ($q) => $q->where('status', $filter))
            ->when($search, fn ($q) => $q->where(fn ($sub) => $sub
                ->where('title', 'like', "%{$search}%")
                ->orWhereHas('donor', fn ($d) => $d->where('name', 'like', "%{$search}%"))))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $filters = ['all', FoodStatus::Pending->value, FoodStatus::Reviewed->value, FoodStatus::Approved->value, FoodStatus::Published->value, FoodStatus::Expired->value];

        return view('console.donations.index', [
            'title' => 'Food donations',
            'donations' => $donations,
            'filters' => $filters,
            'activeFilter' => $filter,
            'search' => $search,
        ]);
    }

    public function show(FoodDonation $donation): View
    {
        $this->guardScope($donation);

        $donation->load(['donor', 'category', 'warehouse', 'unit', 'splitter']);

        $stepNames = [FoodStatus::Pending, FoodStatus::Reviewed, FoodStatus::Approved, FoodStatus::Collected, FoodStatus::Stored, FoodStatus::Published];
        $current = array_search($donation->status, $stepNames, true);
        if ($current === false) {
            $current = in_array($donation->status, [FoodStatus::Rejected, FoodStatus::Expired]) ? 1 : count($stepNames) - 1;
        }

        $warehouses = Warehouse::where('is_active', true)
            ->when($this->countryId(), fn ($q) => $q->where('country_id', $this->countryId()))
            ->orderBy('name')
            ->get();

        return view('console.donations.show', [
            'title' => 'Donation detail',
            'donation' => $donation,
            'stepNames' => $stepNames,
            'current' => $current,
            'warehouses' => $warehouses,
            'sources' => $this->sources($donation),
            'categories' => FoodCategory::where('is_active', true)->orderBy('name')->get(),
            'units' => Unit::where('is_active', true)->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    /** Photos are stored beside every other food image, on the public disk. */
    private const MAX_IMAGES = 5;

    /**
     * Lets the admin tidy a submission before it goes public: fix the photos,
     * correct the quantity a donor guessed at, or set the right unit. The food
     * stays credited to the donor; only its presentation changes.
     */
    public function update(Request $request, FoodDonation $donation): RedirectResponse
    {
        $this->guardScope($donation);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'food_category_id' => ['required', 'exists:food_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999'],
            'unit_id' => ['required', Rule::exists('units', 'id')->where('is_active', true)],
            'pickup_address' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'expiry_date' => ['required', 'date'],
            'special_instructions' => ['nullable', 'string'],
            'remove_images' => ['nullable', 'array'],
            'remove_images.*' => ['string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        // A split batch already sized its units against the old amount, so
        // changing the whole out from under them would leave the counts wrong.
        if ($donation->isSplit() && (float) $data['amount'] !== (float) $donation->amount) {
            return back()->with('toast', 'Undo the split before changing the total quantity');
        }

        $images = $this->reconcileImages($request, $donation, $data['remove_images'] ?? []);

        $donation->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'food_category_id' => $data['food_category_id'],
            'amount' => $data['amount'],
            'unit_id' => $data['unit_id'],
            'pickup_address' => $data['pickup_address'] ?? null,
            'contact_number' => $data['contact_number'] ?? null,
            'expiry_date' => $data['expiry_date'],
            'special_instructions' => $data['special_instructions'] ?? null,
            'images' => $images,
        ]);

        return back()->with('toast', "{$donation->title} updated");
    }

    /**
     * Drops the photos the admin unchecked, appends any new uploads, and keeps
     * the gallery within its cap. Removed files leave the disk so nothing is
     * orphaned.
     *
     * @return array<int, string>
     */
    private function reconcileImages(Request $request, FoodDonation $donation, array $remove): array
    {
        $kept = collect($donation->images ?? [])->reject(fn ($path) => in_array($path, $remove, true));

        foreach ($remove as $path) {
            Storage::disk('public')->delete($path);
        }

        $added = collect($request->file('images') ?? [])
            ->map(fn ($file) => $file->store('food', 'public'));

        return $kept->merge($added)->take(self::MAX_IMAGES)->values()->all();
    }

    /**
     * People the food can be credited to. Admins are left out because the
     * credit belongs to whoever actually brought the food in, and the current
     * donor is always included so the picker never silently reassigns them.
     */
    private function sources(FoodDonation $donation)
    {
        return User::query()
            ->where(fn ($q) => $q
                ->whereKey($donation->donor_id)
                ->orWhere(fn ($others) => $others
                    ->whereIn('role', [UserRole::Donor, UserRole::Receiver])
                    ->when($this->countryId(), fn ($scoped) => $scoped->where('country_id', $this->countryId()))))
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);
    }

    /**
     * Cuts a bulk donation into units a household can finish, so a 10 Kg sack
     * does not have to go to one person or go to waste.
     */
    public function split(Request $request, FoodDonation $donation, FoodSplitService $splitter): RedirectResponse
    {
        $this->guardScope($donation);

        $data = $request->validate([
            'unit_amount' => ['required', 'numeric', 'min:0.01', 'max:'.$donation->amount],
            'points_required' => ['required', 'integer', 'min:0'],
            'source_id' => ['nullable', 'exists:users,id'],
            'source_name' => ['nullable', 'string', 'max:255'],
            'source_phone' => ['nullable', 'string', 'max:30', Rule::unique('users', 'phone')],
            'source_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
        ]);

        $source = $this->resolveSource($data, $donation, $splitter);

        $splitter->split(
            $donation,
            (float) $data['unit_amount'],
            (int) $data['points_required'],
            auth()->user(),
            $source,
        );

        return back()->with('toast', "{$donation->title} split into {$donation->units_total} units");
    }

    public function unsplit(FoodDonation $donation, FoodSplitService $splitter): RedirectResponse
    {
        $this->guardScope($donation);

        if ($donation->unitsClaimed() > 0) {
            return back()->with('toast', 'Units have already been claimed, so this split cannot be undone');
        }

        $splitter->unsplit($donation);

        return back()->with('toast', "{$donation->title} is back to a single listing");
    }

    /**
     * A named source wins over a picked one, so an admin can type in a walk in
     * donor who has no account yet without first leaving this screen.
     */
    private function resolveSource(array $data, FoodDonation $donation, FoodSplitService $splitter): ?User
    {
        if (! empty($data['source_name'])) {
            return $splitter->createSource([
                'name' => $data['source_name'],
                'phone' => $data['source_phone'] ?? null,
                'email' => $data['source_email'] ?? null,
                'country_id' => $donation->country_id,
            ], $this->countryId());
        }

        return empty($data['source_id']) ? null : User::find($data['source_id']);
    }

    public function approve(Request $request, FoodDonation $donation): RedirectResponse
    {
        $this->guardScope($donation);

        $data = $request->validate([
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'points_required' => ['required', 'integer', 'min:0'],
        ]);

        $donation->update([
            'status' => FoodStatus::Approved,
            'warehouse_id' => $data['warehouse_id'] ?? null,
            'points_required' => $data['points_required'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('console.donations.index')->with('toast', "{$donation->title} approved");
    }

    public function reject(Request $request, FoodDonation $donation): RedirectResponse
    {
        $this->guardScope($donation);

        $data = $request->validate([
            'admin_notes' => ['nullable', 'string'],
        ]);

        $donation->update([
            'status' => FoodStatus::Rejected,
            'admin_notes' => $data['admin_notes'] ?? $donation->admin_notes,
        ]);

        return redirect()->route('console.donations.index')->with('toast', "{$donation->title} rejected");
    }

    public function publish(FoodDonation $donation): RedirectResponse
    {
        $this->guardScope($donation);

        if ($donation->points_required < 1) {
            return back()->with('toast', 'Assign points before publishing');
        }

        $donation->update(['status' => FoodStatus::Published]);

        return back()->with('toast', "{$donation->title} published");
    }

    public function setStatus(Request $request, FoodDonation $donation): RedirectResponse
    {
        $this->guardScope($donation);

        $data = $request->validate([
            'status' => ['required', 'in:collected,stored'],
        ]);

        $donation->update(['status' => FoodStatus::from($data['status'])]);

        return back()->with('toast', "{$donation->title} marked as {$data['status']}");
    }

    public function export(): StreamedResponse
    {
        $donations = $this->scoped()->with(['donor', 'category', 'unit'])->latest()->get();

        return response()->streamDownload(function () use ($donations) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Title', 'Donor', 'Category', 'Quantity', 'Unit size', 'Units left', 'District', 'Status', 'Points', 'Expiry', 'Submitted']);
            foreach ($donations as $d) {
                fputcsv($out, [
                    $d->id, $d->title, $d->donor?->name, $d->category?->name, $d->quantity,
                    $d->unit_quantity ?: '—', $d->isSplit() ? "{$d->units_available} of {$d->units_total}" : '—',
                    $d->pickup_address, $d->status->value, $d->points_required,
                    $d->expiry_date?->toDateTimeString(), $d->created_at->toDateTimeString(),
                ]);
            }
            fclose($out);
        }, 'donations.csv', ['Content-Type' => 'text/csv']);
    }
}
