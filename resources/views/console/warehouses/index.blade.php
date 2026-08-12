@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap">
  <div class="text-muted" style="font-size:14px">Where collected food is stored before it is published.</div>
  <div style="flex:1"></div>
  <a class="btn btn-primary" href="{{ route('console.warehouses.create') }}">@include('console.partials.icon', ['name' => 'plus']) Add warehouse</a>
</div>

<div class="panel-table">
  <table class="table">
    <thead><tr><th>Name</th><th>Country</th><th>District</th><th>Address</th><th>Capacity</th><th>Cold storage</th><th>Food items</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($warehouses as $w)
        <tr>
          <td style="font-weight:600">{{ $w->name }}</td>
          <td>{{ $w->country?->name }}</td>
          <td>{{ $w->district ?: '—' }}</td>
          <td style="color:var(--color-neutral-600)">{{ $w->address ?: '—' }}</td>
          <td>{{ $w->capacity !== null ? number_format($w->capacity) : '—' }}</td>
          <td>{{ $w->is_refrigerated ? 'Yes' : 'No' }}</td>
          <td>{{ $w->donations_count }}</td>
          <td>
            <form method="POST" action="{{ route('console.warehouses.toggle', $w) }}">
              @csrf
              <button type="submit" class="toggle-pill {{ $w->is_active ? 'on' : '' }}">{{ $w->is_active ? 'Active' : 'Inactive' }}</button>
            </form>
          </td>
          <td><a class="btn btn-ghost" href="{{ route('console.warehouses.edit', $w) }}">Edit</a></td>
        </tr>
      @empty
        <tr><td colspan="9" style="text-align:center;padding:32px;color:var(--color-neutral-600)">No warehouses yet — add the first one to start receiving agency and NGO donations.</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
