// Service Worker para Donna AI PWA com Push Notifications
const CACHE_NAME = 'donna-ai-v1';
const urlsToCache = [
  '/',
  '/checkout',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna cache se disponível, senão busca da rede
        return response || fetch(event.request);
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'Nova mensagem da Donna AI!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
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
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Donna AI';
    options.icon = data.icon || options.icon;
    options.tag = data.tag || 'donna-notification';
    options.requireInteraction = data.requireInteraction || false;
  }

  event.waitUntil(
    self.registration.showNotification('Donna AI', options)
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

// Cart Recovery System
let cartRecoveryTimeouts = new Map();
let cartRecoveryMessages = [
  {
    delay: 5 * 60 * 1000, // 5 minutos
    title: '🛒 Esqueceu algo?',
    body: 'Você estava quase finalizando sua compra da Donna AI. Que tal terminar agora?',
    tag: 'cart-recovery-1'
  },
  {
    delay: 30 * 60 * 1000, // 30 minutos
    title: '💔 Sentimos sua falta!',
    body: 'A Donna AI está esperando por você. Finalize sua compra e transforme seu negócio hoje!',
    tag: 'cart-recovery-2'
  },
  {
    delay: 2 * 60 * 60 * 1000, // 2 horas
    title: '🔥 Oferta especial!',
    body: 'Últimas horas para garantir a Donna AI com desconto especial. Não perca!',
    tag: 'cart-recovery-3'
  },
  {
    delay: 24 * 60 * 60 * 1000, // 24 horas
    title: '⏰ Última chance!',
    body: 'Sua oportunidade de ter a Donna AI está acabando. Finalize agora!',
    tag: 'cart-recovery-4'
  },
  {
    delay: 3 * 24 * 60 * 60 * 1000, // 3 dias
    title: '🎯 Volte e ganhe!',
    body: 'Que tal uma nova chance? A Donna AI pode revolucionar suas vendas ainda hoje!',
    tag: 'cart-recovery-5'
  }
];

// Receber mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_CART_RECOVERY') {
    const userId = event.data.userId || 'default-user';
    startCartRecovery(userId);
  } else if (event.data && event.data.type === 'STOP_CART_RECOVERY') {
    const userId = event.data.userId || 'default-user';
    stopCartRecovery(userId);
  } else if (event.data && event.data.type === 'SEND_FUN_NOTIFICATION') {
    sendFunNotification();
  }
});

function startCartRecovery(userId) {
  // Limpar timeouts existentes
  stopCartRecovery(userId);
  
  const timeouts = [];
  
  cartRecoveryMessages.forEach((message, index) => {
    const timeout = setTimeout(() => {
      self.registration.showNotification(message.title, {
        body: message.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: message.tag,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'checkout',
            title: 'Finalizar Compra',
            icon: '/icons/cart-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Agora não',
            icon: '/icons/close-icon.png'
          }
        ],
        data: {
          type: 'cart-recovery',
          userId: userId,
          step: index + 1
        }
      });
    }, message.delay);
    
    timeouts.push(timeout);
  });
  
  cartRecoveryTimeouts.set(userId, timeouts);
}

function stopCartRecovery(userId) {
  const timeouts = cartRecoveryTimeouts.get(userId);
  if (timeouts) {
    timeouts.forEach(timeout => clearTimeout(timeout));
    cartRecoveryTimeouts.delete(userId);
  }
}

function sendFunNotification() {
  const funMessages = [
    {
      title: '🎉 Bem-vindo à era da IA!',
      body: 'A Donna AI está aqui para revolucionar suas vendas. Prepare-se para o futuro!'
    },
    {
      title: '🚀 Decolando com a Donna!',
      body: 'Suas vendas estão prestes a alçar voo. A Donna AI é sua copiloto perfeita!'
    },
    {
      title: '💎 Você descobriu um tesouro!',
      body: 'A Donna AI é a joia que faltava no seu negócio. Brilhe com ela!'
    },
    {
      title: '🎯 Mira certeira!',
      body: 'Com a Donna AI, cada lead é uma oportunidade de ouro. Não erre o alvo!'
    },
    {
      title: '🔮 O futuro chegou!',
      body: 'Vendas automatizadas, clientes satisfeitos, lucros crescentes. A Donna AI faz tudo isso!'
    }
  ];
  
  const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
  
  self.registration.showNotification(randomMessage.title, {
    body: randomMessage.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'fun-notification',
    vibrate: [100, 50, 100, 50, 100],
    actions: [
      {
        action: 'explore',
        title: 'Explorar Donna AI',
        icon: '/icons/chat-icon.png'
      },
      {
        action: 'close',
        title: 'Legal!',
        icon: '/icons/close-icon.png'
      }
    ],
    data: {
      type: 'fun-notification'
    }
  });
}
