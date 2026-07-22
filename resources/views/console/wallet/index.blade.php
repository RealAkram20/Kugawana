@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\TopupStatus;
use App\Support\ConsoleUi;
@endphp
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px" class="grid-4">
  @foreach ($packages as $p)
    <div class="panel" style="padding:16px">
      <div style="font-family:var(--font-heading);font-weight:800;font-size:24px">{{ number_format($p->points) }}</div>
      <div style="font-size:12px;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">points</div>
      <div style="font-size:15px;font-weight:600;color:var(--color-accent-700)">{{ $p->currency }} {{ number_format((float) $p->price) }}</div>
    </div>
  @endforeach
</div>

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
