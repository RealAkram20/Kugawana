@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp

<form method="POST" action="{{ route('console.users.grant-bulk') }}" id="bulkGrant">
  @csrf
  <div class="panel" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px">
    <div>
      <h5 style="margin:0 0 2px">Gift points</h5>
      <p class="text-muted" style="margin:0;font-size:13px">Tick members, then reward them all at once.</p>
    </div>
    <div style="flex:1"></div>
    <div class="field" style="margin:0">
      <label>Points</label>
      <input class="input" type="number" name="points" min="1" placeholder="e.g. 100" style="width:120px">
    </div>
    <div class="field" style="margin:0;min-width:180px">
      <label>Reason</label>
      <input class="input" name="reason" value="reward" placeholder="Why">
    </div>
    <button type="submit" class="btn btn-primary" onclick="return confirmBulk()">Grant to selected</button>
    <span class="text-muted" id="selCount" style="font-size:13px;align-self:center">0 selected</span>
  </div>

  <div class="panel-table">
    <table class="table">
      <thead><tr>
        <th style="width:28px"><input type="checkbox" id="selAll"></th>
        <th>Name</th><th>Member</th><th>Phone</th><th>Activity</th><th>Points</th><th>Responsibility</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        @forelse ($users as $u)
          @php
            $status = ! $u->is_active ? 'Suspended' : ($u->responsibility_score < 50 ? 'Flagged' : 'Active');
            $scoreColor = $u->responsibility_score < 50 ? 'var(--color-accent-700)' : ($u->responsibility_score < 70 ? 'var(--color-neutral-700)' : 'var(--color-text)');
          @endphp
          <tr>
            <td><input type="checkbox" class="rowChk" name="user_ids[]" value="{{ $u->id }}"></td>
            <td style="font-weight:600"><a href="{{ route('console.users.show', $u) }}" style="color:inherit">{{ $u->name }}</a></td>
            <td><span class="tag tag-neutral">Member</span></td>
            <td style="color:var(--color-neutral-600)">{{ $u->phone ?: '—' }}</td>
            <td style="color:var(--color-neutral-600)">{{ $u->donations_count }} shared · {{ $u->orders_count }} requests</td>
            <td style="font-weight:600">{{ number_format($u->wallet_balance) }}</td>
            <td><span style="color:{{ $scoreColor }};font-weight:600">{{ $u->responsibility_score }}</span></td>
            <td><span class="tag {{ ConsoleUi::tagClass($status) }}">{{ $status }}</span></td>
            <td style="text-align:right"><a class="btn btn-ghost" href="{{ route('console.users.show', $u) }}">View</a></td>
          </tr>
        @empty
          <tr><td colspan="9" class="text-muted">No members yet</td></tr>
        @endforelse
      </tbody>
    </table>
  </div>
</form>

<div style="margin-top:16px">{{ $users->links() }}</div>

<script>
(function () {
  const all = document.getElementById('selAll');
  const count = document.getElementById('selCount');
  const rows = () => Array.from(document.querySelectorAll('.rowChk'));
  const update = () => { count.textContent = rows().filter((c) => c.checked).length + ' selected'; };
  all && all.addEventListener('change', () => { rows().forEach((c) => { c.checked = all.checked; }); update(); });
  document.addEventListener('change', (e) => { if (e.target.classList.contains('rowChk')) update(); });
})();
function confirmBulk() {
  const n = document.querySelectorAll('.rowChk:checked').length;
  const points = document.querySelector('#bulkGrant [name=points]').value;
  if (!n) { alert('Tick at least one member first.'); return false; }
  if (!points || Number(points) < 1) { alert('Enter how many points to grant.'); return false; }
  return confirm('Grant ' + points + ' points to ' + n + ' member(s)?');
}
</script>
@endsection
