@extends('console.layout', ['title' => $title])

@section('content')
@php
use App\Enums\PostStatus;
use App\Support\ConsoleUi;
@endphp
<div style="display:flex;flex-direction:column;gap:12px;max-width:820px">
  @forelse ($posts as $p)
    <div class="panel" style="padding:18px;border-left:3px solid {{ $p->status === PostStatus::Hidden ? 'var(--color-accent)' : 'var(--color-divider)' }}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div class="avatar-block" style="width:34px;height:34px;font-size:12px">{{ ConsoleUi::initials($p->user?->name ?? '?') }}</div>
        <div style="flex:1">
          <span style="font-weight:600">{{ $p->user?->name }}</span>
          <span class="text-muted" style="font-size:12px">· {{ $p->created_at->diffForHumans() }}</span>
        </div>
        <span class="tag {{ ConsoleUi::tagClass($p->status->value) }}">{{ $p->status->getLabel() }}</span>
      </div>
      <p style="margin:0 0 14px;font-size:14px">{{ $p->content }}</p>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="text-muted" style="font-size:12px;margin-right:auto">{{ $p->likes_count }} likes · {{ $p->comments_count }} comments</span>
        @if ($p->status === PostStatus::Hidden)
          <form method="POST" action="{{ route('console.community.keep', $p) }}">
            @csrf
            <button type="submit" class="btn btn-secondary" style="border-color:var(--color-divider)">Restore</button>
          </form>
        @else
          <form method="POST" action="{{ route('console.community.remove', $p) }}" onsubmit="return confirm('Remove this post from the community feed?')">
            @csrf
            <button type="submit" class="btn btn-secondary btn-danger-outline">Remove</button>
          </form>
        @endif
      </div>
    </div>
  @empty
    <div class="text-muted">No community posts yet</div>
  @endforelse
</div>
<div style="margin-top:16px">{{ $posts->links() }}</div>
@endsection
