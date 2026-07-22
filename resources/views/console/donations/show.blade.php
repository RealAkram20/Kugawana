@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\FoodStatus;
use App\Support\ConsoleUi;
use Illuminate\Support\Facades\Storage;

$canDecide = in_array($donation->status, [FoodStatus::Pending, FoodStatus::Reviewed]);
$canPublish = in_array($donation->status, [FoodStatus::Approved, FoodStatus::Collected, FoodStatus::Stored]);
@endphp

<a class="btn btn-ghost" href="{{ route('console.donations.index') }}" style="margin-bottom:14px">← Back to donations</a>

<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:22px;flex-wrap:wrap">
  <div>
    <h2 style="margin:0 0 6px">{{ $donation->title }}</h2>
    <div class="text-muted" style="font-size:14px">FD-{{ $donation->id }} · {{ $donation->category?->name }} · {{ $donation->quantity }}</div>
  </div>
  <div style="flex:1"></div>
  <span class="tag {{ ConsoleUi::tagClass($donation->status->value) }}" style="font-size:13px;padding:6px 14px">{{ $donation->status->getLabel() }}</span>
</div>

<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px" class="grid-2">
  <div style="display:flex;flex-direction:column;gap:16px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" class="grid-3">
      @php $images = collect($donation->images ?? [])->take(3); @endphp
      @foreach (range(0, 2) as $i)
        @if ($images->get($i))
          <img src="{{ Storage::url($images->get($i)) }}" alt="{{ $donation->title }}" style="aspect-ratio:1;width:100%;object-fit:cover">
        @else
          <div style="aspect-ratio:1;background:var(--color-neutral-{{ $i === 0 ? '300' : '200' }});display:grid;place-items:center;color:var(--color-neutral-{{ $i === 0 ? '600' : '500' }})">
            @include('console.partials.icon', ['name' => 'image'])
          </div>
        @endif
      @endforeach
    </div>

    <div class="panel">
      <h5 style="margin:0 0 10px">Description</h5>
      <p style="margin:0 0 18px;font-size:14px">{{ $donation->description ?: 'No description provided' }}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px">
        <div><div class="detail-label">Pickup address</div><div style="font-size:14px">{{ $donation->pickup_address ?: '—' }}</div></div>
        <div><div class="detail-label">Contact</div><div style="font-size:14px">{{ $donation->contact_number ?: '—' }}</div></div>
        <div><div class="detail-label">Prepared</div><div style="font-size:14px">{{ $donation->preparation_date?->format('d M Y') ?: '—' }}</div></div>
        <div><div class="detail-label">Expires</div><div style="font-size:14px">{{ $donation->expiry_date?->format('d M Y, g:i A') ?: '—' }}</div></div>
        <div><div class="detail-label">Special instructions</div><div style="font-size:14px">{{ $donation->special_instructions ?: '—' }}</div></div>
        <div><div class="detail-label">Warehouse</div><div style="font-size:14px">{{ $donation->warehouse?->name ?: 'Not assigned' }}</div></div>
      </div>
    </div>

    <div class="panel" style="display:flex;align-items:center;gap:14px">
      <div class="avatar-block" style="width:44px;height:44px">{{ ConsoleUi::initials($donation->donor?->name ?? '?') }}</div>
      <div style="flex:1">
        <div style="font-weight:600">{{ $donation->donor?->name }}</div>
        <div style="font-size:12px;color:var(--color-neutral-600)">Food donor · score {{ $donation->donor?->responsibility_score }}</div>
      </div>
      @if ($donation->contact_number)
        <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="tel:{{ $donation->contact_number }}">Contact donor</a>
      @endif
    </div>

    @if ($donation->admin_notes)
      <div class="panel">
        <h5 style="margin:0 0 10px">Admin notes</h5>
        <p style="margin:0;font-size:14px">{{ $donation->admin_notes }}</p>
      </div>
    @endif
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="panel">
      <h5 style="margin:0 0 16px">Lifecycle</h5>
      @foreach ($stepNames as $i => $step)
        <div class="step-row {{ $i <= $current ? 'done' : '' }} {{ $i < $current ? 'done-line' : '' }} {{ $i === $current ? 'current' : '' }}">
          <div class="step-rail">
            <div class="step-dot">{{ $i + 1 }}</div>
            @if (! $loop->last)
              <div class="step-line"></div>
            @endif
          </div>
          <div class="step-text">{{ $step->getLabel() }}</div>
        </div>
      @endforeach
    </div>

    <div class="panel">
      <h5 style="margin:0 0 14px">Admin actions</h5>

      @if ($canDecide)
        <form method="POST" action="{{ route('console.donations.approve', $donation) }}">
          @csrf
          <div class="field" style="margin-bottom:12px">
            <label>Assign warehouse</label>
            <select class="input" name="warehouse_id">
              <option value="">No warehouse</option>
              @foreach ($warehouses as $w)
                <option value="{{ $w->id }}" @selected($donation->warehouse_id === $w->id)>{{ $w->name }}</option>
              @endforeach
            </select>
          </div>
          <div class="field" style="margin-bottom:16px">
            <label>Assign points</label>
            <input class="input" type="number" name="points_required" min="0" value="{{ $donation->points_required ?: 100 }}">
          </div>
          <div style="display:flex;gap:8px">
            <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center">Approve</button>
            <button type="submit" form="rejectForm" class="btn btn-secondary btn-danger-outline" style="flex:1;justify-content:center">Reject</button>
          </div>
        </form>
        <form method="POST" action="{{ route('console.donations.reject', $donation) }}" id="rejectForm" style="margin-top:12px">
          @csrf
          <div class="field">
            <label>Rejection reason</label>
            <input class="input" name="admin_notes" placeholder="Optional">
          </div>
        </form>
      @elseif ($canPublish)
        <div style="display:flex;flex-direction:column;gap:8px">
          @if ($donation->status === FoodStatus::Approved)
            <form method="POST" action="{{ route('console.donations.status', $donation) }}">
              @csrf
              <input type="hidden" name="status" value="collected">
              <button type="submit" class="btn btn-secondary" style="width:100%;justify-content:center;border-color:var(--color-divider)">Mark collected</button>
            </form>
          @endif
          @if ($donation->status === FoodStatus::Collected)
            <form method="POST" action="{{ route('console.donations.status', $donation) }}">
              @csrf
              <input type="hidden" name="status" value="stored">
              <button type="submit" class="btn btn-secondary" style="width:100%;justify-content:center;border-color:var(--color-divider)">Mark stored</button>
            </form>
          @endif
          <form method="POST" action="{{ route('console.donations.publish', $donation) }}">
            @csrf
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Publish</button>
          </form>
        </div>
      @else
        <p class="text-muted" style="font-size:13px;margin:0">No actions available for this status</p>
      @endif
    </div>
  </div>
</div>
@endsection
