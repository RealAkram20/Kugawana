@php $published = old('is_published', $faq?->is_published ?? true); @endphp

<form method="POST" action="{{ $action }}">
  @csrf

  <div class="field" style="margin-bottom:12px">
    <label>Question</label>
    <input class="input" name="question" value="{{ old('question', $faq?->question) }}" placeholder="e.g. How do points work?" required>
    @error('question')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
  </div>

  <div class="field" style="margin-bottom:12px">
    <label>Answer</label>
    <textarea class="input" name="answer" rows="6" required placeholder="Plain text. Leave a blank line between paragraphs.">{{ old('answer', $faq?->answer) }}</textarea>
    <p class="text-muted" style="font-size:12px;margin:6px 0 0">Shown in the app exactly as typed. Leave a blank line between paragraphs.</p>
    @error('answer')<p class="error-text" style="margin:6px 0 0">{{ $message }}</p>@enderror
  </div>

  <div class="field" style="margin-bottom:12px;max-width:180px">
    <label>Position</label>
    <input class="input" type="number" name="sort_order" min="0" value="{{ old('sort_order', $faq?->sort_order) }}" placeholder="Auto">
    <p class="text-muted" style="font-size:12px;margin:6px 0 0">Lower shows first.</p>
  </div>

  <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px;cursor:pointer">
    <input type="checkbox" name="is_published" value="1" @checked($published)> Published
  </label>

  <button type="submit" class="btn btn-primary" style="min-width:160px;justify-content:center">{{ $submitLabel }}</button>
</form>
