// Service Worker — Estrategia correcta por tipo de archivo
const CACHE = 'suite-assets-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 1. Supabase y APIs externas → siempre red, nunca cachear
  if (url.hostname !== self.location.hostname) return;

  // 2. HTML (index.html, rutas SPA) → SIEMPRE red primero, nunca servir caché
  //    Si la red falla, devolver offline page básica en lugar de HTML stale
  if (url.pathname === '/' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .catch(() => caches.match('/') || new Response('Sin conexión', { status: 503 }))
    );
    return;
  }

  // 3. Assets con hash (/assets/index-XXXXXXXX.js) → Cache First
  //    Estos son inmutables: si el hash cambia, el nombre del archivo cambia
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. Otros archivos estáticos (favicon, manifest, sw) → Network First
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Mi Suite', body: 'Tienes una notificación' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: '/favicon.svg', badge: '/favicon.svg',
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
