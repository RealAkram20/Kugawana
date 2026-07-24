@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp

<details class="panel" style="margin-bottom:16px" @if ($errors->any()) open @endif>
  <summary style="cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px">
    @include('console.partials.icon', ['name' => 'plus'])
    New campaign
    <span class="text-muted" style="font-weight:400;font-size:13px">— reward members automatically on sign up or donation</span>
  </summary>
  <div style="margin-top:16px;max-width:640px">
    @include('console.campaigns._form', [
      'campaign' => null,
      'action' => route('console.campaigns.store'),
      'submitLabel' => 'Create campaign',
    ])
  </div>
</details>

<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px" class="grid-2">
  @forelse ($campaigns as $c)
    <div class="panel">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
        <div style="flex:1">
          <div class="card-kicker">{{ ['signup' => 'Sign up reward', 'donation' => 'Donation reward', 'manual' => 'Manual grant'][$c->type] ?? ucfirst($c->type) }}</div>
          <div style="font-family:var(--font-heading);font-weight:800;font-size:19px;margin-top:2px">{{ $c->name }}</div>
        </div>
        <span class="tag {{ ConsoleUi::tagClass($c->display_status) }}">{{ $c->display_status }}</span>
      </div>

      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
        <span style="font-family:var(--font-heading);font-weight:800;font-size:22px;color:var(--color-accent)">{{ number_format($c->points) }} points</span>
      </div>

      <div class="text-muted" style="font-size:13px;margin-bottom:14px">
        {{ $c->country?->name ?? 'All countries' }} ·
        @if ($c->starts_at && $c->ends_at)
          {{ $c->starts_at->format('d M') }} – {{ $c->ends_at->format('d M Y') }}
        @elseif ($c->ends_at)
          Ends {{ $c->ends_at->format('d M Y') }}
        @elseif ($c->starts_at)
          From {{ $c->starts_at->format('d M Y') }}
        @else
          Ongoing
        @endif
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.campaigns.edit', $c) }}">Edit</a>
        <form method="POST" action="{{ route('console.campaigns.toggle', $c) }}">
          @csrf
          <button type="submit" class="btn btn-ghost">{{ $c->is_active ? 'End' : 'Activate' }}</button>
        </form>
        <div style="flex:1"></div>
        <form method="POST" action="{{ route('console.campaigns.destroy', $c) }}" onsubmit="return confirm('Delete this campaign?')">
          @csrf
          <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Delete</button>
        </form>
      </div>
    </div>
  @empty
    <div class="text-muted">No campaigns yet</div>
  @endforelse
</div>
@endsection
