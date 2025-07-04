// Service Worker para Push Notifications e Cache - Updated 2025-01-04T15:00:00 - FORCE UPDATE
const CACHE_VERSION = 'v3';
const CACHE_NAME = `numbly-${CACHE_VERSION}`;

// Arquivos para cache offline
const STATIC_ASSETS = [
  '/',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json'
  // '/favicon.ico' removido pois não existe
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
      // Forçar update imediato
      return self.skipWaiting();
    })
  );
});

// Ativação: Limpar caches antigos
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all([
        // Remove caches antigos
        ...cacheNames
          .filter(name => name.startsWith('numbly-') && name !== CACHE_NAME)
          .map(name => {
            console.log(`🗑️ Service Worker: Removendo cache antigo ${name}`);
            return caches.delete(name);
          }),
        // Força o controle imediato
        self.clients.claim()
      ]);
    }).then(() => {
      console.log('✨ Service Worker: Ativo e controlando');
    })
  );
});

// Interceptação de fetch: Apenas para assets estáticos em desenvolvimento
self.addEventListener('fetch', event => {
  // Ignorar requests não GET ou que não sejam para nosso domínio
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Em desenvolvimento, não interceptar APIs e páginas para evitar cache de development
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('.js') ||
      url.pathname.includes('.css') ||
      url.pathname.includes('hot-reload')) {
    return;
  }

  // Apenas cachear assets estáticos (imagens, ícones, manifest)
  if (!url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/) && 
      !url.pathname.includes('manifest.json')) {
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

        // Cachear apenas assets estáticos
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
    
    // Se há JWT no payload, comunica com todos os clientes ativos
    if (data.jwt) {
      console.log('🔑 Service Worker: JWT recebido, enviando para clientes...');
      // Enviar JWT para todos os clientes conectados
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'AUTH_JWT_LOGIN',
            jwt: data.jwt
          });
        });
      });
    }
    
    const options = {
      body: data.body || 'Nova mensagem do Numbly!',
      icon: data.icon || '/icon-192x192.svg',
      badge: '/icon-96x96.svg',
      vibrate: [100, 50, 100],
      data: {
        url: '/dashboard', // Sempre vai para dashboard
        jwt: data.jwt // Inclui JWT nos dados da notificação
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

  const notificationData = event.notification.data;
  const jwt = notificationData?.jwt;

  // Se há JWT, armazena para autenticação automática
  if (jwt) {
    console.log('🔑 Service Worker: JWT encontrado no clique, preparando autenticação...');
    // Armazena JWT temporariamente para uso da app
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'AUTH_JWT_LOGIN',
          jwt: jwt
        });
      });
    });
  }

  // Comportamento padrão: abrir/focar janela existente
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      const targetUrl = '/dashboard';
      
      // Se já tem uma aba aberta para o dashboard, focar nela
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não, abrir nova aba no dashboard
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
