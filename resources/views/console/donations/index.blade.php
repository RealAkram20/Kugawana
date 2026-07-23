@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap">
  @foreach ($filters as $f)
    <a href="{{ route('console.donations.index', array_filter(['status' => $f === 'all' ? null : $f, 'q' => $search])) }}"
       class="filter-chip {{ $activeFilter === $f ? 'active' : '' }}">{{ $f === 'all' ? 'All' : ucfirst($f) }}</a>
  @endforeach
  <div style="flex:1"></div>
  <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.donations.export') }}">Export CSV</a>
</div>

<div class="panel-table">
  <table class="table">
    <thead><tr><th>ID</th><th>Food</th><th>Donor</th><th>Category</th><th>Quantity</th><th>Units</th><th>District</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($donations as $d)
        <tr onclick="window.location='{{ route('console.donations.show', $d) }}'" style="cursor:pointer">
          <td style="color:var(--color-neutral-600)">FD-{{ $d->id }}</td>
          <td style="font-weight:600">{{ $d->title }}</td>
          <td>{{ $d->donor?->name }}</td>
          <td>{{ $d->category?->name }}</td>
          <td>{{ $d->quantity }}</td>
          <td style="color:var(--color-neutral-600)">
            @if ($d->isSplit()) {{ $d->units_available }} of {{ $d->units_total }} × {{ $d->unit_quantity }} @else Whole @endif
          </td>
          <td style="color:var(--color-neutral-600)">{{ $d->pickup_address }}</td>
          <td style="color:var(--color-neutral-600)">{{ $d->created_at->diffForHumans() }}</td>
          <td><span class="tag {{ \App\Support\ConsoleUi::tagClass($d->status->value) }}">{{ $d->status->getLabel() }}</span></td>
          <td style="text-align:right;color:var(--color-neutral-500)">@include('console.partials.icon', ['name' => 'chevron'])</td>
        </tr>
      @empty
        <tr><td colspan="10" class="text-muted">No donations found</td></tr>
      @endforelse
    </tbody>
  </table>
</div>

<div style="margin-top:16px">{{ $donations->links() }}</div>
@endsection
