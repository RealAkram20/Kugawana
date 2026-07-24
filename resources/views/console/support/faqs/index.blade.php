@extends('console.layout', ['title' => $title])

@section('content')

<details class="panel" style="margin-bottom:16px" @if ($errors->any()) open @endif>
  <summary style="cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px">
    @include('console.partials.icon', ['name' => 'plus'])
    New question
    <span class="text-muted" style="font-weight:400;font-size:13px">— appears under Help &amp; Support in the app</span>
  </summary>
  <div style="margin-top:16px;max-width:640px">
    @include('console.support.faqs._form', [
      'faq' => null,
      'action' => route('console.support.faqs.store'),
      'submitLabel' => 'Add question',
    ])
  </div>
</details>

<div class="panel-table">
  <table class="table">
    <thead>
      <tr><th style="width:60px">#</th><th>Question</th><th style="width:130px">Status</th><th style="width:220px"></th></tr>
    </thead>
    <tbody>
      @forelse ($faqs as $faq)
        <tr>
          <td class="text-muted">{{ $faq->sort_order }}</td>
          <td>
            <div style="font-weight:600">{{ $faq->question }}</div>
            <div class="text-muted" style="font-size:13px;margin-top:2px">{{ Str::limit(strip_tags($faq->answer), 110) }}</div>
          </td>
          <td>
            <form method="POST" action="{{ route('console.support.faqs.toggle', $faq) }}">
              @csrf
              <button type="submit" class="toggle-pill {{ $faq->is_published ? 'on' : '' }}">{{ $faq->is_published ? 'Published' : 'Hidden' }}</button>
            </form>
          </td>
          <td style="text-align:right">
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.support.faqs.edit', $faq) }}">Edit</a>
              <form method="POST" action="{{ route('console.support.faqs.destroy', $faq) }}" onsubmit="return confirm('Delete this question?')">
                @csrf
                <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Delete</button>
              </form>
            </div>
          </td>
        </tr>
      @empty
        <tr><td colspan="4" class="text-muted">No questions yet — add the first one above.</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
