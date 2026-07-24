@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\OrderStatus;
use App\Support\ConsoleUi;
@endphp

@forelse ($groups as $g)
  <div class="panel" style="margin-bottom:14px">
    <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-weight:700;font-size:15px">{{ $g['receiver']?->name }}</span>
          @if ($g['is_basket'])
            <span class="tag tag-accent" style="font-size:11px">Basket · {{ $g['count'] }} items</span>
          @endif
        </div>
        <div class="text-muted" style="font-size:13px;margin-top:4px">
          {{ $g['reference'] }} · {{ $g['total_points'] }} pts · {{ ucfirst($g['delivery_method']) }} · {{ $g['created_at']->diffForHumans() }}
        </div>
      </div>
      <span class="tag {{ ConsoleUi::tagClass($g['status_value']) }}" style="align-self:center">{{ $g['status_label'] }}</span>
    </div>

    @if ($g['is_basket'])
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        @if ($g['can_accept'])
          <form method="POST" action="{{ route('console.orders.group.accept', $g['group_id']) }}">
            @csrf
            <button type="submit" class="btn btn-primary">Approve all</button>
          </form>
        @endif
        @if ($g['can_deliver'])
          <form method="POST" action="{{ route('console.orders.group.deliver', $g['group_id']) }}">
            @csrf
            <button type="submit" class="btn btn-secondary" style="border-color:var(--color-divider)">Mark all delivered</button>
          </form>
        @endif
        @if ($g['can_cancel'])
          <form method="POST" action="{{ route('console.orders.group.cancel', $g['group_id']) }}" onsubmit="return confirm('Cancel the whole basket and refund points?')">
            @csrf
            <button type="submit" class="btn btn-secondary btn-danger-outline">Cancel all</button>
          </form>
        @endif
      </div>
    @endif

    <div style="margin-top:14px">
      @foreach ($g['orders'] as $o)
        @php $food = $o->foodDonation; @endphp
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--color-divider)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">{{ $food?->title ?? 'Removed food' }}</div>
            <div class="text-muted" style="font-size:12px;margin-top:2px">
              {{ $o->units }} × {{ $food && $food->isSplit() ? $food->unit_quantity : $food?->quantity }} · {{ $o->points_spent }} pts
            </div>
          </div>
          <span class="tag {{ ConsoleUi::tagClass($o->status->value) }}" style="font-size:11px">{{ $o->status->getLabel() }}</span>
          <div style="white-space:nowrap;text-align:right;min-width:120px">
            @if ($o->status === OrderStatus::Pending)
              <form method="POST" action="{{ route('console.orders.accept', $o) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Accept</button>
              </form>
            @endif
            @if ($o->status === OrderStatus::Accepted)
              <form method="POST" action="{{ route('console.orders.deliver', $o) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Deliver</button>
              </form>
            @endif
            @if (in_array($o->status, [OrderStatus::Pending, OrderStatus::Accepted]))
              <form method="POST" action="{{ route('console.orders.cancel', $o) }}" style="display:inline" onsubmit="return confirm('Cancel this item and refund its points?')">
                @csrf
                <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Cancel</button>
              </form>
            @endif
          </div>
        </div>
      @endforeach
    </div>
  </div>
@empty
  <div class="panel"><p class="text-muted" style="margin:0">No orders yet</p></div>
@endforelse

<div style="margin-top:16px">{{ $groups->links() }}</div>
@endsection
