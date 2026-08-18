@extends('console.layout', ['title' => $title])

@section('content')
<div class="panel" style="max-width:720px">
  <form method="POST" action="{{ route('console.support.contact.update') }}">
    @csrf

    <div class="card-kicker" style="margin-bottom:12px">Intro</div>
    <div class="field" style="margin-bottom:20px">
      <label>Message at the top of Help &amp; Support</label>
      <textarea class="input" name="intro" rows="3" placeholder="We're here to help…">{{ old('intro', $contact->intro) }}</textarea>
      @error('intro')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>

    <div class="card-kicker" style="margin-bottom:12px">How members reach you</div>
    <p class="text-muted" style="font-size:13px;margin:0 0 12px">Leave a field blank to hide that option in the app.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field">
        <label>Email</label>
        <input class="input" type="email" name="email" value="{{ old('email', $contact->email) }}" placeholder="support@kugawana.app">
        @error('email')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
      <div class="field">
        <label>Phone</label>
        <input class="input" name="phone" value="{{ old('phone', $contact->phone) }}" placeholder="+256 700 000 000">
        @error('phone')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="field">
        <label>WhatsApp number</label>
        <input class="input" name="whatsapp" value="{{ old('whatsapp', $contact->whatsapp) }}" placeholder="256700000000">
        <p class="text-muted" style="font-size:12px;margin:6px 0 0">Digits only, with country code and no plus sign.</p>
        @error('whatsapp')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
      <div class="field">
        <label>Support hours</label>
        <input class="input" name="hours" value="{{ old('hours', $contact->hours) }}" placeholder="Mon–Fri, 9am–5pm">
        @error('hours')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>
    </div>

    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center;margin-top:8px">Save details</button>
  </form>
</div>
@endsection
