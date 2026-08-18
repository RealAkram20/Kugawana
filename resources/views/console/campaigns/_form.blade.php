@php
$typeLabels = ['signup' => 'Sign up reward', 'donation' => 'Donation reward', 'manual' => 'Manual grant'];
$active = old('is_active', $campaign?->is_active ?? true);
@endphp

<form method="POST" action="{{ $action }}">
  @csrf

  <div class="field" style="margin-bottom:12px">
    <label>Name</label>
    <input class="input" name="name" value="{{ old('name', $campaign?->name) }}" placeholder="e.g. Welcome bonus" required>
    @error('name')<p class="text-muted" style="font-size:12px;margin:6px 0 0;color:var(--color-accent)">{{ $message }}</p>@enderror
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="field">
      <label>Awards on</label>
      <select class="input" name="type" required>
        @foreach ($typeLabels as $value => $label)
          <option value="{{ $value }}" @selected(old('type', $campaign?->type ?? 'signup') === $value)>{{ $label }}</option>
        @endforeach
      </select>
    </div>
    <div class="field">
      <label>Points</label>
      <input class="input" type="number" name="points" min="1" value="{{ old('points', $campaign?->points) }}" required>
    </div>
  </div>
  <p class="text-muted" style="font-size:12px;margin:-4px 0 12px">Sign up rewards fire when a member joins; donation rewards fire when they complete a donation.</p>

  @if ($isSuper)
    <div class="field" style="margin-bottom:12px">
      <label>Country</label>
      <select class="input" name="country_id">
        <option value="">All countries</option>
        @foreach ($countries as $country)
          <option value="{{ $country->id }}" @selected(old('country_id', $campaign?->country_id) == $country->id)>{{ $country->name }}</option>
        @endforeach
      </select>
    </div>
  @endif

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="field">
      <label>Starts (optional)</label>
      <input class="input" type="datetime-local" name="starts_at" value="{{ old('starts_at', $campaign?->starts_at?->format('Y-m-d\TH:i')) }}">
    </div>
    <div class="field">
      <label>Ends (optional)</label>
      <input class="input" type="datetime-local" name="ends_at" value="{{ old('ends_at', $campaign?->ends_at?->format('Y-m-d\TH:i')) }}">
      @error('ends_at')<p class="text-muted" style="font-size:12px;margin:6px 0 0;color:var(--color-accent)">{{ $message }}</p>@enderror
    </div>
  </div>

  <div class="field" style="margin-bottom:12px">
    <label>Description (optional)</label>
    <textarea class="input" name="description" rows="2">{{ old('description', $campaign?->description) }}</textarea>
  </div>

  <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px;cursor:pointer">
    <input type="checkbox" name="is_active" value="1" @checked($active)> Active
  </label>

  <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $submitLabel }}</button>
</form>
