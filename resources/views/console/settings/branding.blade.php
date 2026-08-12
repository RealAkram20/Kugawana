@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.settings.index') }}" style="margin-bottom:14px">← Back to settings</a>

<div style="margin-bottom:22px">
  <h2 style="margin:0 0 6px">Logo &amp; favicon</h2>
  <div class="text-muted" style="font-size:14px">Shown across the console and the sign-in page. The mobile app's icon is built into the app itself and changes with the next app release.</div>
</div>

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

<form method="POST" action="{{ route('console.settings.branding.update') }}" enctype="multipart/form-data" style="max-width:720px">
  @csrf

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 6px">Logo</h5>
    <p class="text-muted" style="font-size:13px;margin:0 0 14px">PNG, JPG or WebP, up to 2 MB. A wide logo on a transparent background works best.</p>

    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <div style="width:180px;height:72px;border:1px solid var(--color-divider);display:grid;place-items:center;background:var(--color-bg);padding:8px">
        @if ($setting->logoUrl())
          <img src="{{ $setting->logoUrl() }}" alt="Current logo" style="max-width:100%;max-height:100%;object-fit:contain">
        @else
          <span class="text-muted" style="font-size:12px">Using the built-in wordmark</span>
        @endif
      </div>
      <div style="flex:1;min-width:220px">
        <div class="field" style="margin-bottom:10px">
          <label>Upload new logo</label>
          <input class="input" type="file" name="logo" accept="image/png,image/jpeg,image/webp">
        </div>
        @if ($setting->logo_path)
          <label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;cursor:pointer">
            <input type="checkbox" name="remove_logo" value="1"> Remove and go back to the built-in wordmark
          </label>
        @endif
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 6px">Favicon</h5>
    <p class="text-muted" style="font-size:13px;margin:0 0 14px">The small icon in the browser tab. PNG or ICO, square, up to 512 KB — 64×64 or larger is plenty.</p>

    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <div style="width:72px;height:72px;border:1px solid var(--color-divider);display:grid;place-items:center;background:var(--color-bg)">
        <img src="{{ $setting->faviconUrl() }}" alt="Current favicon" style="width:32px;height:32px;object-fit:contain">
      </div>
      <div style="flex:1;min-width:220px">
        <div class="field" style="margin-bottom:10px">
          <label>Upload new favicon</label>
          <input class="input" type="file" name="favicon" accept="image/png,image/x-icon,image/vnd.microsoft.icon">
        </div>
        @if ($setting->favicon_path)
          <label style="display:inline-flex;align-items:center;gap:7px;font-size:13px;cursor:pointer">
            <input type="checkbox" name="remove_favicon" value="1"> Remove and go back to the default
          </label>
        @endif
      </div>
    </div>
  </div>

  <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save branding</button>
</form>
@endsection
