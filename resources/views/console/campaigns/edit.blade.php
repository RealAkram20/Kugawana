@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.campaigns.index') }}" style="margin-bottom:14px">← Back to campaigns</a>

<h2 style="margin:0 0 18px">Edit {{ $campaign->name }}</h2>

<div class="panel" style="max-width:640px">
  @include('console.campaigns._form', [
    'campaign' => $campaign,
    'action' => route('console.campaigns.update', $campaign),
    'submitLabel' => 'Save changes',
  ])
</div>
@endsection
