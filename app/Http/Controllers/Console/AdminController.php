<?php

namespace App\Http\Controllers\Console;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function index(): View
    {
        $admins = User::query()
            ->with('country')
            ->where('role', UserRole::CountryAdmin)
            ->orderBy('name')
            ->get();

        return view('console.admins.index', [
            'title' => 'Admins',
            'admins' => $admins,
        ]);
    }

    public function create(): View
    {
        return view('console.admins.form', [
            'title' => 'Add country admin',
            'admin' => new User,
            'countries' => $this->countries(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30', 'unique:users,phone'],
            'country_id' => ['required', Rule::exists('countries', 'id')->where('is_active', true)],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $admin = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'country_id' => $data['country_id'],
            'password' => Hash::make($data['password']),
            'role' => UserRole::CountryAdmin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return redirect()
            ->route('console.admins.index')
            ->with('toast', "{$admin->name} can now sign in to the console");
    }

    public function edit(User $user): View
    {
        abort_if($user->role !== UserRole::CountryAdmin, 404);

        return view('console.admins.form', [
            'title' => 'Edit country admin',
            'admin' => $user,
            'countries' => $this->countries(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_if($user->role !== UserRole::CountryAdmin, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($user->id)],
            'country_id' => ['required', Rule::exists('countries', 'id')->where('is_active', true)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'country_id' => $data['country_id'],
            'is_active' => $request->boolean('is_active'),
            // Left blank, the password stays as it is.
            ...(filled($data['password'] ?? null) ? ['password' => Hash::make($data['password'])] : []),
        ]);

        return redirect()
            ->route('console.admins.index')
            ->with('toast', "{$user->name} updated");
    }

    public function approve(User $user): RedirectResponse
    {
        abort_if($user->role !== UserRole::CountryAdmin, 403);

        $user->update(['is_active' => true]);

        return back()->with('toast', "{$user->name} approved");
    }

    private function countries()
    {
        return Country::where('is_active', true)->orderBy('name')->get();
    }
}
