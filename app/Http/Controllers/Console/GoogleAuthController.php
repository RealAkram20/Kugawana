<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\AuthSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class GoogleAuthController extends Controller
{
    public function edit(): View
    {
        return view('console.settings.google', [
            'title' => 'Google sign-in',
            'setting' => AuthSetting::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'google_web_client_id' => ['nullable', 'string', 'max:255'],
            'google_android_client_id' => ['nullable', 'string', 'max:255'],
            'google_ios_client_id' => ['nullable', 'string', 'max:255'],
        ]);

        $data['google_enabled'] = $request->boolean('google_enabled');

        $setting = AuthSetting::current();

        // Turning it on without a single client ID would just make every sign-in
        // fail verification, so refuse rather than pretend it is live.
        $anyId = filled($data['google_web_client_id'])
            || filled($data['google_android_client_id'])
            || filled($data['google_ios_client_id']);

        if ($data['google_enabled'] && ! $anyId) {
            return back()
                ->withInput()
                ->with('toast', 'Add at least one client ID before turning Google sign-in on.');
        }

        $setting->update($data);

        return redirect()
            ->route('console.settings.google.edit')
            ->with('toast', 'Google sign-in settings saved');
    }
}
