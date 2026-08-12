<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Delete your Kugawana account</title>
  <style>
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #1E2421; background: #FAF9F6; margin: 0; }
    main { max-width: 640px; margin: 0 auto; padding: 48px 24px 96px; line-height: 1.6; }
    h1 { font-size: 28px; }
    h2 { font-size: 18px; margin-top: 32px; }
    ol { padding-left: 20px; }
    .muted { color: #66746C; font-size: 14px; }
  </style>
</head>
<body>
<main>
  <h1>Delete your Kugawana account</h1>

  <h2>From the app (fastest)</h2>
  <ol>
    <li>Open Kugawana and sign in.</li>
    <li>Go to <strong>Profile → Edit profile → Delete account</strong>.</li>
    <li>Confirm. Your account is deleted immediately.</li>
  </ol>

  <h2>If you can no longer sign in</h2>
  <p>Email <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a> from the address you registered with, with the subject "Delete my account", and we will delete it within 7 days.</p>

  <h2>What is deleted, what is kept</h2>
  <p>Deleting your account permanently removes your name, email address, phone number, photo, location, and sign-in methods, and disconnects all devices. Records of completed orders, donations, and points transactions are kept in anonymised form for bookkeeping and fraud prevention — they can no longer be linked to you.</p>

  <p class="muted">Kugawana — food sharing, fairly.</p>
</main>
</body>
</html>
