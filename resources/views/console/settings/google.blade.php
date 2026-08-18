@extends('console.layout', ['title' => $title])

@section('content')
<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.settings.index') }}">&larr; Back to settings</a>
</div>

<div style="max-width:720px;display:flex;flex-direction:column;gap:16px">
  <div class="panel">
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:6px">
      <div style="flex:1">
        <h5 style="margin:0 0 4px">Google sign-in</h5>
        <p class="text-muted" style="font-size:13px;margin:0">
          Members can sign up and sign in with their Google account. Paste the OAuth client IDs from your
          Google Cloud console, then turn it on. These must match the client IDs the mobile app was built with.
        </p>
      </div>
      <span class="tag {{ $setting->google_enabled ? 'tag-accent' : 'tag-outline' }}">
        {{ $setting->google_enabled ? 'On' : 'Off' }}
      </span>
    </div>
  </div>

  <form method="POST" action="{{ route('console.settings.google.update') }}" class="panel">
    @csrf

    <label style="display:flex;align-items:center;gap:10px;font-size:14px;margin-bottom:16px;cursor:pointer">
      <input type="checkbox" name="google_enabled" value="1" @checked(old('google_enabled', $setting->google_enabled))>
      <span style="font-weight:600">Enable Google sign-in</span>
    </label>

    <div class="field" style="margin-bottom:12px">
      <label>Web client ID</label>
      <input class="input" name="google_web_client_id" value="{{ old('google_web_client_id', $setting->google_web_client_id) }}" placeholder="1234567890-abcd.apps.googleusercontent.com" autocomplete="off" spellcheck="false">
      @error('google_web_client_id')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:12px">
      <label>Android client ID</label>
      <input class="input" name="google_android_client_id" value="{{ old('google_android_client_id', $setting->google_android_client_id) }}" placeholder="1234567890-android.apps.googleusercontent.com" autocomplete="off" spellcheck="false">
      @error('google_android_client_id')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="field" style="margin-bottom:16px">
      <label>iOS client ID <span class="text-muted" style="font-weight:400">(optional)</span></label>
      <input class="input" name="google_ios_client_id" value="{{ old('google_ios_client_id', $setting->google_ios_client_id) }}" placeholder="1234567890-ios.apps.googleusercontent.com" autocomplete="off" spellcheck="false">
      <p class="text-muted" style="font-size:12px;margin:6px 0 0">A sign-in token is accepted only when its audience matches one of these IDs.</p>
      @error('google_ios_client_id')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save settings</button>
  </form>
</div>
@endsection
