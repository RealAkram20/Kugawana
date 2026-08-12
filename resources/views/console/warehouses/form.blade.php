@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.warehouses.index') }}" style="margin-bottom:14px">← Back to warehouses</a>

<h2 style="margin:0 0 22px">{{ $title }}</h2>

@if ($errors->any())
  <div class="panel" style="margin-bottom:16px;border-left:3px solid var(--color-accent)">
    <div style="font-weight:600;margin-bottom:6px">Please fix the following</div>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--color-accent)">
      @foreach ($errors->all() as $error)
        <li>{{ $error }}</li>
      @endforeach
    </ul>
  </div>
@endif

<form method="POST"
      action="{{ $warehouse->exists ? route('console.warehouses.update', $warehouse) : route('console.warehouses.store') }}"
      style="max-width:720px">
  @csrf

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 16px">Warehouse details</h5>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-bottom:12px" class="grid-2">
      <div class="field">
        <label>Name</label>
        <input class="input" name="name" value="{{ old('name', $warehouse->name) }}" placeholder="e.g. Kampala Central Store" required>
      </div>
      <div class="field">
        <label>Country</label>
        <select class="input" name="country_id" required @disabled($countries->count() === 1)>
          @foreach ($countries as $country)
            <option value="{{ $country->id }}" @selected(old('country_id', $warehouse->country_id ?? $countries->first()->id) == $country->id)>{{ $country->name }}</option>
          @endforeach
        </select>
        @if ($countries->count() === 1)
          <input type="hidden" name="country_id" value="{{ $countries->first()->id }}">
        @endif
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:12px;margin-bottom:12px" class="grid-2">
      <div class="field">
        <label>District</label>
        <input class="input" name="district" value="{{ old('district', $warehouse->district) }}" placeholder="Optional">
      </div>
      <div class="field">
        <label>Address</label>
        <input class="input" name="address" value="{{ old('address', $warehouse->address) }}" placeholder="Street and area, shown to admins only">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="grid-2">
      <div class="field">
        <label>Latitude</label>
        <input class="input" type="number" step="any" name="latitude" value="{{ old('latitude', $warehouse->latitude) }}" placeholder="Optional, e.g. 0.3476">
      </div>
      <div class="field">
        <label>Longitude</label>
        <input class="input" type="number" step="any" name="longitude" value="{{ old('longitude', $warehouse->longitude) }}" placeholder="Optional, e.g. 32.5825">
      </div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 16px">Storage</h5>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="grid-2">
      <div class="field">
        <label>Capacity</label>
        <input class="input" type="number" name="capacity" min="0" value="{{ old('capacity', $warehouse->capacity) }}" placeholder="Optional — items it can hold">
      </div>
      <div class="field">
        <label style="display:flex;align-items:center;gap:8px;margin-top:28px;cursor:pointer">
          <input type="checkbox" name="is_refrigerated" value="1" @checked(old('is_refrigerated', $warehouse->is_refrigerated))>
          Has cold storage
        </label>
      </div>
    </div>

    <div class="field">
      <label>Notes</label>
      <textarea class="input" name="notes" rows="3" placeholder="Opening hours, gate instructions, who holds the keys…">{{ old('notes', $warehouse->notes) }}</textarea>
    </div>
  </div>

  <div style="display:flex;gap:10px">
    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $warehouse->exists ? 'Save changes' : 'Add warehouse' }}</button>
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.warehouses.index') }}">Cancel</a>
  </div>
</form>
@endsection
