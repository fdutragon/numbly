// Service Worker para Donna AI PWA com Push Notifications
// (Cache removido: apenas push notification)

// Instalar Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// NÃO intercepta fetch nem faz cache

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {}
  const title = data.title || 'Notificação';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon.svg',
    tag: data.tag || undefined,
    requireInteraction: data.requireInteraction || false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
