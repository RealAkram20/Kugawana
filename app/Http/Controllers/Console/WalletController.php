<?php

namespace App\Http\Controllers\Console;

use App\Enums\TopupStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\PointPackage;
use App\Models\WalletTopup;
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

        $packages = PointPackage::where('is_active', true)->orderBy('points')->get();

        return view('console.wallet.index', [
            'title' => 'Wallet requests',
            'requests' => $requests,
            'packages' => $packages,
        ]);
    }

    public function approve(WalletTopup $topup): RedirectResponse
    {
        $applied = app(WalletService::class)->applyTopup($topup, auth()->id());

        if (! $applied) {
            return back()->with('toast', 'This request was already processed');
        }

        return back()->with('toast', "{$topup->points} points approved for {$topup->user->name}");
    }

    public function reject(WalletTopup $topup): RedirectResponse
    {
        if ($topup->status !== TopupStatus::Pending) {
            return back()->with('toast', 'This request was already processed');
        }

        $topup->update([
            'status' => TopupStatus::Rejected,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('toast', "Request rejected for {$topup->user->name}");
    }
}
