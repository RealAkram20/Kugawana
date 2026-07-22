@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\OrderStatus;
use App\Support\ConsoleUi;
@endphp
<div class="panel-table">
  <table class="table">
    <thead><tr><th>Order</th><th>Receiver</th><th>Item</th><th>Points</th><th>Fulfilment</th><th>When</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($orders as $o)
        <tr>
          <td style="color:var(--color-neutral-600)">OR-{{ $o->id }}</td>
          <td style="font-weight:600">{{ $o->receiver?->name }}</td>
          <td>{{ $o->foodDonation?->title }}</td>
          <td>{{ $o->points_spent }}</td>
          <td>{{ ucfirst($o->delivery_method) }}</td>
          <td style="color:var(--color-neutral-600)">{{ $o->created_at->diffForHumans() }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($o->status->value) }}">{{ $o->status->getLabel() }}</span></td>
          <td style="text-align:right;white-space:nowrap">
            @if ($o->status === OrderStatus::Pending)
              <form method="POST" action="{{ route('console.orders.accept', $o) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Accept</button>
              </form>
            @endif
            @if ($o->status === OrderStatus::Accepted)
              <form method="POST" action="{{ route('console.orders.deliver', $o) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Mark delivered</button>
              </form>
            @endif
            @if (in_array($o->status, [OrderStatus::Pending, OrderStatus::Accepted]))
              <form method="POST" action="{{ route('console.orders.cancel', $o) }}" style="display:inline" onsubmit="return confirm('Cancel this order and refund points?')">
                @csrf
                <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Cancel</button>
              </form>
            @endif
          </td>
        </tr>
      @empty
        <tr><td colspan="8" class="text-muted">No orders yet</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
<div style="margin-top:16px">{{ $orders->links() }}</div>
@endsection
