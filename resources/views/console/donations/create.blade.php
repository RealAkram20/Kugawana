@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.donations.index') }}" style="margin-bottom:14px">← Back to donations</a>

<div style="margin-bottom:22px">
  <h2 style="margin:0 0 6px">Add food</h2>
  <div class="text-muted" style="font-size:14px">Record food handed in by an agency, NGO or walk-in donor who has no account in the app.</div>
</div>

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

<form method="POST" action="{{ route('console.donations.store') }}" enctype="multipart/form-data">
  @csrf

  <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px" class="grid-2">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <h5 style="margin:0 0 6px">Who donated it</h5>
        <p class="text-muted" style="font-size:13px;margin:0 0 14px">Type the agency or NGO name — or pick an existing member instead. Typing a name creates a donor record without an account, so nothing needs to be registered by them.</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="grid-2">
          <div class="field">
            <label>Agency / NGO / donor name</label>
            <input class="input" name="donor_name" value="{{ old('donor_name') }}" placeholder="e.g. World Food Programme">
          </div>
          <div class="field">
            <label>Or assign an existing member</label>
            <select class="input" name="donor_id">
              <option value="">— None —</option>
              @foreach ($donors as $donor)
                <option value="{{ $donor->id }}" @selected(old('donor_id') == $donor->id)>{{ $donor->name }}{{ $donor->phone ? ' · '.$donor->phone : '' }}</option>
              @endforeach
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="grid-2">
          <div class="field">
            <label>Contact phone <span class="text-muted">(optional, new donors only)</span></label>
            <input class="input" name="donor_phone" value="{{ old('donor_phone') }}" placeholder="+2567…">
          </div>
          <div class="field">
            <label>Contact email <span class="text-muted">(optional, new donors only)</span></label>
            <input class="input" name="donor_email" value="{{ old('donor_email') }}" placeholder="contact@agency.org">
          </div>
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Food details</h5>

        <div class="field" style="margin-bottom:12px">
          <label>Title</label>
          <input class="input" name="title" value="{{ old('title') }}" placeholder="e.g. Maize flour, 25 Kg sacks" required>
        </div>

        <div class="field" style="margin-bottom:12px">
          <label>Category</label>
          <select class="input" name="food_category_id" required>
            @foreach ($categories as $category)
              <option value="{{ $category->id }}" @selected(old('food_category_id') == $category->id)>{{ $category->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="field" style="margin-bottom:12px">
          <label>Description</label>
          <textarea class="input" name="description" rows="3" placeholder="What is it, and anything people should know">{{ old('description') }}</textarea>
        </div>

        <div class="field">
          <label>Special instructions</label>
          <input class="input" name="special_instructions" value="{{ old('special_instructions') }}" placeholder="Optional">
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Quantity &amp; timing</h5>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="field">
            <label>Quantity</label>
            <input class="input" type="number" name="amount" step="0.01" min="0.01" value="{{ old('amount') }}" required>
          </div>
          <div class="field">
            <label>Unit</label>
            <select class="input" name="unit_id" required>
              @foreach ($units as $unit)
                <option value="{{ $unit->id }}" @selected(old('unit_id') == $unit->id)>{{ $unit->name }} ({{ $unit->symbol }})</option>
              @endforeach
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field">
            <label>Prepared on</label>
            <input class="input" type="date" name="preparation_date" value="{{ old('preparation_date') }}">
          </div>
          <div class="field">
            <label>Best before</label>
            <input class="input" type="datetime-local" name="expiry_date" value="{{ old('expiry_date') }}" required>
          </div>
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Pickup &amp; location</h5>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="field">
            <label>Pickup address</label>
            <input class="input" name="pickup_address" value="{{ old('pickup_address') }}">
          </div>
          <div class="field">
            <label>Contact number</label>
            <input class="input" name="contact_number" value="{{ old('contact_number') }}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field">
            <label>Latitude</label>
            <input class="input" type="number" step="any" name="latitude" value="{{ old('latitude') }}" placeholder="Optional, e.g. 0.3476">
          </div>
          <div class="field">
            <label>Longitude</label>
            <input class="input" type="number" step="any" name="longitude" value="{{ old('longitude') }}" placeholder="Optional, e.g. 32.5825">
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <h5 style="margin:0 0 6px">Photos</h5>
        <p class="text-muted" style="font-size:13px;margin:0 0 14px">The first photo is the listing thumbnail. Up to {{ 5 }} in total.</p>

        <div class="field">
          <label>Add photos</label>
          <input class="input" type="file" name="images[]" accept="image/*" multiple>
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Logistics</h5>

        @if ($countries->count() > 1)
          <div class="field" style="margin-bottom:12px">
            <label>Country</label>
            <select class="input" name="country_id" required>
              @foreach ($countries as $country)
                <option value="{{ $country->id }}" @selected(old('country_id') == $country->id)>{{ $country->name }}</option>
              @endforeach
            </select>
          </div>
        @else
          <input type="hidden" name="country_id" value="{{ $countries->first()->id }}">
        @endif

        <div class="field" style="margin-bottom:12px">
          <label>Warehouse</label>
          <select class="input" name="warehouse_id">
            <option value="">Not assigned</option>
            @foreach ($warehouses as $w)
              <option value="{{ $w->id }}" @selected(old('warehouse_id') == $w->id)>{{ $w->name }}</option>
            @endforeach
          </select>
          <p class="text-muted" style="font-size:12px;margin:6px 0 0">Where the food is stored. <a href="{{ route('console.warehouses.create') }}">Add a warehouse</a> if it is missing.</p>
        </div>

        <div class="field">
          <label>Points required</label>
          <input class="input" type="number" name="points_required" min="0" value="{{ old('points_required', 0) }}" required>
          <p class="text-muted" style="font-size:12px;margin:6px 0 0">A published listing needs points above zero.</p>
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:10px;margin-top:16px">
    <button type="submit" name="action" value="publish" class="btn btn-primary" style="min-width:180px;justify-content:center">Add &amp; publish now</button>
    <button type="submit" name="action" value="approve" class="btn btn-secondary" style="border-color:var(--color-divider)">Add as approved</button>
    <a class="btn btn-ghost" href="{{ route('console.donations.index') }}">Cancel</a>
  </div>
</form>
@endsection
