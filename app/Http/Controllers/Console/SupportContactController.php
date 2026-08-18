<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\SupportContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SupportContactController extends Controller
{
    public function edit(): View
    {
        return view('console.support.contact.edit', [
            'title' => 'Contact details',
            'contact' => SupportContact::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'intro' => ['nullable', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'hours' => ['nullable', 'string', 'max:255'],
        ]);

        // A cleared field arrives as '' from the form. Store it as null so "not set"
        // reads the same however it was written.
        SupportContact::current()->update(
            array_map(fn ($value) => is_string($value) && trim($value) === '' ? null : $value, $data),
        );

        return redirect()->route('console.support.contact.edit')->with('toast', 'Contact details saved');
    }
}
