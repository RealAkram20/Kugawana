@extends('console.layout', ['title' => $title])

@section('content')

<details class="panel" style="margin-bottom:16px" @if ($errors->any()) open @endif>
  <summary style="cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px">
    @include('console.partials.icon', ['name' => 'plus'])
    New page
    <span class="text-muted" style="font-weight:400;font-size:13px">— terms, privacy, community rules, anything members should be able to read</span>
  </summary>
  <div style="margin-top:16px;max-width:760px">
    @include('console.support.pages._form', [
      'page' => null,
      'action' => route('console.support.pages.store'),
      'submitLabel' => 'Create page',
    ])
  </div>
</details>

<div class="panel-table">
  <table class="table">
    <thead>
      <tr><th style="width:60px">#</th><th>Page</th><th style="width:150px">Link name</th><th style="width:130px">Status</th><th style="width:220px"></th></tr>
    </thead>
    <tbody>
      @forelse ($pages as $page)
        <tr>
          <td class="text-muted">{{ $page->sort_order }}</td>
          <td>
            <div style="font-weight:600">{{ $page->title }}</div>
            <div class="text-muted" style="font-size:13px;margin-top:2px">Updated {{ $page->updated_at->diffForHumans() }}</div>
          </td>
          <td><span class="tag tag-neutral">{{ $page->slug }}</span></td>
          <td>
            <form method="POST" action="{{ route('console.support.pages.toggle', $page) }}">
              @csrf
              <button type="submit" class="toggle-pill {{ $page->is_published ? 'on' : '' }}">{{ $page->is_published ? 'Published' : 'Hidden' }}</button>
            </form>
          </td>
          <td style="text-align:right">
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.support.pages.edit', $page) }}">Edit</a>
              <form method="POST" action="{{ route('console.support.pages.destroy', $page) }}" onsubmit="return confirm('Delete this page? Members will no longer be able to open it.')">
                @csrf
                <button type="submit" class="btn btn-ghost" style="color:var(--color-accent-700)">Delete</button>
              </form>
            </div>
          </td>
        </tr>
      @empty
        <tr><td colspan="5" class="text-muted">No pages yet — add the first one above.</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
@endsection
