<?php

namespace App\Http\Controllers\Console;

use App\Enums\TopupStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\PointPackage;
use App\Models\WalletTopup;
use App\Services\PesapalService;
use App\Services\WalletService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class WalletController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $requests = WalletTopup::query()
            ->with(['user', 'pointPackage'])
            ->when($this->countryId(), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('country_id', $this->countryId())))
            ->latest()
            ->paginate(25);

        $isSuper = auth()->user()->role === UserRole::SuperAdmin;

        // The management view shows inactive bundles too, within the admin's
        // scope: their own country's bundles plus the global ones.
        $packages = PointPackage::query()
            ->when($this->countryId(), fn ($q) => $q->where(fn ($sub) => $sub
                ->whereNull('country_id')
                ->orWhere('country_id', $this->countryId())))
            ->orderBy('points')
            ->get();

        $pesapal = app(PesapalService::class);

        return view('console.wallet.index', [
            'title' => 'Points',
            'requests' => $requests,
            'packages' => $packages,
            'countries' => $isSuper ? Country::orderBy('name')->get(['id', 'name']) : collect(),
            'isSuper' => $isSuper,
            'pesapalSandbox' => $pesapal->isConfigured() && ! $pesapal->isLive(),
        ]);
    }

    public function approve(WalletTopup $topup): RedirectResponse
    {
        $this->guardScope($topup);

        // A pesapal request must be proven settled at the gateway before it
        // credits — approving on faith is exactly how unpaid points get
        // minted when a member abandons checkout and the row sits pending.
        // Manual requests remain a human decision: the admin has confirmed
        // the money offline against the payment reference.
        if ($topup->payment_method === 'pesapal' && $topup->status === TopupStatus::Pending) {
            if (blank($topup->order_tracking_id)) {
                return back()->with('toast', 'No Pesapal transaction exists for this request — reject it, or have the member pay again');
            }

            $pesapal = app(PesapalService::class);

            try {
                $result = $pesapal->transactionStatus($topup->order_tracking_id);
            } catch (\Throwable $e) {
                report($e);

                return back()->with('toast', 'Pesapal could not be reached to verify this payment — nothing was credited, try again shortly');
            }

            if ($result['status'] !== 'COMPLETED') {
                return back()->with('toast', "Pesapal reports this payment as {$result['status']} — nothing was credited");
            }

            if (! $pesapal->mayCredit()) {
                return back()->with('toast', 'This payment settled on the Pesapal SANDBOX — test money, nothing was credited');
            }

            if (! $pesapal->matches($topup, $result)) {
                return back()->with('toast', 'The Pesapal transaction does not match this request — nothing was credited');
            }
        }

        $applied = app(WalletService::class)->applyTopup($topup, auth()->id());

        if (! $applied) {
            return back()->with('toast', 'This request was already processed');
        }

        return back()->with('toast', "{$topup->points} points approved for {$topup->user->name}");
    }

    public function reject(WalletTopup $topup): RedirectResponse
    {
        $this->guardScope($topup);

        $rejected = WalletTopup::query()
            ->whereKey($topup->id)
            ->where('status', TopupStatus::Pending)
            ->update([
                'status' => TopupStatus::Rejected,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

        if (! $rejected) {
            return back()->with('toast', 'This request was already processed');
        }

        return back()->with('toast', "Request rejected for {$topup->user->name}");
    }

    /** A CountryAdmin may only act on top-up requests from their own country's users. */
    private function guardScope(WalletTopup $topup): void
    {
        $countryId = $this->countryId();

        abort_if($countryId && $topup->user?->country_id !== $countryId, 403);
    }
}
