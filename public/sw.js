// Service Worker v3 — limpieza agresiva al activar
const CACHE = 'suite-v3';

// Instalar: tomar control inmediatamente
self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

// Activar: eliminar TODOS los caches viejos y reclamar clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k)))) // eliminar TODO
      .then(() => clients.claim())
      .then(() => {
        // Recargar todas las tabs abiertas para que tomen la versión nueva
        return clients.matchAll({ type:'window' });
      })
      .then(clientList => {
        clientList.forEach(c => c.navigate(c.url));
      })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname !== self.location.hostname) return;

  // HTML — siempre red, nunca caché
  if (url.pathname === '/' || url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    e.respondWith(
      fetch(e.request, { cache:'no-store' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // TODOS los assets: Network First — evita servir chunks obsoletos
  // (cuando el proyecto esté estable cambiar /assets/ a Cache First)
  e.respondWith(
    fetch(e.request, { cache:'no-cache' })
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // fallback offline
  );
});

// Keep-alive ping cada 10 min
let keepAliveTimer = null;
self.addEventListener('message', e => {
  if (e.data?.type === 'KEEP_ALIVE_START') {
    if (!keepAliveTimer) keepAliveTimer = setInterval(()=>{
      fetch('/favicon.svg',{method:'HEAD',cache:'no-cache'}).catch(()=>{});
    }, 10*60*1000);
  }
  if (e.data?.type === 'KEEP_ALIVE_STOP') {
    clearInterval(keepAliveTimer); keepAliveTimer=null;
  }
});

// Push notifications
self.addEventListener('push', e => {
  const d = e.data?.json()||{title:'Mi Suite',body:'Tienes una notificación'};
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/favicon.svg',badge:'/favicon.svg',vibrate:[200,100,200]}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
