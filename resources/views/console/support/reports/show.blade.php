@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Enums\SupportReportStatus; @endphp

<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.support.reports.index') }}">&larr; Back to reports</a>
</div>

<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px" class="grid-2">
  <div class="panel">
    <div class="card-kicker">Reported {{ $report->created_at->diffForHumans() }}</div>
    <h5 style="margin:4px 0 14px">{{ $report->subject }}</h5>

    <div style="white-space:pre-wrap;font-size:15px;line-height:1.6">{{ $report->message }}</div>

    <div style="border-top:2px solid var(--color-divider);margin-top:18px;padding-top:14px;font-size:13px" class="text-muted">
      From <strong style="color:var(--color-neutral-800)">{{ $report->user?->name ?? 'Deleted member' }}</strong>
      @if ($report->user?->email) · {{ $report->user->email }} @endif
      @if ($report->user?->phone) · {{ $report->user->phone }} @endif
    </div>
  </div>

  <div class="panel">
    <form method="POST" action="{{ route('console.support.reports.update', $report) }}">
      @csrf

      <div class="field" style="margin-bottom:12px">
        <label>Status</label>
        <select class="input" name="status" required>
          @foreach (SupportReportStatus::cases() as $case)
            <option value="{{ $case->value }}" @selected(old('status', $report->status->value) === $case->value)>{{ $case->getLabel() }}</option>
          @endforeach
        </select>
        @error('status')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>

      <div class="field" style="margin-bottom:12px">
        <label>Internal notes</label>
        <textarea class="input" name="admin_response" rows="7" placeholder="What was done about this?">{{ old('admin_response', $report->admin_response) }}</textarea>
        <p class="text-muted" style="font-size:12px;margin:6px 0 0">Only visible here — members do not see these notes.</p>
        @error('admin_response')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
      </div>

      @if ($report->resolved_at)
        <p class="text-muted" style="font-size:13px;margin:0 0 12px">
          Closed {{ $report->resolved_at->diffForHumans() }}@if ($report->handler) by {{ $report->handler->name }}@endif.
        </p>
      @endif

      <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">Save</button>
    </form>
  </div>
</div>
@endsection
