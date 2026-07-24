@extends('console.layout', ['title' => $title])

@section('content')
@php
use Illuminate\Support\Facades\Storage;

$amountValue = rtrim(rtrim(number_format((float) $donation->amount, 2, '.', ''), '0'), '.');
@endphp

<a class="btn btn-ghost" href="{{ route('console.donations.show', $donation) }}" style="margin-bottom:14px">← Back to donation</a>

<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:22px;flex-wrap:wrap">
  <div>
    <h2 style="margin:0 0 6px">Edit {{ $donation->title }}</h2>
    <div class="text-muted" style="font-size:14px">FD-{{ $donation->id }} · shared by {{ $donation->donor?->name }} · stays credited to them</div>
  </div>
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

<form method="POST" action="{{ route('console.donations.update', $donation) }}" enctype="multipart/form-data">
  @csrf

  <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px" class="grid-2">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <h5 style="margin:0 0 16px">Food details</h5>

        <div class="field" style="margin-bottom:12px">
          <label>Title</label>
          <input class="input" name="title" value="{{ old('title', $donation->title) }}" required>
        </div>

        <div class="field" style="margin-bottom:12px">
          <label>Category</label>
          <select class="input" name="food_category_id" required>
            @foreach ($categories as $category)
              <option value="{{ $category->id }}" @selected(old('food_category_id', $donation->food_category_id) == $category->id)>{{ $category->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="field" style="margin-bottom:12px">
          <label>Description</label>
          <textarea class="input" name="description" rows="3" placeholder="What is it, and anything people should know">{{ old('description', $donation->description) }}</textarea>
        </div>

        <div class="field">
          <label>Special instructions</label>
          <input class="input" name="special_instructions" value="{{ old('special_instructions', $donation->special_instructions) }}" placeholder="Optional">
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Quantity &amp; timing</h5>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="field">
            <label>Quantity</label>
            <input class="input" type="number" name="amount" step="0.01" min="0.01" value="{{ old('amount', $amountValue) }}" @disabled($donation->isSplit()) required>
            @if ($donation->isSplit())
              <p class="text-muted" style="font-size:12px;margin:6px 0 0">This batch is split into {{ $donation->units_total }} units. Undo the split to change the total.</p>
            @endif
          </div>
          <div class="field">
            <label>Unit</label>
            <select class="input" name="unit_id" required>
              @foreach ($units as $unit)
                <option value="{{ $unit->id }}" @selected(old('unit_id', $donation->unit_id) == $unit->id)>{{ $unit->name }} ({{ $unit->symbol }})</option>
              @endforeach
            </select>
          </div>
        </div>
        @if ($donation->isSplit())
          <input type="hidden" name="amount" value="{{ $amountValue }}">
        @endif

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field">
            <label>Prepared on</label>
            <input class="input" type="date" name="preparation_date" value="{{ old('preparation_date', $donation->preparation_date?->format('Y-m-d')) }}">
          </div>
          <div class="field">
            <label>Best before</label>
            <input class="input" type="datetime-local" name="expiry_date" value="{{ old('expiry_date', $donation->expiry_date?->format('Y-m-d\TH:i')) }}" required>
          </div>
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Pickup &amp; location</h5>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="field">
            <label>Pickup address</label>
            <input class="input" name="pickup_address" value="{{ old('pickup_address', $donation->pickup_address) }}">
          </div>
          <div class="field">
            <label>Contact number</label>
            <input class="input" name="contact_number" value="{{ old('contact_number', $donation->contact_number) }}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="field">
            <label>Latitude</label>
            <input class="input" type="number" step="any" name="latitude" value="{{ old('latitude', $donation->latitude) }}" placeholder="Optional, e.g. 0.3476">
          </div>
          <div class="field">
            <label>Longitude</label>
            <input class="input" type="number" step="any" name="longitude" value="{{ old('longitude', $donation->longitude) }}" placeholder="Optional, e.g. 32.5825">
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <h5 style="margin:0 0 6px">Photos</h5>
        <p class="text-muted" style="font-size:13px;margin:0 0 14px">The first photo is the listing thumbnail. Up to {{ 5 }} in total.</p>

        @if (! empty($donation->images))
          <div class="field" style="margin-bottom:14px">
            <label>Current photos — tick any to remove</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
              @foreach ($donation->images as $path)
                <label style="cursor:pointer;text-align:center">
                  <img src="{{ Storage::url($path) }}" style="width:80px;height:80px;object-fit:cover;display:block;border:1px solid var(--color-divider)">
                  <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;margin-top:5px">
                    <input type="checkbox" name="remove_images[]" value="{{ $path }}"> Remove
                  </span>
                </label>
              @endforeach
            </div>
          </div>
        @endif

        <div class="field">
          <label>Add photos</label>
          <input class="input" type="file" name="images[]" accept="image/*" multiple>
        </div>
      </div>

      <div class="panel">
        <h5 style="margin:0 0 16px">Logistics</h5>

        <div class="field" style="margin-bottom:12px">
          <label>Warehouse</label>
          <select class="input" name="warehouse_id">
            <option value="">Not assigned</option>
            @foreach ($warehouses as $w)
              <option value="{{ $w->id }}" @selected(old('warehouse_id', $donation->warehouse_id) == $w->id)>{{ $w->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="field">
          <label>Points {{ $donation->isSplit() ? 'per unit' : 'required' }}</label>
          <input class="input" type="number" name="points_required" min="0" value="{{ old('points_required', $donation->points_required) }}" required>
          <p class="text-muted" style="font-size:12px;margin:6px 0 0">A published listing needs points above zero.</p>
        </div>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:10px;margin-top:16px">
    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save changes</button>
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.donations.show', $donation) }}">Cancel</a>
  </div>
</form>
@endsection
