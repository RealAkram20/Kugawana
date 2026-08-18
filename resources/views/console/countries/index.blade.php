@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
  <div class="text-muted" style="font-size:14px">{{ $countries->where('is_active', true)->count() }} of {{ $countries->count() }} countries enabled. Members, admins and food are grouped by these.</div>
  <div style="flex:1"></div>
  <input class="input" id="countryFilter" placeholder="Search countries…" style="width:240px">
</div>

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px" class="grid-3" id="countryGrid">
  @foreach ($countries as $c)
    <div class="panel country-card" data-name="{{ strtolower($c->name.' '.$c->code) }}" style="padding:18px;display:flex;align-items:center;gap:14px">
      <div style="width:42px;height:42px;flex:none;background:{{ $c->is_active ? 'var(--color-accent)' : 'var(--color-neutral-300)' }};color:{{ $c->is_active ? 'var(--color-bg)' : 'var(--color-neutral-700)' }};display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;font-size:13px">{{ $c->code }}</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:16px">{{ $c->name }}</div>
        <div style="font-size:12px;color:var(--color-neutral-600)">{{ $c->currency_code }}{{ $c->users_count > 0 ? ' · ' . number_format($c->users_count) . ' users' : '' }}</div>
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

<script>
document.getElementById('countryFilter').addEventListener('input', (event) => {
  const term = event.target.value.trim().toLowerCase();
  document.querySelectorAll('#countryGrid .country-card').forEach((card) => {
    card.style.display = !term || card.dataset.name.includes(term) ? '' : 'none';
  });
});
</script>
@endsection
