// Service Worker v4 — Estrategia estable para PWA
// HTML: Network First con timeout → sirve caché si la red es lenta
// Assets con hash: Cache First → inmutables por diseño de Vite
// Si hay nueva versión: reload suave al volver a foreground

// CACHE se versiona automáticamente en cada build via Vite
const CACHE = typeof __BUILD_STAMP__ !== 'undefined' ? 'suite-' + __BUILD_STAMP__ : 'suite-v4';
const ASSET_TIMEOUT_MS = 5000; // si la red no responde en 5s, servir del caché

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
      // NO hay clients.navigate() — evita reloads inesperados
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname !== self.location.hostname) return;

  // ── HTML / Rutas SPA ─────────────────────────────────────────
  // Network First con timeout de 5s → sirve del caché si la red está lenta
  if (url.pathname === '/' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    e.respondWith(
      Promise.race([
        fetch(e.request, { cache: 'no-store' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ASSET_TIMEOUT_MS))
      ])
        .then(res => {
          // Guardar el HTML fresco en caché
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
          return res;
        })
        .catch(() => {
          // Red lenta o sin conexión → servir del caché
          return caches.match(e.request) || new Response('Sin conexión', { status: 503 });
        })
    );
    return;
  }

  // ── Assets con hash (/assets/index-ABC123.js) ────────────────
  // Cache First: el hash garantiza que el contenido nunca cambia
  // Si el hash cambia → nuevo archivo → cache miss → se descarga fresco
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached; // siempre fresco por diseño del hash
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Otros archivos estáticos ─────────────────────────────────
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Keep-alive para evitar cold starts en Render Free
let keepAliveTimer = null;
self.addEventListener('message', e => {
  if (e.data?.type === 'KEEP_ALIVE_START') {
    if (keepAliveTimer) return;
    keepAliveTimer = setInterval(() => {
      fetch('/favicon.svg', { method: 'HEAD', cache: 'no-cache' }).catch(() => {});
    }, 10 * 60 * 1000);
  }
  if (e.data?.type === 'KEEP_ALIVE_STOP') {
    clearInterval(keepAliveTimer); keepAliveTimer = null;
  }
});

// Push notifications
self.addEventListener('push', e => {
  const d = e.data?.json() || { title: 'Mi Suite', body: 'Tienes una notificación' };
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: '/favicon.svg', badge: '/favicon.svg', vibrate: [200, 100, 200]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
