<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\AuthSetting;
use App\Models\MailSetting;
use App\Models\PaymentSetting;
use App\Models\PointPackage;
use App\Services\PesapalService;
use Illuminate\View\View;

class SettingsController extends Controller
{
    public function index(PesapalService $pesapal): View
    {
        $packages = PointPackage::orderBy('points')->get();
        $payment = PaymentSetting::current();
        $mail = MailSetting::current();
        $auth = AuthSetting::current();

        $googleStatus = $auth->google_enabled
            ? 'Active'
            : ($auth->googleClientIds() ? 'Off' : 'Not set up');

        // Live: credentials present and the gateway switched on. Configured but
        // switched off reads as "Off"; nothing entered reads as "Not set up".
        $pesapalStatus = $pesapal->isConfigured()
            ? 'Active'
            : (filled($payment->pesapal_consumer_key) ? 'Off' : 'Not set up');

        $gateways = [
            ['name' => 'Pesapal', 'status' => $pesapalStatus, 'route' => route('console.settings.pesapal.edit')],
        ];

        return view('console.settings.index', [
            'title' => 'Settings',
            'packages' => $packages,
            'gateways' => $gateways,
            'mail' => [
                'smtp' => $mail->isSmtpConfigured() ? 'Configured' : 'Not set up',
                'verifyUsers' => $mail->verify_users_enabled,
                'verifyAdmins' => $mail->verify_admins_enabled,
                'route' => route('console.settings.mail.edit'),
            ],
            'google' => [
                'status' => $googleStatus,
                'route' => route('console.settings.google.edit'),
            ],
        ]);
    }
}
