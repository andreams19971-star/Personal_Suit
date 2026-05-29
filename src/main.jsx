import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'

// ─── Service Worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[SW] Registrado');

      // Cuando hay una nueva versión instalada → recargar automáticamente
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            console.log('[SW] Nueva versión activa → recargando');
            window.location.reload();
          }
        });
      });
    }).catch(err => console.warn('[SW] Error:', err));

    // Si el SW toma control (primera activación), recargar para usar nueva versión
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller cambió → recargando');
      window.location.reload();
    });
  });
}

// ─── Bloquear zoom iOS ────────────────────────────────────────────────────────
document.addEventListener('gesturestart',  e => e.preventDefault(), { passive: false })
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false })
document.addEventListener('gestureend',    e => e.preventDefault(), { passive: false })

let lastTap = 0
document.addEventListener('touchend', e => {
  const now = Date.now()
  if (now - lastTap < 300) e.preventDefault()
  lastTap = now
}, { passive: false })

// ─── Fix altura iOS Safari ────────────────────────────────────────────────────
// iOS Safari cambia el viewport cuando aparece/desaparece la barra del navegador
function fixIOSHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', (vh)+'px')
}
fixIOSHeight()
window.addEventListener('resize', fixIOSHeight)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
