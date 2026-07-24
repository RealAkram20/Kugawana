@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\TransactionType;
use App\Support\ConsoleUi;

$status = ! $user->is_active ? 'Suspended' : ($user->responsibility_score < 50 ? 'Flagged' : 'Active');
@endphp

<a class="btn btn-ghost" href="{{ route('console.users.index') }}" style="margin-bottom:14px">← Back to members</a>

<div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;flex-wrap:wrap">
  <div class="avatar-block" style="width:52px;height:52px">{{ ConsoleUi::initials($user->name) }}</div>
  <div>
    <h2 style="margin:0 0 4px">{{ $user->name }}</h2>
    <div class="text-muted" style="font-size:14px">
      Member · {{ $user->phone ?: 'no phone' }}{{ $user->district ? ' · ' . $user->district : '' }}
    </div>
  </div>
  <div style="flex:1"></div>
  <span class="tag {{ ConsoleUi::tagClass($status) }}" style="font-size:13px;padding:6px 14px">{{ $status }}</span>
</div>

<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px" class="grid-2">
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="panel">
      <h5 style="margin:0 0 12px">Shared food ({{ $donations->count() }})</h5>
      @forelse ($donations as $d)
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--color-divider)">
          <div style="flex:1;min-width:0">
            <a href="{{ route('console.donations.show', $d) }}" style="font-weight:600;color:inherit">{{ $d->title }}</a>
            <div class="text-muted" style="font-size:12px">{{ $d->quantity }}@if ($d->isSplit()) · {{ $d->units_available }} of {{ $d->units_total }} left @endif</div>
          </div>
          <span class="tag {{ ConsoleUi::tagClass($d->status->value) }}" style="font-size:11px">{{ $d->status->getLabel() }}</span>
        </div>
      @empty
        <p class="text-muted" style="font-size:13px;margin:0">Has not shared any food yet.</p>
      @endforelse
    </div>

    <div class="panel">
      <h5 style="margin:0 0 12px">Requests ({{ $requests->count() }})</h5>
      @forelse ($requests as $o)
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--color-divider)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">{{ $o->foodDonation?->title ?? 'Removed food' }}</div>
            <div class="text-muted" style="font-size:12px">{{ $o->units }} unit(s) · {{ $o->points_spent }} pts · {{ $o->created_at->diffForHumans() }}</div>
          </div>
          <span class="tag {{ ConsoleUi::tagClass($o->status->value) }}" style="font-size:11px">{{ $o->status->getLabel() }}</span>
        </div>
      @empty
        <p class="text-muted" style="font-size:13px;margin:0">Has not requested any food yet.</p>
      @endforelse
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="panel">
      <h5 style="margin:0 0 6px">Points balance</h5>
      <div style="font-size:34px;font-weight:800;line-height:1">{{ number_format($user->wallet_balance) }}</div>

      <form method="POST" action="{{ route('console.users.grant', $user) }}" style="margin-top:16px">
        @csrf
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          <div class="field">
            <label>Points</label>
            <input class="input" type="number" name="points" min="1" placeholder="e.g. 100" required>
          </div>
          <div class="field">
            <label>Reason</label>
            <input class="input" name="reason" value="reward" required>
          </div>
        </div>
        @error('points')<p class="text-muted" style="font-size:12px;margin:0 0 10px;color:var(--color-accent)">{{ $message }}</p>@enderror
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Grant points</button>
      </form>
    </div>

    <div class="panel">
      <h5 style="margin:0 0 12px">Points history</h5>
      @forelse ($transactions as $tx)
        @php $credit = $tx->type === TransactionType::Credit; @endphp
        <div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-top:1px solid var(--color-divider)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;text-transform:capitalize">{{ $tx->reason }}</div>
            <div class="text-muted" style="font-size:11px">{{ $tx->created_at->format('d M Y, g:i A') }}</div>
          </div>
          <div style="font-weight:700;color:{{ $credit ? 'var(--color-success, #2D6A2D)' : 'var(--color-accent-700)' }}">
            {{ $credit ? '+' : '−' }}{{ number_format($tx->points) }}
          </div>
        </div>
      @empty
        <p class="text-muted" style="font-size:13px;margin:0">No points activity yet.</p>
      @endforelse
    </div>

    <div class="panel">
      <h5 style="margin:0 0 12px">Account</h5>
      <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:14px">
        <span class="text-muted">Responsibility score</span>
        <span style="font-weight:600">{{ $user->responsibility_score }}</span>
      </div>
      <form method="POST" action="{{ route('console.users.toggle', $user) }}">
        @csrf
        <button type="submit" class="btn btn-secondary" style="width:100%;justify-content:center;{{ $user->is_active ? 'color:var(--color-accent-700);' : '' }}border-color:var(--color-divider)">
          {{ $user->is_active ? 'Suspend member' : 'Activate member' }}
        </button>
      </form>
    </div>
  </div>
</div>
@endsection
