<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in · Kugawana</title>
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
    <h2 style="margin:0 0 4px">Sign in</h2>
    <p class="text-muted" style="margin-bottom:32px">Admin access only</p>
    <form method="POST" action="{{ route('console.login.attempt') }}">
      @csrf
      <div class="field" style="margin-bottom:16px">
        <label>Email</label>
        <input class="input" type="email" name="email" value="{{ old('email') }}" required autofocus>
      </div>
      <div class="field" style="margin-bottom:28px">
        <label>Password</label>
        <input class="input" type="password" name="password" required>
      </div>
      @error('email')
        <div class="error-text" style="margin-bottom:16px">{{ $message }}</div>
      @enderror
      <button type="submit" class="btn btn-primary" style="justify-content:center;padding:12px;width:100%">Sign in</button>
    </form>
    <div class="text-muted" style="margin-top:18px;font-size:13px">Forgot password</div>
  </div>
</div>
</body>
</html>
