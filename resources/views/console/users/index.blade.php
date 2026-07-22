@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp
<div class="panel-table">
  <table class="table">
    <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>District</th><th>Responsibility</th><th>Points</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($users as $u)
        @php
          $status = ! $u->is_active ? 'Suspended' : ($u->responsibility_score < 50 ? 'Flagged' : 'Active');
          $scoreColor = $u->responsibility_score < 50 ? 'var(--color-accent-700)' : ($u->responsibility_score < 70 ? 'var(--color-neutral-700)' : 'var(--color-text)');
        @endphp
        <tr>
          <td style="font-weight:600">{{ $u->name }}</td>
          <td>{{ $u->role->getLabel() }}</td>
          <td style="color:var(--color-neutral-600)">{{ $u->phone ?: '—' }}</td>
          <td>{{ $u->district ?: '—' }}</td>
          <td><span style="color:{{ $scoreColor }};font-weight:600">{{ $u->responsibility_score }}</span></td>
          <td>{{ number_format($u->wallet_balance) }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($status) }}">{{ $status }}</span></td>
          <td style="text-align:right">
            <form method="POST" action="{{ route('console.users.toggle', $u) }}" style="display:inline">
              @csrf
              <button type="submit" class="btn btn-ghost" @if($u->is_active) style="color:var(--color-accent-700)" @endif>
                {{ $u->is_active ? 'Suspend' : 'Activate' }}
              </button>
            </form>
          </td>
        </tr>
      @empty
        <tr><td colspan="8" class="text-muted">No users yet</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
<div style="margin-top:16px">{{ $users->links() }}</div>
@endsection
