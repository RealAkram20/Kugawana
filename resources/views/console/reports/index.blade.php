@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px" class="grid-4">
  @foreach ($reportKpis as $k)
    <div class="panel" style="padding:16px">
      <div style="font-size:11px;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">{{ $k['label'] }}</div>
      <div style="font-family:var(--font-heading);font-weight:800;font-size:26px">{{ $k['value'] }}</div>
    </div>
  @endforeach
</div>

<div class="panel" style="margin-bottom:24px">
  <h5 style="margin:0 0 18px">Donations by month</h5>
  <div class="bars" style="gap:20px">
    @foreach ($monthBars as $b)
      <div class="bar-col">
        <div class="bar-label">{{ $b['v'] }}</div>
        <div class="bar highlight" style="height:{{ max($b['h'], 2) }}px"></div>
        <div class="bar-label">{{ $b['m'] }}</div>
      </div>
    @endforeach
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="grid-2">
  <div class="panel-table">
    <h5 style="margin:14px 0 4px">Top donors</h5>
    <table class="table">
      <thead><tr><th>Donor</th><th>Donations</th></tr></thead>
      <tbody>
        @forelse ($topDonors as $d)
          <tr><td style="font-weight:600">{{ $d->name }}</td><td>{{ $d->donations_count }}</td></tr>
        @empty
          <tr><td colspan="2" class="text-muted">No donors yet</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>
  <div class="panel-table">
    <h5 style="margin:14px 0 4px">Top receivers</h5>
    <table class="table">
      <thead><tr><th>Receiver</th><th>Orders</th><th>Score</th></tr></thead>
      <tbody>
        @forelse ($topReceivers as $r)
          <tr><td style="font-weight:600">{{ $r->name }}</td><td>{{ $r->orders_count }}</td><td>{{ $r->responsibility_score }}</td></tr>
        @empty
          <tr><td colspan="3" class="text-muted">No receivers yet</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>
</div>
@endsection
