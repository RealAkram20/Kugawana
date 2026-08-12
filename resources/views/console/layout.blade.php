@php $branding = App\Models\BrandingSetting::current(); @endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ $title ?? 'Console' }} · Kugawana</title>
<link rel="icon" href="{{ $branding->faviconUrl() }}">
<link rel="stylesheet" href="{{ asset('css/console.css') }}">
</head>
<body>
@php
use App\Enums\UserRole;
use App\Support\ConsoleUi;

$user = auth()->user();
$isSuper = $user->role === UserRole::SuperAdmin;

// Unhandled problem reports, shown as a count next to the sidebar link.
$openReports = App\Models\SupportReport::where('status', App\Enums\SupportReportStatus::New)->count();

$navGroups = [
    ['label' => 'Overview', 'items' => [
        ['icon' => 'dashboard', 'label' => 'Dashboard', 'route' => 'console.dashboard', 'match' => 'console.dashboard'],
    ]],
    ['label' => 'Operations', 'items' => [
        ['icon' => 'donations', 'label' => 'Food donations', 'route' => 'console.donations.index', 'match' => 'console.donations.*'],
        ['icon' => 'orders', 'label' => 'Orders', 'route' => 'console.orders.index', 'match' => 'console.orders.*'],
        ['icon' => 'warehouse', 'label' => 'Warehouses', 'route' => 'console.warehouses.index', 'match' => 'console.warehouses.*'],
        ['icon' => 'wallet', 'label' => 'Points', 'route' => 'console.wallet.index', 'match' => 'console.wallet.*'],
    ]],
    ['label' => 'Catalog', 'items' => [
        ['icon' => 'categories', 'label' => 'Categories', 'route' => 'console.categories.index', 'match' => 'console.categories.*'],
        ['icon' => 'learn', 'label' => 'Learn', 'route' => 'console.learn.index', 'match' => 'console.learn.*'],
    ]],
    ['label' => 'Community', 'items' => [
        ['icon' => 'community', 'label' => 'Community', 'route' => 'console.community.index', 'match' => 'console.community.*'],
        ['icon' => 'users', 'label' => 'Members', 'route' => 'console.users.index', 'match' => 'console.users.*'],
    ]],
    ['label' => 'Growth', 'items' => [
        ['icon' => 'campaigns', 'label' => 'Reward campaigns', 'route' => 'console.campaigns.index', 'match' => 'console.campaigns.*'],
    ]],
    ['label' => 'Insights', 'items' => [
        ['icon' => 'reports', 'label' => 'Reports', 'route' => 'console.reports.index', 'match' => 'console.reports.*'],
    ]],
    ['label' => 'Support', 'items' => [
        ['icon' => 'faq', 'label' => 'FAQs', 'route' => 'console.support.faqs.index', 'match' => 'console.support.faqs.*'],
        ['icon' => 'policy', 'label' => 'Policy pages', 'route' => 'console.support.pages.index', 'match' => 'console.support.pages.*'],
        ['icon' => 'contact', 'label' => 'Contact details', 'route' => 'console.support.contact.edit', 'match' => 'console.support.contact.*'],
        ['icon' => 'flag', 'label' => 'Reported problems', 'route' => 'console.support.reports.index', 'match' => 'console.support.reports.*', 'badge' => $openReports],
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
      @if ($branding->logoUrl())
        <img src="{{ $branding->logoUrl() }}" alt="Kugawana" style="max-height:34px;max-width:100%;object-fit:contain">
      @else
        <div class="brand-mark">K</div>
        <div class="brand-name side-label">Kugawana</div>
      @endif
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
              @if (! empty($item['badge']))
                <span class="side-label nav-badge">{{ $item['badge'] }}</span>
              @endif
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
      <button type="button" class="btn btn-icon btn-secondary header-bell" id="pushBell" title="Turn on alerts">
        @include('console.partials.icon', ['name' => 'bell'])
        <span class="bell-dot" id="pushDot" style="display:none"></span>
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

<script>
(function () {
  const bell = document.getElementById('pushBell');
  const dot = document.getElementById('pushDot');
  if (!bell) return;

  const supported = 'serviceWorker' in navigator && 'PushManager' in window;
  const vapidKey = @json(config('webpush.vapid.public_key'));
  const subscribeUrl = @json(route('console.push.subscribe'));
  const csrf = @json(csrf_token());

  if (!supported || !vapidKey) {
    bell.style.display = 'none';
    return;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
  }

  function paint(on) {
    dot.style.display = 'block';
    dot.style.background = on ? '#16a34a' : 'var(--color-accent)';
    bell.title = on ? 'Alerts are on' : 'Turn on alerts';
  }

  async function ready() {
    const reg = await navigator.serviceWorker.register(@json(asset('sw.js')));
    await navigator.serviceWorker.ready;
    return reg;
  }

  async function enable() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { paint(false); return; }

    const reg = await ready();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
      body: JSON.stringify(sub.toJSON()),
    });
    paint(true);
  }

  bell.addEventListener('click', function () {
    if (Notification.permission === 'denied') {
      alert('Alerts are blocked for this site. Allow notifications in your browser settings, then try again.');
      return;
    }
    enable().catch(() => paint(false));
  });

  // Already granted permission on a past visit: re-subscribe on load so the
  // server always holds a current subscription without another bell click.
  (async function init() {
    if (Notification.permission === 'granted') {
      enable().catch(() => paint(false));
    } else {
      paint(false);
    }
  })();
})();
</script>

<script src="{{ asset('js/password-toggle.js') }}"></script>
</body>
</html>
