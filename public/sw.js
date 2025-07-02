// Service Worker para Push Notifications e Cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `numbly-${CACHE_VERSION}`;

// Arquivos para cache offline
const STATIC_ASSETS = [
  '/',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json',
  '/favicon.ico'
];

// Instalação: Cache dos assets estáticos
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Service Worker: Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('✅ Service Worker: Assets cacheados com sucesso');
      return self.skipWaiting();
    })
  );
});

// Ativação: Limpar caches antigos
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('numbly-') && name !== CACHE_NAME)
          .map(name => {
            console.log(`🗑️ Service Worker: Removendo cache antigo ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('✨ Service Worker: Ativo e controlando');
      return self.clients.claim();
    })
  );
});

// Interceptação de fetch: Cache first, network fallback
self.addEventListener('fetch', event => {
  // Ignorar requests não GET ou que não sejam para nosso domínio
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - retorna resposta do cache
      if (response) {
        return response;
      }

      // Cache miss - busca na rede
      return fetch(event.request).then(networkResponse => {
        // Não cachear erros
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cachear nova resposta
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// Push: Receber e mostrar notificações
self.addEventListener('push', event => {
  console.log('📬 Service Worker: Push recebido');
  
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova mensagem do Numbly!',
      icon: data.icon || '/icon-192x192.svg',
      badge: '/icon-96x96.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        actionUrl: data.actionUrl
      },
      actions: data.actions || [
        {
          action: 'open',
          title: 'Abrir'
        }
      ],
      tag: data.tag || 'numbly-notification', // Para não empilhar notificações
      renotify: true // Vibrar mesmo se já houver notificação
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Numbly',
        options
      ).then(() => {
        console.log('✅ Service Worker: Notificação mostrada');
      })
    );
  } catch (error) {
    console.error('❌ Service Worker: Erro ao processar push', error);
  }
});

// Click em notificação
self.addEventListener('notificationclick', event => {
  console.log('👆 Service Worker: Clique em notificação');
  
  event.notification.close();

  // URL padrão ou específica da notificação
  const url = event.notification.data?.url || '/';
  const actionUrl = event.notification.data?.actionUrl;

  // Se clicou em uma action específica
  if (event.action === 'action' && actionUrl) {
    event.waitUntil(
      self.clients.openWindow(actionUrl)
    );
    return;
  }

  // Comportamento padrão: abrir/focar janela existente
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      // Se já tem uma aba aberta, focar nela
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abrir nova aba
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
