// Service Worker para Donna AI PWA com Push Notifications
// (Cache removido: apenas push notification)

console.log('🔧 Service Worker carregado');

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker instalando...');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  self.clients.claim();
});

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem recebida no SW:', event.data);
  
  if (event.data.type === 'SEND_FUN_NOTIFICATION') {
    const { title = '🎉 Demonstração Donna AI', body = 'Esta é uma notificação local enviada pelo Service Worker!' } = event.data.data || {};
    
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      tag: 'local-demo',
      requireInteraction: false
    });
  }
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
