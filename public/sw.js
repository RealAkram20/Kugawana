self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', function (event) {
  var payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: 'Kugawana', body: event.data ? event.data.text() : '' }
  }

  var data = payload.data || {}
  var title = payload.title || 'Kugawana'

  var options = {
    body: payload.body || '',
    icon: payload.icon || '/Kugawana/images/notification-icon.png',
    badge: payload.badge,
    tag: payload.tag,
    renotify: !!payload.tag,
    data: data,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  var target = (event.notification.data && event.notification.data.url) || '/Kugawana/console'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.indexOf(target) !== -1 && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target)
      }
    })
  )
})
