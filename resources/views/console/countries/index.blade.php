@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px" class="grid-3">
  @foreach ($countries as $c)
    <div class="panel" style="padding:18px;display:flex;align-items:center;gap:14px">
      <div style="width:42px;height:42px;flex:none;background:{{ $c->is_active ? 'var(--color-accent)' : 'var(--color-neutral-300)' }};color:{{ $c->is_active ? 'var(--color-bg)' : 'var(--color-neutral-700)' }};display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;font-size:13px">{{ $c->code }}</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:16px">{{ $c->name }}</div>
        <div style="font-size:12px;color:var(--color-neutral-600)">{{ $c->users_count > 0 ? number_format($c->users_count) . ' users' : '—' }}</div>
      </div>
      <form method="POST" action="{{ route('console.countries.toggle', $c) }}">
        @csrf
        <button type="submit" class="toggle-pill {{ $c->is_active ? 'solid-on' : '' }}" style="padding:6px 14px">
          {{ $c->is_active ? 'Enabled' : 'Enable' }}
        </button>
      </form>
    </div>
  @endforeach
</div>
@endsection
