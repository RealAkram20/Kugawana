@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\TopupStatus;
use App\Support\ConsoleUi;
@endphp

<h5 style="margin:0 0 12px">Point bundles</h5>

<details class="panel" style="margin-bottom:16px" @if ($errors->any()) open @endif>
  <summary style="cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px">
    @include('console.partials.icon', ['name' => 'plus'])
    New bundle
    <span class="text-muted" style="font-weight:400;font-size:13px">— a points-for-money pack members can buy</span>
  </summary>
  <div style="margin-top:16px;max-width:560px">
    @include('console.wallet._package-form', [
      'package' => null,
      'action' => route('console.wallet.packages.store'),
      'submitLabel' => 'Create bundle',
    ])
  </div>
</details>

<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px" class="grid-4">
  @forelse ($packages as $p)
    <div class="panel" style="padding:16px;{{ $p->is_active ? '' : 'opacity:0.6' }}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-family:var(--font-heading);font-weight:800;font-size:24px">{{ number_format($p->points) }}</div>
          <div style="font-size:12px;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">points</div>
        </div>
        @unless ($p->is_active)<span class="tag tag-outline" style="font-size:10px">Off</span>@endunless
      </div>
      <div style="font-size:15px;font-weight:600;color:var(--color-accent-700)">{{ $p->currency }} {{ number_format((float) $p->price) }}</div>
      <div class="text-muted" style="font-size:12px;margin:4px 0 12px">{{ $p->name }} · {{ $p->country?->name ?? 'All countries' }}</div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <a class="btn btn-ghost" style="padding:6px 8px" href="{{ route('console.wallet.packages.edit', $p) }}">Edit</a>
        <form method="POST" action="{{ route('console.wallet.packages.toggle', $p) }}" style="display:inline">
          @csrf
          <button type="submit" class="btn btn-ghost" style="padding:6px 8px">{{ $p->is_active ? 'Disable' : 'Enable' }}</button>
        </form>
        <form method="POST" action="{{ route('console.wallet.packages.destroy', $p) }}" style="display:inline" onsubmit="return confirm('Delete this bundle?')">
          @csrf
          <button type="submit" class="btn btn-ghost" style="padding:6px 8px;color:var(--color-accent-700)">Delete</button>
        </form>
      </div>
    </div>
  @empty
    <div class="text-muted">No bundles yet</div>
  @endforelse
</div>

<h5 style="margin:0 0 12px">Top up requests</h5>

<div class="panel-table">
  <table class="table">
    <thead><tr><th>Request</th><th>User</th><th>Points</th><th>Amount</th><th>Method</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($requests as $w)
        <tr>
          <td style="color:var(--color-neutral-600)">WR-{{ $w->id }}</td>
          <td style="font-weight:600">{{ $w->user?->name }}</td>
          <td>{{ number_format($w->points) }}{{ $w->pointPackage ? ' · ' . $w->pointPackage->name : '' }}</td>
          <td>{{ $w->currency }} {{ number_format((float) $w->amount) }}</td>
          <td>{{ ucfirst($w->payment_method) }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($w->status->value) }}">{{ $w->status->getLabel() }}</span></td>
          <td style="text-align:right;white-space:nowrap">
            @if ($w->status === TopupStatus::Pending)
              <form method="POST" action="{{ route('console.wallet.approve', $w) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Approve</button>
              </form>
              <form method="POST" action="{{ route('console.wallet.reject', $w) }}" style="display:inline" onsubmit="return confirm('Reject this topup request?')">
                @csrf
                <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Reject</button>
              </form>
            @endif
          </td>
        </tr>
      @empty
        <tr><td colspan="7" class="text-muted">No wallet requests yet</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
<div style="margin-top:16px">{{ $requests->links() }}</div>
@endsection
