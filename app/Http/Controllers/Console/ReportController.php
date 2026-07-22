<?php

namespace App\Http\Controllers\Console;

use App\Enums\TransactionType;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\View\View;

class ReportController extends Controller
{
    use ScopesCountry;

    public function index(): View
    {
        $countryId = $this->countryId();

        $donations = FoodDonation::query()
            ->when($countryId, fn ($q) => $q->where('country_id', $countryId));

        $reportKpis = [
            ['label' => 'Total donations', 'value' => number_format((clone $donations)->count())],
            ['label' => 'Orders completed', 'value' => number_format(Order::whereNotNull('completed_at')->count())],
            ['label' => 'Points spent', 'value' => number_format((int) WalletTransaction::where('type', TransactionType::Debit)->sum('points'))],
            ['label' => 'Reward points issued', 'value' => number_format((int) WalletTransaction::where('type', TransactionType::Credit)->sum('points'))],
        ];

        $months = collect(range(5, 0))->map(fn ($i) => now()->subMonths($i)->startOfMonth());
        $counts = $months->map(fn ($m) => (clone $donations)->whereBetween('created_at', [$m, $m->copy()->endOfMonth()])->count());
        $max = max($counts->max(), 1);
        $monthBars = $months->values()->map(fn ($m, $i) => [
            'm' => $m->format('M'),
            'v' => $counts[$i],
            'h' => (int) round($counts[$i] / $max * 150),
        ]);

        $topDonors = User::withCount('donations')
            ->when($countryId, fn ($q) => $q->where('country_id', $countryId))
            ->having('donations_count', '>', 0)
            ->orderByDesc('donations_count')
            ->limit(5)
            ->get();

        $topReceivers = User::withCount('orders')
            ->when($countryId, fn ($q) => $q->where('country_id', $countryId))
            ->having('orders_count', '>', 0)
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get();

        $ratings = Rating::selectRaw('user_id, avg(stars) as avg_stars')
            ->groupBy('user_id')
            ->pluck('avg_stars', 'user_id');

        return view('console.reports.index', [
            'title' => 'Reports',
            'reportKpis' => $reportKpis,
            'monthBars' => $monthBars,
            'topDonors' => $topDonors,
            'topReceivers' => $topReceivers,
            'ratings' => $ratings,
        ]);
    }
}
