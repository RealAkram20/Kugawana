<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\PointPackage;
use Illuminate\View\View;

class SettingsController extends Controller
{
    public function index(): View
    {
        $packages = PointPackage::orderBy('points')->get();

        $gateways = [
            ['name' => 'Pesapal', 'status' => 'Active'],
            ['name' => 'MTN Mobile Money', 'status' => 'Off'],
            ['name' => 'Airtel Money', 'status' => 'Off'],
            ['name' => 'Flutterwave', 'status' => 'Off'],
            ['name' => 'Stripe', 'status' => 'Off'],
            ['name' => 'PayPal', 'status' => 'Off'],
        ];

        return view('console.settings.index', [
            'title' => 'Settings',
            'packages' => $packages,
            'gateways' => $gateways,
        ]);
    }
}
