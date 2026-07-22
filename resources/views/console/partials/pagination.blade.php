@if ($paginator->hasPages())
<nav style="display:flex;gap:8px;align-items:center">
  @if ($paginator->onFirstPage())
    <span class="btn btn-secondary" style="opacity:.45;border-color:var(--color-divider)">Previous</span>
  @else
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ $paginator->previousPageUrl() }}">Previous</a>
  @endif
  <span class="text-muted" style="font-size:13px">Page {{ $paginator->currentPage() }} of {{ $paginator->lastPage() }}</span>
  @if ($paginator->hasMorePages())
    <a class="btn btn-secondary" style="border-color:var(--color-divider)" href="{{ $paginator->nextPageUrl() }}">Next</a>
  @else
    <span class="btn btn-secondary" style="opacity:.45;border-color:var(--color-divider)">Next</span>
  @endif
</nav>
@endif
