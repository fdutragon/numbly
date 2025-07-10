// Service Worker para Donna AI PWA com Push Notifications
const CACHE_NAME = 'donna-ai-v1';
const urlsToCache = [
  '/',
  '/checkout',
  '/manifest.json',
  '/icons/icon.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Só cachear GET, não /api, não ws/wss, não POST/PUT/DELETE
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.protocol.startsWith('ws') ||
    url.pathname.endsWith('.map') // ignora source maps
  ) {
    return; // não intercepta
  }
  event.respondWith(
    caches.match(request)
      .then((response) => response || fetch(request))
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {}

  const title = data.title || 'Donna AI';
  const options = {
    body: data.body || 'Nova mensagem da Donna AI!',
    icon: data.icon || '/icons/icon.svg',
    badge: data.badge || '/icons/icon.svg',
    vibrate: data.vibrate || [100, 50, 100],
    tag: data.tag || 'donna-notification',
    requireInteraction: !!data.requireInteraction,
    actions: data.actions || [
      {
        action: 'explore',
        title: 'Ver Mensagem',
        icon: '/icons/chat-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close-icon.png'
      }
    ],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Não fazer nada, apenas fechar
  } else {
    // Clique na notificação principal
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Mensagens do cliente (apenas debug/comando simples)
self.addEventListener('message', (event) => {
  // Exemplo: logar mensagem recebida
  // console.log('SW recebeu mensagem:', event.data);
});
