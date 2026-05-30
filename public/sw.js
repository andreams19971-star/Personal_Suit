// Service Worker — Estrategia correcta por tipo de archivo
const CACHE = 'suite-assets-v2';  // Incrementar versión fuerza limpieza de caché

// Keep-alive: ping cada 10 minutos para que Render no se duerma
// Solo cuando hay una tab activa visible
let keepAliveTimer = null;
function startKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(() => {
    fetch('/favicon.svg', { method:'HEAD', cache:'no-cache' })
      .catch(()=>{}); // silencioso
  }, 10 * 60 * 1000); // cada 10 min
}
function stopKeepAlive() {
  if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer=null; }
}

// Escuchar mensajes de las tabs para activar/desactivar keep-alive
self.addEventListener('message', e => {
  if (e.data?.type === 'KEEP_ALIVE_START') startKeepAlive();
  if (e.data?.type === 'KEEP_ALIVE_STOP')  stopKeepAlive();
});

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
