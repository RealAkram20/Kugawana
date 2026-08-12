<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\BrandingSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class BrandingController extends Controller
{
    public function edit(): View
    {
        return view('console.settings.branding', [
            'title' => 'Logo & favicon',
            'setting' => BrandingSetting::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            // SVG is excluded on purpose: it can carry scripts, and these files
            // are served to every visitor.
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'favicon' => ['nullable', 'file', 'mimes:png,ico', 'max:512'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_favicon' => ['nullable', 'boolean'],
        ]);

        $setting = BrandingSetting::current();

        $updates = [];

        if ($request->boolean('remove_logo')) {
            $updates['logo_path'] = $this->drop($setting->logo_path);
        }

        if ($request->boolean('remove_favicon')) {
            $updates['favicon_path'] = $this->drop($setting->favicon_path);
        }

        if ($request->hasFile('logo')) {
            $this->drop($setting->logo_path);
            $updates['logo_path'] = $request->file('logo')->store('branding', 'public');
        }

        if ($request->hasFile('favicon')) {
            $this->drop($setting->favicon_path);
            $updates['favicon_path'] = $request->file('favicon')->store('branding', 'public');
        }

        if ($updates === []) {
            return back()->with('toast', 'Nothing changed — choose a file first');
        }

        $setting->update($updates);

        return redirect()
            ->route('console.settings.branding.edit')
            ->with('toast', 'Branding updated');
    }

    /** Deletes the stored file, returning null for the column it vacated. */
    private function drop(?string $path): ?string
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }

        return null;
    }
}
