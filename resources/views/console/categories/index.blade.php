@extends('console.layout', ['title' => $title])

@section('content')
<div style="display:flex;justify-content:flex-end;margin-bottom:16px">
  <form method="POST" action="{{ route('console.categories.store') }}" style="display:flex;gap:8px">
    @csrf
    <input class="input" name="name" placeholder="Category name" required style="width:220px">
    <button type="submit" class="btn btn-primary">@include('console.partials.icon', ['name' => 'plus']) Add category</button>
  </form>
</div>
@error('name')
  <div class="error-text" style="margin-bottom:12px;text-align:right">{{ $message }}</div>
@enderror

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px" class="grid-3">
  @foreach ($categories as $c)
    <div class="panel" style="padding:16px;display:flex;align-items:center;gap:12px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:15px">{{ $c->name }}</div>
        <div style="font-size:12px;color:var(--color-neutral-600)">{{ $c->donations_count }} items</div>
      </div>
      <form method="POST" action="{{ route('console.categories.toggle', $c) }}">
        @csrf
        <button type="submit" class="toggle-pill {{ $c->is_active ? 'on' : '' }}">{{ $c->is_active ? 'Enabled' : 'Disabled' }}</button>
      </form>
    </div>
  @endforeach
</div>
@endsection
