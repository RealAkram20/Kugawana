@extends('console.layout', ['title' => $title])

@section('content')
<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.settings.index') }}">&larr; Back to settings</a>
</div>

<div style="max-width:720px;display:flex;flex-direction:column;gap:16px">
  <form method="POST" action="{{ route('console.settings.mail.update') }}" class="panel">
    @csrf

    <h5 style="margin:0 0 4px">SMTP server</h5>
    <p class="text-muted" style="font-size:13px;margin:0 0 16px">
      The outgoing mail server used to send verification emails. Get these from your email provider.
    </p>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field">
        <label>Host</label>
        <input class="input" name="smtp_host" value="{{ old('smtp_host', $setting->smtp_host) }}" placeholder="smtp.gmail.com" autocomplete="off">
        @error('smtp_host')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
      <div class="field">
        <label>Port</label>
        <input class="input" type="number" name="smtp_port" value="{{ old('smtp_port', $setting->smtp_port) }}" placeholder="587">
        @error('smtp_port')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field">
        <label>Username</label>
        <input class="input" name="smtp_username" value="{{ old('smtp_username', $setting->smtp_username) }}" autocomplete="off">
        @error('smtp_username')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
      <div class="field">
        <label>Password</label>
        <input class="input" type="password" name="smtp_password" autocomplete="new-password"
               placeholder="{{ $hasPassword ? '•••••••• (saved — leave blank to keep)' : 'App password or SMTP password' }}">
        <p class="text-muted" style="font-size:12px;margin:6px 0 0">Stored encrypted. Leave blank to keep the current one.</p>
        @error('smtp_password')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field">
        <label>Encryption</label>
        <select class="input" name="smtp_encryption">
          @foreach (['tls' => 'STARTTLS (usually port 587)', 'ssl' => 'SSL/TLS (usually port 465)', 'none' => 'None'] as $value => $label)
            <option value="{{ $value }}" @selected(old('smtp_encryption', $setting->smtp_encryption) === $value)>{{ $label }}</option>
          @endforeach
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="field">
        <label>From address</label>
        <input class="input" type="email" name="from_address" value="{{ old('from_address', $setting->from_address) }}" placeholder="no-reply@kugawana.app" autocomplete="off">
        @error('from_address')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
      <div class="field">
        <label>From name</label>
        <input class="input" name="from_name" value="{{ old('from_name', $setting->from_name) }}" placeholder="Kugawana" autocomplete="off">
        @error('from_name')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
    </div>

    <div style="border-top:1px solid var(--color-divider);margin:4px 0 16px;padding-top:16px">
      <h5 style="margin:0 0 4px">Email verification</h5>
      <p class="text-muted" style="font-size:13px;margin:0 0 14px">
        When on, that group must click a link emailed to them before they can sign in. Needs SMTP set up above.
      </p>

      <label style="display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:12px;cursor:pointer">
        <input type="checkbox" name="verify_users_enabled" value="1" @checked(old('verify_users_enabled', $setting->verify_users_enabled))>
        <span style="font-weight:600">Require members (app users) to verify their email</span>
      </label>

      <label style="display:flex;align-items:center;gap:10px;font-size:14px;cursor:pointer">
        <input type="checkbox" name="verify_admins_enabled" value="1" @checked(old('verify_admins_enabled', $setting->verify_admins_enabled))>
        <span style="font-weight:600">Require admins to verify their email</span>
      </label>
    </div>

    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save settings</button>
  </form>

  <div class="panel">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:14px">Test email</div>
        <p class="text-muted" style="font-size:13px;margin:4px 0 0">Save first, then send a test message to your own address ({{ auth()->user()->email }}).</p>
      </div>
      <form method="POST" action="{{ route('console.settings.mail.test') }}">
        @csrf
        <button type="submit" class="btn btn-secondary" style="border-color:var(--color-divider)">Send test</button>
      </form>
    </div>
  </div>
</div>
@endsection
