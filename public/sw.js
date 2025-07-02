// 🚀 Numbly Life - Service Worker Avançado com Push Notifications
const CACHE_NAME = 'numbly-life-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/profile',
  '/friends',
  '/chat',
  '/about',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// 📦 Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🎯 Cache aberto, adicionando recursos...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 🔄 Ativação do Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🌐 Interceptar requisições
self.addEventListener('fetch', event => {
  // Estratégia: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta é válida, cache e retorne
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tente buscar no cache
        return caches.match(event.request);
      })
  );
});

// ✨ PUSH NOTIFICATIONS - Coração da Autenticação
self.addEventListener('push', event => {
  console.log('🔔 Push recebido:', event);
  
  let pushData = {};
  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (error) {
      pushData = { title: 'Numbly Life', body: event.data.text() };
    }
  }

  const options = {
    title: pushData.title || '🔮 Numbly Life',
    body: pushData.body || 'Nova mensagem do oráculo',
    icon: '/icon-192x192.svg',
    badge: '/icon-96x96.svg',
    image: pushData.image,
    data: pushData,
    requireInteraction: pushData.requireInteraction || false,
    actions: pushData.actions || [],
    tag: pushData.tag || 'numbly-notification',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    sound: '/sounds/mystical-chime.mp3'
  };

  // Diferentes tipos de notificação
  switch (pushData.type) {
    case 'AUTH_LOGIN':
      options.title = '🔐 Confirmação de Login';
      options.body = `Olá ${pushData.userName}! Confirme sua entrada no Numbly Life.`;
      options.requireInteraction = true;
      options.actions = [
        { action: 'confirm', title: '✅ Confirmar Login' },
        { action: 'deny', title: '❌ Negar Acesso' }
      ];
      break;
      
    case 'AUTH_RECOVERY':
      options.title = '🔑 Recuperação de Acesso';
      options.body = 'Toque aqui para recuperar o acesso à sua conta.';
      options.requireInteraction = true;
      options.actions = [
        { action: 'recover', title: '🚪 Acessar Conta' }
      ];
      break;
      
    case 'DAILY_ORACLE':
      options.title = '🌟 Mensagem Diária do Oráculo';
      options.body = pushData.body || 'Sua orientação numerológica do dia chegou!';
      options.actions = [
        { action: 'read', title: '📖 Ler Mensagem' }
      ];
      break;

    case 'COMPATIBILITY':
      options.title = '💫 Nova Análise de Compatibilidade';
      options.body = `${pushData.friendName} aceitou seu convite! Veja a compatibilidade.`;
      options.actions = [
        { action: 'view', title: '👀 Ver Resultado' }
      ];
      break;
      
    default:
      break;
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// 👆 Clique na notificação
self.addEventListener('notificationclick', event => {
  console.log('📱 Notificação clicada:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  let urlToOpen = '/dashboard';

  // Ações específicas baseadas no tipo
  if (event.action) {
    switch (event.action) {
      case 'confirm':
        urlToOpen = `/auth/confirm?token=${notificationData.authToken}`;
        break;
      case 'deny':
        urlToOpen = `/auth/deny?token=${notificationData.authToken}`;
        break;
      case 'recover':
        urlToOpen = `/auth/recover?token=${notificationData.recoveryToken}`;
        break;
      case 'read':
        urlToOpen = '/blog';
        break;
      case 'view':
        urlToOpen = '/friends';
        break;
      default:
        urlToOpen = notificationData.url || '/dashboard';
    }
  } else {
    // Clique direto na notificação
    switch (notificationData.type) {
      case 'AUTH_LOGIN':
        urlToOpen = `/auth/confirm?token=${notificationData.authToken}`;
        break;
      case 'AUTH_RECOVERY':
        urlToOpen = `/auth/recover?token=${notificationData.recoveryToken}`;
        break;
      case 'DAILY_ORACLE':
        urlToOpen = '/blog';
        break;
      case 'COMPATIBILITY':
        urlToOpen = '/friends';
        break;
      default:
        urlToOpen = notificationData.url || '/dashboard';
    }
  }

  // Abrir ou focar na janela/tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Procurar por uma janela já aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }
        
        // Se não encontrou, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 🔕 Fechar notificação
self.addEventListener('notificationclose', event => {
  console.log('❌ Notificação fechada:', event.notification.data);
  
  // Analytics opcional
  if (event.notification.data && event.notification.data.trackingId) {
    fetch('/api/analytics/notification-close', {
      method: 'POST',
      body: JSON.stringify({
        trackingId: event.notification.data.trackingId,
        timestamp: Date.now()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => console.log('Analytics error:', err));
  }
});

// 🎯 Mensagem do cliente
self.addEventListener('message', event => {
  console.log('💬 Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Numbly Life Service Worker carregado e pronto!');
