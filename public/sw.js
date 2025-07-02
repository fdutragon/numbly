// sw.js - Service Worker básico para PWA
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Você pode customizar o comportamento de cache aqui
  // Exemplo: event.respondWith(fetch(event.request));
});
