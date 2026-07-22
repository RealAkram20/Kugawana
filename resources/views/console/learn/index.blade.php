@extends('console.layout', ['title' => $title])

@section('content')
@php use App\Support\ConsoleUi; @endphp
<div style="display:flex;justify-content:flex-end;margin-bottom:16px">
  <a class="btn btn-primary" href="{{ url('backoffice/admin/articles/create') }}">@include('console.partials.icon', ['name' => 'plus']) New article</a>
</div>
<div class="panel-table">
  <table class="table">
    <thead><tr><th>Title</th><th>Category</th><th>Published</th><th>Status</th><th></th></tr></thead>
    <tbody>
      @forelse ($articles as $a)
        <tr>
          <td style="font-weight:600">{{ $a->title }}</td>
          <td>{{ ucfirst($a->category) }}</td>
          <td style="color:var(--color-neutral-600)">{{ $a->is_published ? $a->updated_at->format('d M Y') : '—' }}</td>
          <td><span class="tag {{ ConsoleUi::tagClass($a->is_published ? 'Published' : 'Draft') }}">{{ $a->is_published ? 'Published' : 'Draft' }}</span></td>
          <td style="text-align:right"><a class="btn btn-ghost" href="{{ url('backoffice/admin/articles/' . $a->id . '/edit') }}">Edit</a></td>
        </tr>
      @empty
        <tr><td colspan="5" class="text-muted">No articles yet</td></tr>
      @endforelse
    </tbody>
  </table>
</div>
<div style="margin-top:16px">{{ $articles->links() }}</div>
@endsection
