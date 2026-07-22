<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ $title ?? 'Console' }} · Kugawana</title>
<link rel="stylesheet" href="{{ asset('css/console.css') }}">
</head>
<body>
@php
use App\Enums\UserRole;
use App\Support\ConsoleUi;

$user = auth()->user();
$isSuper = $user->role === UserRole::SuperAdmin;

$navGroups = [
    ['label' => 'Overview', 'items' => [
        ['icon' => 'dashboard', 'label' => 'Dashboard', 'route' => 'console.dashboard', 'match' => 'console.dashboard'],
    ]],
    ['label' => 'Operations', 'items' => [
        ['icon' => 'donations', 'label' => 'Food donations', 'route' => 'console.donations.index', 'match' => 'console.donations.*'],
        ['icon' => 'orders', 'label' => 'Orders', 'route' => 'console.orders.index', 'match' => 'console.orders.*'],
        ['icon' => 'wallet', 'label' => 'Wallet requests', 'route' => 'console.wallet.index', 'match' => 'console.wallet.*'],
    ]],
    ['label' => 'Catalog', 'items' => [
        ['icon' => 'categories', 'label' => 'Categories', 'route' => 'console.categories.index', 'match' => 'console.categories.*'],
        ['icon' => 'learn', 'label' => 'Learn', 'route' => 'console.learn.index', 'match' => 'console.learn.*'],
    ]],
    ['label' => 'Community', 'items' => [
        ['icon' => 'community', 'label' => 'Community', 'route' => 'console.community.index', 'match' => 'console.community.*'],
        ['icon' => 'users', 'label' => 'Users', 'route' => 'console.users.index', 'match' => 'console.users.*'],
    ]],
    ['label' => 'Growth', 'items' => [
        ['icon' => 'campaigns', 'label' => 'Reward campaigns', 'route' => 'console.campaigns.index', 'match' => 'console.campaigns.*'],
    ]],
    ['label' => 'Insights', 'items' => [
        ['icon' => 'reports', 'label' => 'Reports', 'route' => 'console.reports.index', 'match' => 'console.reports.*'],
    ]],
];

if ($isSuper) {
    $navGroups[] = ['label' => 'Platform', 'items' => [
        ['icon' => 'countries', 'label' => 'Countries', 'route' => 'console.countries.index', 'match' => 'console.countries.*'],
        ['icon' => 'admins', 'label' => 'Admins', 'route' => 'console.admins.index', 'match' => 'console.admins.*'],
        ['icon' => 'settings', 'label' => 'Settings', 'route' => 'console.settings.index', 'match' => 'console.settings.*'],
    ]];
}

$countryTag = $user->country ? $user->country->code . ' · ' . $user->country->name : 'Global';
@endphp

<div class="console-shell" id="shell">
  <aside class="console-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">K</div>
      <div class="brand-name side-label">Kugawana</div>
    </div>
    <nav class="sidebar-nav">
      @foreach ($navGroups as $group)
        <div class="nav-group">
          <div class="nav-group-label side-label">{{ $group['label'] }}</div>
          @foreach ($group['items'] as $item)
            <a href="{{ route($item['route']) }}" title="{{ $item['label'] }}"
               class="nav-item {{ request()->routeIs($item['match']) ? 'active' : '' }}">
              @include('console.partials.icon', ['name' => $item['icon']])
              <span class="side-label">{{ $item['label'] }}</span>
            </a>
          @endforeach
        </div>
      @endforeach
    </nav>
    <div class="sidebar-foot">
      <form method="POST" action="{{ route('console.logout') }}">
        @csrf
        <button type="submit" class="nav-item" title="Sign out">
          @include('console.partials.icon', ['name' => 'logout'])
          <span class="side-label">Sign out</span>
        </button>
      </form>
    </div>
  </aside>

  <div class="console-content">
    <header class="console-header">
      <button type="button" class="btn btn-icon btn-secondary" id="sidebarToggle" style="border-color:var(--color-divider)">
        @include('console.partials.icon', ['name' => 'menu'])
      </button>
      <h4>{{ $title ?? '' }}</h4>
      <div style="flex:1"></div>
      <form method="GET" action="{{ route('console.donations.index') }}" class="header-search">
        <div class="search-icon">@include('console.partials.icon', ['name' => 'search'])</div>
        <input class="input" name="q" placeholder="Search" value="{{ request('q') }}">
      </form>
      <span class="tag tag-neutral">{{ $countryTag }}</span>
      <button type="button" class="btn btn-icon btn-secondary header-bell">
        @include('console.partials.icon', ['name' => 'bell'])
        <span class="bell-dot"></span>
      </button>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="header-avatar">{{ ConsoleUi::initials($user->name) }}</div>
        <div class="side-label" style="line-height:1.2">
          <div style="font-size:13px;font-weight:600">{{ $user->name }}</div>
          <div style="font-size:11px;color:var(--color-neutral-500)">{{ $user->role->getLabel() }}</div>
        </div>
      </div>
    </header>

    <main class="console-main">
      @yield('content')
    </main>
  </div>
</div>

@if (session('toast'))
  <div class="toast" id="toast">{{ session('toast') }}</div>
@endif

<script>
const shell = document.getElementById('shell');
if (localStorage.getItem('consoleCollapsed') === '1') shell.classList.add('collapsed');
document.getElementById('sidebarToggle').addEventListener('click', () => {
  shell.classList.toggle('collapsed');
  localStorage.setItem('consoleCollapsed', shell.classList.contains('collapsed') ? '1' : '0');
});
const toast = document.getElementById('toast');
if (toast) setTimeout(() => toast.remove(), 2400);
</script>
</body>
</html>
