@php $active = old('is_active', $package?->is_active ?? true); @endphp

<form method="POST" action="{{ $action }}">
  @csrf

  <div class="field" style="margin-bottom:12px">
    <label>Bundle name</label>
    <input class="input" name="name" value="{{ old('name', $package?->name) }}" placeholder="e.g. Starter pack" required>
    @error('name')<p class="text-muted" style="font-size:12px;margin:6px 0 0;color:var(--color-accent)">{{ $message }}</p>@enderror
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="field">
      <label>Points</label>
      <input class="input" type="number" name="points" min="1" value="{{ old('points', $package?->points) }}" required>
    </div>
    <div class="field">
      <label>Price</label>
      <input class="input" type="number" name="price" min="0" step="0.01" value="{{ old('price', $package ? rtrim(rtrim(number_format((float) $package->price, 2, '.', ''), '0'), '.') : '') }}" required>
    </div>
    <div class="field">
      <label>Currency</label>
      <input class="input" name="currency" maxlength="3" value="{{ old('currency', $package?->currency ?? 'UGX') }}" style="text-transform:uppercase" required>
    </div>
  </div>
  @error('price')<p class="text-muted" style="font-size:12px;margin:-4px 0 12px;color:var(--color-accent)">{{ $message }}</p>@enderror

  @if ($isSuper)
    <div class="field" style="margin-bottom:12px">
      <label>Country</label>
      <select class="input" name="country_id">
        <option value="">All countries</option>
        @foreach ($countries as $country)
          <option value="{{ $country->id }}" @selected(old('country_id', $package?->country_id) == $country->id)>{{ $country->name }}</option>
        @endforeach
      </select>
    </div>
  @endif

  <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px;cursor:pointer">
    <input type="checkbox" name="is_active" value="1" @checked($active)> Available to buy
  </label>

  <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $submitLabel }}</button>
</form>
