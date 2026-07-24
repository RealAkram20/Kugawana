<?php

namespace App\Http\Controllers\Console;

use App\Enums\FoodStatus;
use App\Enums\TopupStatus;
use App\Enums\TransactionType;
use App\Enums\UserRole;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\User;
use App\Models\WalletTopup;
use App\Models\WalletTransaction;
use Illuminate\View\View;

class DashboardController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $countryId = $this->countryId();

        $donations = FoodDonation::query()
            ->when($countryId, fn ($q) => $q->where('country_id', $countryId));

        $pendingCount = (clone $donations)
            ->whereIn('status', [FoodStatus::Pending, FoodStatus::Reviewed])
            ->count();

        $kpis = [
            ['label' => 'Food listings', 'value' => number_format((clone $donations)->count()), 'icon' => 'donations', 'delta' => 'All time', 'alert' => false],
            ['label' => 'Meals distributed', 'value' => number_format(Order::whereNotNull('completed_at')->count()), 'icon' => 'orders', 'delta' => 'Orders completed', 'alert' => false],
            ['label' => 'Active users', 'value' => number_format(User::whereIn('role', [UserRole::Donor, UserRole::Receiver])->where('is_active', true)->when($countryId, fn ($q) => $q->where('country_id', $countryId))->count()), 'icon' => 'users', 'delta' => 'Members', 'alert' => false],
            ['label' => 'Revenue (UGX)', 'value' => number_format((float) WalletTopup::where('status', TopupStatus::Approved)->sum('amount')), 'icon' => 'wallet', 'delta' => 'Approved topups', 'alert' => false],
            ['label' => 'Points issued', 'value' => number_format((int) WalletTransaction::where('type', TransactionType::Credit)->sum('points')), 'icon' => 'campaigns', 'delta' => 'All credits', 'alert' => false],
            ['label' => 'Pending review', 'value' => number_format($pendingCount), 'icon' => 'reports', 'delta' => $pendingCount > 0 ? 'Needs attention' : 'All clear', 'alert' => $pendingCount > 0],
        ];

        $days = collect(range(6, 0))->map(fn ($i) => now()->subDays($i)->startOfDay());
        $counts = $days->map(fn ($day) => (clone $donations)->whereBetween('created_at', [$day, $day->copy()->endOfDay()])->count());
        $max = max($counts->max(), 1);
        $weekBars = $days->values()->map(fn ($day, $i) => [
            'day' => $day->format('D'),
            'v' => $counts[$i],
            'h' => (int) round($counts[$i] / $max * 160),
            'highlight' => $counts[$i] === $counts->max() && $counts[$i] > 0,
        ]);

        $activity = collect()
            ->concat((clone $donations)->latest()->limit(5)->get()->map(fn ($d) => [
                'text' => "{$d->donor?->name} submitted {$d->title} for review",
                'at' => $d->created_at,
                'accent' => $d->status === FoodStatus::Pending,
            ]))
            ->concat(WalletTopup::latest()->limit(5)->get()->map(fn ($t) => [
                'text' => "{$t->user?->name} requested {$t->points} points",
                'at' => $t->created_at,
                'accent' => $t->status === TopupStatus::Pending,
            ]))
            ->concat(Order::latest()->limit(5)->get()->map(fn ($o) => [
                'text' => "{$o->receiver?->name} ordered {$o->foodDonation?->title}",
                'at' => $o->created_at,
                'accent' => false,
            ]))
            ->sortByDesc('at')
            ->take(5)
            ->values();

        $pending = (clone $donations)
            ->with(['donor', 'category', 'unit'])
            ->whereIn('status', [FoodStatus::Pending, FoodStatus::Reviewed])
            ->latest()
            ->limit(6)
            ->get();

        return view('console.dashboard', [
            'title' => 'Dashboard',
            'kpis' => $kpis,
            'weekBars' => $weekBars,
            'activity' => $activity,
            'pending' => $pending,
        ]);
    }
}
