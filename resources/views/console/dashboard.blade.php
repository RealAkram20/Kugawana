@extends('console.layout', ['title' => $title])

@section('content')
<div class="kpi-grid">
  @foreach ($kpis as $k)
    <div class="kpi">
      <div class="kpi-top">
        <div class="kpi-label">{{ $k['label'] }}</div>
        <div class="kpi-icon">@include('console.partials.icon', ['name' => $k['icon']])</div>
      </div>
      <div class="kpi-value">{{ $k['value'] }}</div>
      <div class="kpi-delta {{ $k['alert'] ? 'alert' : '' }}">{{ $k['delta'] }}</div>
    </div>
  @endforeach
</div>

<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-bottom:24px" class="grid-2">
  <div class="panel">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px">
      <h5 style="margin:0">Donations this week</h5>
      <span class="text-muted" style="font-size:12px">listings per day</span>
    </div>
    <div class="bars">
      @foreach ($weekBars as $b)
        <div class="bar-col">
          <div class="bar {{ $b['highlight'] ? 'highlight' : '' }}" style="height:{{ max($b['h'], 2) }}px" title="{{ $b['v'] }} listings"></div>
          <div class="bar-label">{{ $b['day'] }}</div>
        </div>
      @endforeach
    </div>
  </div>
  <div class="panel" style="display:flex;flex-direction:column">
    <h5 style="margin:0 0 14px">Recent activity</h5>
    <div style="display:flex;flex-direction:column">
      @forelse ($activity as $a)
        <div class="activity-row">
          <div class="activity-dot {{ $a['accent'] ? 'accent' : '' }}"></div>
          <div style="min-width:0">
            <div style="font-size:13px;line-height:1.35">{{ $a['text'] }}</div>
            <div style="font-size:11px;color:var(--color-neutral-500);margin-top:2px">{{ $a['at']->diffForHumans() }}</div>
          </div>
        </div>
      @empty
        <div class="text-muted" style="font-size:13px">No activity yet</div>
      @endforelse
    </div>
  </div>
</div>

<div class="panel">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <h5 style="margin:0">Awaiting review</h5>
    <a class="btn btn-ghost" href="{{ route('console.donations.index') }}">View all donations</a>
  </div>
  <table class="table">
    <thead><tr><th>ID</th><th>Food</th><th>Donor</th><th>Category</th><th>Quantity</th><th>Submitted</th><th>Status</th></tr></thead>
    <tbody>
      @forelse ($pending as $d)
        <tr onclick="window.location='{{ route('console.donations.show', $d) }}'" style="cursor:pointer">
          <td style="color:var(--color-neutral-600)">FD-{{ $d->id }}</td>
          <td style="font-weight:600">{{ $d->title }}</td>
          <td>{{ $d->donor?->name }}</td>
          <td>{{ $d->category?->name }}</td>
          <td>{{ $d->quantity }}</td>
          <td style="color:var(--color-neutral-600)">{{ $d->created_at->diffForHumans() }}</td>
          <td><span class="tag {{ \App\Support\ConsoleUi::tagClass($d->status->value) }}">{{ $d->status->getLabel() }}</span></td>
        </tr>
      @empty
        <tr><td colspan="7" class="text-muted">Nothing awaiting review</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
