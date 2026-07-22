@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp
<div style="display:flex;justify-content:flex-end;margin-bottom:16px">
  <a class="btn btn-primary" href="{{ url('backoffice/super-admin/reward-campaigns/create') }}">@include('console.partials.icon', ['name' => 'plus']) New campaign</a>
</div>
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px" class="grid-2">
  @forelse ($campaigns as $c)
    <div class="panel">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
        <div style="flex:1">
          <div class="card-kicker">{{ ucfirst($c->type) }}</div>
          <div style="font-family:var(--font-heading);font-weight:800;font-size:19px;margin-top:2px">{{ $c->name }}</div>
        </div>
        <span class="tag {{ ConsoleUi::tagClass($c->display_status) }}">{{ $c->display_status }}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
        <span style="font-family:var(--font-heading);font-weight:800;font-size:22px;color:var(--color-accent)">{{ number_format($c->points) }} points</span>
      </div>
      <div class="text-muted" style="font-size:13px">
        @if ($c->starts_at && $c->ends_at)
          {{ $c->starts_at->format('d M') }} – {{ $c->ends_at->format('d M Y') }}
        @elseif ($c->ends_at)
          Ends {{ $c->ends_at->format('d M Y') }}
        @else
          Ongoing
        @endif
      </div>
    </div>
  @empty
    <div class="text-muted">No campaigns yet</div>
  @endforelse
</div>
@endsection
