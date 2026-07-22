@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp
<div style="display:flex;justify-content:flex-end;margin-bottom:16px">
  <a class="btn btn-primary" href="{{ url('backoffice/super-admin/country-admins/create') }}">@include('console.partials.icon', ['name' => 'plus']) Invite admin</a>
</div>
<div class="panel-table">
  <table class="table">
    <thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($admins as $a)
        @php $status = $a->is_active ? 'Approved' : 'Pending'; @endphp
        <tr>
          <td style="font-weight:600">{{ $a->name }}</td>
          <td style="color:var(--color-neutral-600)">{{ $a->email }}</td>
          <td>{{ $a->country?->name ?: '—' }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($status) }}">{{ $status }}</span></td>
          <td style="text-align:right">
            @if (! $a->is_active)
              <form method="POST" action="{{ route('console.admins.approve', $a) }}" style="display:inline">
                @csrf
                <button type="submit" class="btn btn-ghost">Approve</button>
              </form>
            @else
              <a class="btn btn-ghost" href="{{ url('backoffice/super-admin/country-admins/' . $a->id . '/edit') }}">Manage</a>
            @endif
          </td>
        </tr>
      @empty
        <tr><td colspan="5" class="text-muted">No country admins yet</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
