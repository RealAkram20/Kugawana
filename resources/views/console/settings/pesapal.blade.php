@extends('console.layout', ['title' => $title])

@section('content')
<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.settings.index') }}">&larr; Back to settings</a>
</div>

<div style="max-width:720px;display:flex;flex-direction:column;gap:16px">
  <div class="panel">
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:6px">
      <div style="flex:1">
        <h5 style="margin:0 0 4px">Pesapal</h5>
        <p class="text-muted" style="font-size:13px;margin:0">
          Card and mobile-money top-ups run through Pesapal API v3. Enter the credentials from your
          Pesapal merchant dashboard, then turn the gateway on.
        </p>
      </div>
      <span class="tag {{ $setting->pesapal_enabled ? 'tag-accent' : 'tag-outline' }}">
        {{ $setting->pesapal_enabled ? 'On' : 'Off' }}
      </span>
    </div>
  </div>

  <form method="POST" action="{{ route('console.settings.pesapal.update') }}" class="panel">
    @csrf

    <label style="display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:16px;cursor:pointer">
      <input type="checkbox" name="pesapal_enabled" value="1" @checked(old('pesapal_enabled', $setting->pesapal_enabled))>
      <span style="font-weight:600">Enable Pesapal online payments</span>
    </label>

    <div class="field" style="margin-bottom:12px">
      <label>Environment</label>
      <select class="input" name="pesapal_environment" required>
        <option value="sandbox" @selected(old('pesapal_environment', $setting->pesapal_environment) === 'sandbox')>Sandbox (testing)</option>
        <option value="live" @selected(old('pesapal_environment', $setting->pesapal_environment) === 'live')>Live (real payments)</option>
      </select>
      <p class="text-muted" style="font-size:12px;margin:6px 0 0">Sandbox uses cybqa.pesapal.com; Live uses pay.pesapal.com.</p>
      @error('pesapal_environment')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:12px">
      <label>Consumer key</label>
      <input class="input" name="pesapal_consumer_key" value="{{ old('pesapal_consumer_key', $setting->pesapal_consumer_key) }}" autocomplete="off" spellcheck="false">
      @error('pesapal_consumer_key')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:12px">
      <label>Consumer secret</label>
      <input class="input" type="password" name="pesapal_consumer_secret" autocomplete="off"
             placeholder="{{ $hasSecret ? '•••••••• (saved — leave blank to keep)' : 'Enter the consumer secret' }}">
      <p class="text-muted" style="font-size:12px;margin:6px 0 0">Stored encrypted. Leave blank to keep the current secret.</p>
      @error('pesapal_consumer_secret')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:12px">
      <label>Callback URL <span class="text-muted" style="font-weight:400">(optional)</span></label>
      <input class="input" name="pesapal_callback_url" value="{{ old('pesapal_callback_url', $setting->pesapal_callback_url) }}" placeholder="{{ $defaultCallback }}" autocomplete="off">
      @error('pesapal_callback_url')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:16px">
      <label>IPN URL <span class="text-muted" style="font-weight:400">(optional)</span></label>
      <input class="input" name="pesapal_ipn_url" value="{{ old('pesapal_ipn_url', $setting->pesapal_ipn_url) }}" placeholder="{{ $defaultIpn }}" autocomplete="off">
      <p class="text-muted" style="font-size:12px;margin:6px 0 0">Both URLs must be reachable from the paying device's browser. Blank falls back to the app URL.</p>
      @error('pesapal_ipn_url')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save settings</button>
  </form>

  <div class="panel">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:14px">Instant Payment Notification (IPN)</div>
        @if (filled($setting->pesapal_ipn_id))
          <p style="font-size:13px;margin:4px 0 0;color:var(--color-accent-700)">
            &#10003; Registered · <span style="font-family:monospace">{{ $setting->pesapal_ipn_id }}</span>
          </p>
        @else
          <p class="text-muted" style="font-size:13px;margin:4px 0 0">
            Not registered yet — registered automatically when you save with the gateway on.
          </p>
        @endif
      </div>
      <form method="POST" action="{{ route('console.settings.pesapal.register-ipn') }}">
        @csrf
        <button type="submit" class="btn btn-secondary" style="border-color:var(--color-divider)">
          {{ filled($setting->pesapal_ipn_id) ? 'Re-register IPN' : 'Register IPN' }}
        </button>
      </form>
    </div>
  </div>

  <div class="panel">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:14px">Test connection</div>
        <p class="text-muted" style="font-size:13px;margin:4px 0 0">Save first, then check that Pesapal accepts the saved credentials.</p>
      </div>
      <form method="POST" action="{{ route('console.settings.pesapal.test') }}">
        @csrf
        <button type="submit" class="btn btn-secondary" style="border-color:var(--color-divider)">Test connection</button>
      </form>
    </div>
  </div>
</div>
@endsection
