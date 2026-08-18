@extends('console.layout', ['title' => $title])

@section('content')
<a class="btn btn-ghost" href="{{ route('console.wallet.index') }}" style="margin-bottom:14px">← Back to points</a>

<h2 style="margin:0 0 18px">Edit {{ $package->name }}</h2>

<div class="panel" style="max-width:560px">
  @include('console.wallet._package-form', [
    'package' => $package,
    'action' => route('console.wallet.packages.update', $package),
    'submitLabel' => 'Save changes',
  ])
</div>
@endsection
