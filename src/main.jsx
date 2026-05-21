import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ─── Service Worker (PWA + Notificaciones) ────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registrado:', reg.scope))
      .catch(err => console.warn('[SW] Error:', err))
  })
}

// ─── Bloquear zoom con gestos en iOS ─────────────────────────────────────────
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false })
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false })
document.addEventListener('gestureend', e => e.preventDefault(), { passive: false })

// Bloquear zoom con doble tap
let lastTap = 0
document.addEventListener('touchend', e => {
  const now = Date.now()
  if (now - lastTap < 300) e.preventDefault()
  lastTap = now
}, { passive: false })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
