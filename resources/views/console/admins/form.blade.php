@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.admins.index') }}" style="margin-bottom:14px">← Back to admins</a>

<h2 style="margin:0 0 22px">{{ $title }}</h2>

@if ($errors->any())
  <div class="panel" style="margin-bottom:16px;border-left:3px solid var(--color-accent)">
    <div style="font-weight:600;margin-bottom:6px">Please fix the following</div>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--color-accent)">
      @foreach ($errors->all() as $error)
        <li>{{ $error }}</li>
      @endforeach
    </ul>
  </div>
@endif

<form method="POST"
      action="{{ $admin->exists ? route('console.admins.update', $admin) : route('console.admins.store') }}"
      style="max-width:640px">
  @csrf

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 16px">Account</h5>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="grid-2">
      <div class="field">
        <label>Full name</label>
        <input class="input" name="name" value="{{ old('name', $admin->name) }}" required>
      </div>
      <div class="field">
        <label>Email</label>
        <input class="input" type="email" name="email" value="{{ old('email', $admin->email) }}" required>
        <p class="text-muted" style="font-size:12px;margin:6px 0 0">Console alerts and password resets go here — it must be a real mailbox.</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="grid-2">
      <div class="field">
        <label>Phone <span class="text-muted">(optional)</span></label>
        <input class="input" name="phone" value="{{ old('phone', $admin->phone) }}" placeholder="+2567…">
      </div>
      <div class="field">
        <label>Country</label>
        <select class="input" name="country_id" required>
          @foreach ($countries as $country)
            <option value="{{ $country->id }}" @selected(old('country_id', $admin->country_id) == $country->id)>{{ $country->name }}</option>
          @endforeach
        </select>
        <p class="text-muted" style="font-size:12px;margin:6px 0 0">They only see members, food and orders from this country.</p>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 16px">Access</h5>

    <div class="field" style="margin-bottom:12px">
      <label>{{ $admin->exists ? 'New password (leave blank to keep the current one)' : 'Password' }}</label>
      <input class="input" type="password" name="password" autocomplete="new-password" minlength="8" @required(! $admin->exists)>
      <p class="text-muted" style="font-size:12px;margin:6px 0 0">At least 8 characters. They can change it later with "Forgot password".</p>
    </div>

    @if ($admin->exists)
      <label style="display:inline-flex;align-items:center;gap:7px;font-size:14px;cursor:pointer">
        <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $admin->is_active))>
        Active — can sign in to the console
      </label>
    @endif
  </div>

  <div style="display:flex;gap:10px">
    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $admin->exists ? 'Save changes' : 'Add admin' }}</button>
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.admins.index') }}">Cancel</a>
  </div>
</form>
@endsection
