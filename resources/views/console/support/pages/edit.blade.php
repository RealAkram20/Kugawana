@extends('console.layout', ['title' => $title])

@section('content')
<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.support.pages.index') }}">&larr; Back to pages</a>
</div>

<div class="panel" style="max-width:760px">
  @include('console.support.pages._form', [
    'page' => $page,
    'action' => route('console.support.pages.update', $page),
    'submitLabel' => 'Save changes',
  ])
</div>
@endsection
