<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Set a new password · Kugawana</title>
<link rel="stylesheet" href="{{ asset('css/console.css') }}">
</head>
<body>
<div class="login-split">
  <div class="login-hero">
    <div style="font-family:var(--font-heading);font-weight:800;font-size:20px;letter-spacing:0.02em">KUGAWANA</div>
    <div>
      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:.82;margin-bottom:18px">Admin console</div>
      <h1>Reduce food waste. Feed the community.</h1>
      <p style="font-size:16px;opacity:.9;max-width:440px;margin:0">Admin control for countries, donations, rewards and reports across the Kugawana network.</p>
    </div>
    <div style="font-size:12px;opacity:.78;letter-spacing:0.04em">Uganda · English · Swahili · Français</div>
  </div>
  <div class="login-form">
    <h2 style="margin:0 0 4px">Set a new password</h2>
    <p class="text-muted" style="margin-bottom:32px">At least 8 characters</p>

    <form method="POST" action="{{ route('password.update') }}">
      @csrf
      <input type="hidden" name="token" value="{{ $token }}">

      <div class="field" style="margin-bottom:16px">
        <label for="email">Email</label>
        <input class="input" id="email" type="email" name="email" value="{{ old('email', $email) }}" required>
      </div>

      <div class="field" style="margin-bottom:16px">
        <label for="password">New password</label>
        <div class="password-field">
          <input class="input" id="password" type="password" name="password" required autofocus>
        </div>
        @error('password')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>

      <div class="field" style="margin-bottom:28px">
        <label for="password_confirmation">Confirm new password</label>
        <div class="password-field">
          <input class="input" id="password_confirmation" type="password" name="password_confirmation" required>
        </div>
      </div>

      @error('email')
        <div class="error-text" style="margin-bottom:16px">{{ $message }}</div>
      @enderror

      <button type="submit" class="btn btn-primary" style="justify-content:center;padding:12px;width:100%">Save new password</button>
    </form>
    <div style="margin-top:18px;font-size:13px"><a href="{{ route('console.login') }}">Back to sign in</a></div>
  </div>
</div>
<script src="{{ asset('js/password-toggle.js') }}"></script>
</body>
</html>
