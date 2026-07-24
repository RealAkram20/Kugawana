<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use App\Services\PesapalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PaymentGatewayController extends Controller
{
    public function edit(): View
    {
        $setting = PaymentSetting::current();

        return view('console.settings.pesapal', [
            'title' => 'Pesapal settings',
            'setting' => $setting,
            // Shown as placeholders so the admin can see what env falls back to.
            'defaultCallback' => config('services.pesapal.callback_url'),
            'defaultIpn' => config('services.pesapal.ipn_url'),
            'hasSecret' => filled($setting->pesapal_consumer_secret),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'pesapal_environment' => ['required', Rule::in(['sandbox', 'live'])],
            'pesapal_consumer_key' => ['nullable', 'string', 'max:255'],
            'pesapal_consumer_secret' => ['nullable', 'string', 'max:500'],
            'pesapal_callback_url' => ['nullable', 'url', 'max:255'],
            'pesapal_ipn_url' => ['nullable', 'url', 'max:255'],
        ]);

        $setting = PaymentSetting::current();
        $oldKey = $setting->pesapal_consumer_key;
        $oldEnv = $setting->pesapal_environment;

        $data['pesapal_enabled'] = $request->boolean('pesapal_enabled');

        // A blank secret means "leave what is already stored" — the form never
        // echoes the saved secret back, so blank is the normal state on re-save.
        $secretProvided = filled($data['pesapal_consumer_secret'] ?? null);
        if (! $secretProvided) {
            unset($data['pesapal_consumer_secret']);
        }

        // Turning the gateway on is meaningless without credentials to use it —
        // check what the row will actually hold once this save lands.
        $keyAfter = array_key_exists('pesapal_consumer_key', $data)
            ? $data['pesapal_consumer_key']
            : $setting->pesapal_consumer_key;
        $secretAfter = array_key_exists('pesapal_consumer_secret', $data)
            ? $data['pesapal_consumer_secret']
            : $setting->pesapal_consumer_secret;

        if ($data['pesapal_enabled'] && (blank($keyAfter) || blank($secretAfter))) {
            return back()
                ->withInput()
                ->with('toast', 'Add a consumer key and secret before turning Pesapal on.');
        }

        $setting->update($data);
        PaymentSetting::forgetCaches();

        // New credentials or a new environment mean any registered IPN belonged to
        // the old account — drop it so it re-registers under the new one.
        if ($secretProvided || $setting->pesapal_consumer_key !== $oldKey || $setting->pesapal_environment !== $oldEnv) {
            $setting->update(['pesapal_ipn_id' => null]);
        }

        $message = 'Pesapal settings saved';

        // Register the IPN automatically the moment the gateway is on with working
        // credentials and none is registered yet, so the first payment does not
        // have to wait for it.
        if ($setting->pesapal_enabled && blank($setting->pesapal_ipn_id)) {
            $message .= $this->tryRegisterIpn($setting)
                ? '. IPN registered.'
                : '. Saved, but the IPN could not be registered — check the URLs, then use Re-register IPN.';
        }

        return redirect()
            ->route('console.settings.pesapal.edit')
            ->with('toast', $message);
    }

    /** Manual (re-)registration, from the button on the settings page. */
    public function registerIpn(PesapalService $pesapal): RedirectResponse
    {
        PaymentSetting::forgetCaches();

        if (! $pesapal->isConfigured()) {
            return back()->with('toast', 'Add and enable Pesapal credentials first, then register the IPN.');
        }

        return $this->tryRegisterIpn(PaymentSetting::current())
            ? back()->with('toast', 'IPN registered with Pesapal.')
            : back()->with('toast', 'Could not register the IPN. Check the IPN URL and credentials.');
    }

    /** Live check that the saved credentials can authenticate against Pesapal. */
    public function test(PesapalService $pesapal): RedirectResponse
    {
        PaymentSetting::forgetCaches();

        if (! $pesapal->isConfigured()) {
            return back()->with('toast', 'Add and enable Pesapal credentials first, then test.');
        }

        try {
            $pesapal->token();

            return back()->with('toast', 'Success — Pesapal accepted these credentials.');
        } catch (\Throwable $e) {
            report($e);

            return back()->with('toast', 'Pesapal rejected the credentials. Check the key, secret and environment.');
        }
    }

    /** Registers an IPN and stores the id, returning whether it worked. */
    private function tryRegisterIpn(PaymentSetting $setting): bool
    {
        try {
            // Fresh instance so it reads the just-saved credentials.
            $id = (new PesapalService())->registerIpn();
            $setting->update(['pesapal_ipn_id' => $id]);

            return true;
        } catch (\Throwable $e) {
            report($e);

            return false;
        }
    }
}
