// Service Worker — Network First + Auto-update
const CACHE_NAME = 'mi-suite-v2';

// Al instalar: skipWaiting inmediato para tomar control
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Al activar: borrar caches viejos y tomar control de todas las tabs
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Estrategia: Network First — siempre intenta la red primero
// Solo usa caché si la red falla (modo offline)
self.addEventListener('fetch', e => {
  // Solo interceptar GET
  if (e.request.method !== 'GET') return;
  // No interceptar peticiones a Supabase o APIs externas
  const url = new URL(e.request.url);
  if (url.hostname !== self.location.hostname) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Guardar copia en caché para offline
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: servir desde caché
        return caches.match(e.request);
      })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Mi Suite', body: 'Tienes una notificación' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: '/favicon.svg', badge: '/favicon.svg',
      vibrate: [200, 100, 200], data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
