@extends('console.layout', ['title' => $title])

@section('content')
<div style="margin-bottom:16px">
  <a class="btn btn-ghost" href="{{ route('console.support.faqs.index') }}">&larr; Back to FAQs</a>
</div>

<div class="panel" style="max-width:640px">
  @include('console.support.faqs._form', [
    'faq' => $faq,
    'action' => route('console.support.faqs.update', $faq),
    'submitLabel' => 'Save changes',
  ])
</div>
@endsection
