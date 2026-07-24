@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\SupportReportStatus;
use App\Support\ConsoleUi;

$tabs = collect(SupportReportStatus::cases())
    ->map(fn ($case) => ['value' => $case->value, 'label' => $case->getLabel(), 'count' => $counts[$case->value] ?? 0])
    ->prepend(['value' => '', 'label' => 'All', 'count' => $counts->sum()]);
@endphp

<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
  @foreach ($tabs as $tab)
    <a href="{{ route('console.support.reports.index', $tab['value'] ? ['status' => $tab['value']] : []) }}"
       class="btn {{ $status === $tab['value'] ? 'btn-primary' : 'btn-secondary' }}"
       style="{{ $status === $tab['value'] ? '' : 'border-color:var(--color-divider)' }}">
      {{ $tab['label'] }} ({{ $tab['count'] }})
    </a>
  @endforeach
</div>

<div class="panel-table">
  <table class="table">
    <thead>
      <tr><th>Problem</th><th style="width:170px">From</th><th style="width:130px">Status</th><th style="width:150px">Assigned</th><th style="width:140px">Submitted</th><th style="width:110px"></th></tr>
    </thead>
    <tbody>
      @forelse ($reports as $report)
        <tr>
          <td>
            <div style="font-weight:600">{{ $report->subject }}</div>
            <div class="text-muted" style="font-size:13px;margin-top:2px">{{ Str::limit($report->message, 110) }}</div>
          </td>
          <td>{{ $report->user?->name ?? 'Deleted member' }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($report->status->getLabel()) }}">{{ $report->status->getLabel() }}</span></td>
          <td class="text-muted">{{ $report->handler?->name ?? '—' }}</td>
          <td class="text-muted">{{ $report->created_at->diffForHumans() }}</td>
          <td style="text-align:right">
            <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.support.reports.show', $report) }}">Open</a>
          </td>
        </tr>
      @empty
        <tr><td colspan="6" class="text-muted">Nothing reported here.</td></tr>
      @endforelse
    </tbody>
  </table>
</div>

@if ($reports->hasPages())
  <div style="margin-top:16px">{{ $reports->links() }}</div>
@endif
@endsection
