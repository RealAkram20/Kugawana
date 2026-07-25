@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:960px" class="grid-2">
  <div class="panel">
    <h5 style="margin:0 0 12px">Point packages</h5>
    <table class="table">
      <thead><tr><th>Points</th><th>Price</th><th></th></tr></thead>
      <tbody>
        @foreach ($packages as $p)
          <tr>
            <td style="font-weight:600">{{ number_format($p->points) }}</td>
            <td>{{ $p->currency }} {{ number_format((float) $p->price) }}</td>
            <td style="text-align:right"><a class="btn btn-ghost" href="{{ url('backoffice/super-admin/point-packages/' . $p->id . '/edit') }}">Edit</a></td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </div>

  <div class="panel">
    <h5 style="margin:0 0 12px">Payment gateways</h5>
    <div style="display:flex;flex-direction:column">
      @foreach ($gateways as $g)
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
          <div style="flex:1;font-size:14px;font-weight:600">{{ $g['name'] }}</div>
          <span class="tag {{ $g['status'] === 'Active' ? 'tag-accent' : 'tag-outline' }}">{{ $g['status'] }}</span>
          @if (! empty($g['route']))
            <a class="btn btn-ghost" href="{{ $g['route'] }}">Configure</a>
          @endif
        </div>
      @endforeach
    </div>
  </div>

  <div class="panel">
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
      <h5 style="margin:0;flex:1">Email &amp; verification</h5>
      <a class="btn btn-ghost" href="{{ $mail['route'] }}">Configure</a>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
      <div style="flex:1;font-size:14px;font-weight:600">SMTP server</div>
      <span class="tag {{ $mail['smtp'] === 'Configured' ? 'tag-accent' : 'tag-outline' }}">{{ $mail['smtp'] }}</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
      <div style="flex:1;font-size:14px;font-weight:600">Verify members</div>
      <span class="tag {{ $mail['verifyUsers'] ? 'tag-accent' : 'tag-outline' }}">{{ $mail['verifyUsers'] ? 'On' : 'Off' }}</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
      <div style="flex:1;font-size:14px;font-weight:600">Verify admins</div>
      <span class="tag {{ $mail['verifyAdmins'] ? 'tag-accent' : 'tag-outline' }}">{{ $mail['verifyAdmins'] ? 'On' : 'Off' }}</span>
    </div>
  </div>

  <div class="panel">
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
      <h5 style="margin:0;flex:1">Sign-in methods</h5>
      <a class="btn btn-ghost" href="{{ $google['route'] }}">Configure</a>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
      <div style="flex:1;font-size:14px;font-weight:600">Google sign-in</div>
      <span class="tag {{ $google['status'] === 'Active' ? 'tag-accent' : 'tag-outline' }}">{{ $google['status'] }}</span>
    </div>
  </div>

  <div class="panel">
    <h5 style="margin:0 0 12px">Languages</h5>
    <p class="text-muted" style="font-size:13px;margin-bottom:14px">UI strings served from translation files. Content follows the user's selection where a translation exists.</p>
    <div style="display:flex;gap:8px">
      <span class="tag tag-accent">English</span>
      <span class="tag tag-neutral">Swahili</span>
      <span class="tag tag-neutral">Français</span>
    </div>
  </div>

  <div class="panel">
    <h5 style="margin:0 0 12px">Expiry job</h5>
    <p class="text-muted" style="font-size:13px;margin-bottom:14px">Published listings past their expiry date are unpublished automatically.</p>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
      <div style="flex:1;font-size:14px;font-weight:600">Auto unpublish interval</div>
      <span class="tag tag-neutral">Every 15 minutes</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
      <div style="flex:1;font-size:14px;font-weight:600">Scheduler</div>
      <span class="tag tag-accent">Laravel schedule</span>
    </div>
  </div>
</div>
@endsection
