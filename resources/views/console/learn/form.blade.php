@extends('console.layout', ['title' => $title])

@section('content')
@php use Illuminate\Support\Facades\Storage; @endphp

<a class="btn btn-ghost" href="{{ route('console.learn.index') }}" style="margin-bottom:14px">← Back to articles</a>

<h2 style="margin:0 0 22px">{{ $title }}</h2>

@if ($errors->any())
  <div class="panel" style="margin-bottom:16px;border-left:3px solid var(--color-accent)">
    <div style="font-weight:600;margin-bottom:6px">Please fix the following</div>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--color-accent)">
      @foreach ($errors->all() as $error)
        <li>{{ $error }}</li>
      @endforeach
    </ul>
  </div>
@endif

<form method="POST"
      action="{{ $article->exists ? route('console.learn.update', $article) : route('console.learn.store') }}"
      enctype="multipart/form-data"
      style="max-width:840px">
  @csrf

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 16px">Article</h5>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-bottom:12px" class="grid-2">
      <div class="field">
        <label>Title</label>
        <input class="input" name="title" value="{{ old('title', $article->title) }}" required>
      </div>
      <div class="field">
        <label>Category</label>
        <select class="input" name="category" required>
          @foreach ($categories as $value => $label)
            <option value="{{ $value }}" @selected(old('category', $article->category) === $value)>{{ $label }}</option>
          @endforeach
        </select>
      </div>
    </div>

    <div class="field" style="margin-bottom:12px">
      <label>Content</label>
      <textarea class="input" name="content" rows="14" required
                placeholder="The article body. Simple HTML like &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt; and &lt;b&gt; is kept.">{{ old('content', $article->content) }}</textarea>
    </div>

    <label style="display:inline-flex;align-items:center;gap:7px;font-size:14px;cursor:pointer">
      <input type="checkbox" name="is_published" value="1" @checked(old('is_published', $article->is_published))>
      Published — visible in the app's Learn tab
    </label>
  </div>

  <div class="panel" style="margin-bottom:16px">
    <h5 style="margin:0 0 6px">Cover image</h5>
    <p class="text-muted" style="font-size:13px;margin:0 0 14px">Shown at the top of the article and on its card. JPG, PNG or WebP up to 5 MB.</p>

    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      @if ($article->cover_image)
        <img src="{{ Storage::url($article->cover_image) }}" alt="Current cover" style="width:160px;height:90px;object-fit:cover;border:1px solid var(--color-divider)">
      @endif
      <div class="field" style="flex:1;min-width:220px">
        <label>{{ $article->cover_image ? 'Replace image' : 'Upload image' }}</label>
        <input class="input" type="file" name="cover_image" accept="image/*">
      </div>
    </div>
  </div>

  <div style="display:flex;gap:10px">
    <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $article->exists ? 'Save changes' : 'Create article' }}</button>
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ route('console.learn.index') }}">Cancel</a>
  </div>
</form>
@endsection
