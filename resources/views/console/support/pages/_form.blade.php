@php $published = old('is_published', $page?->is_published ?? true); @endphp

<form method="POST" action="{{ $action }}">
  @csrf

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="field">
      <label>Title</label>
      <input class="input" name="title" value="{{ old('title', $page?->title) }}" placeholder="e.g. Terms of use" required>
      @error('title')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>
    <div class="field">
      <label>Link name</label>
      <input class="input" name="slug" value="{{ old('slug', $page?->slug) }}" placeholder="Auto from title">
      @error('slug')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
    </div>
  </div>
  <p class="text-muted" style="font-size:12px;margin:-4px 0 12px">The link name is how the app finds this page. Changing it on a live page breaks any existing link to it.</p>

  <div class="field" style="margin-bottom:12px">
    <label>Content</label>
    <textarea class="input" name="body" rows="16" required placeholder="Plain text. Leave a blank line between paragraphs.">{{ old('body', $page?->body) }}</textarea>
    <p class="text-muted" style="font-size:12px;margin:6px 0 0">Plain text only — the app has no rich-text renderer, so formatting marks would reach members as stray characters. Leave a blank line between paragraphs.</p>
    @error('body')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
  </div>

  <div class="field" style="margin-bottom:12px;max-width:180px">
    <label>Position</label>
    <input class="input" type="number" name="sort_order" min="0" value="{{ old('sort_order', $page?->sort_order) }}" placeholder="Auto">
    <p class="text-muted" style="font-size:12px;margin:6px 0 0">Lower shows first.</p>
  </div>

  <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px;cursor:pointer">
    <input type="checkbox" name="is_published" value="1" @checked($published)> Published
  </label>

  <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $submitLabel }}</button>
</form>
