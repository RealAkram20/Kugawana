<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\RewardCampaign;
use Illuminate\View\View;

class CampaignController extends Controller
{
    public function index(): View
    {
        $campaigns = RewardCampaign::latest()->get()->map(function ($c) {
            if (! $c->is_active) {
                $status = 'Ended';
            } elseif ($c->starts_at && $c->starts_at->isFuture()) {
                $status = 'Scheduled';
            } elseif ($c->ends_at && $c->ends_at->isPast()) {
                $status = 'Ended';
            } else {
                $status = 'Active';
            }
            $c->display_status = $status;

            return $c;
        });

        return view('console.campaigns.index', [
            'title' => 'Reward campaigns',
            'campaigns' => $campaigns,
        ]);
    }
}
