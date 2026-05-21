// Hook para manejar notificaciones push y recordatorios
export function useNotifications() {
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator
  const permission  = isSupported ? Notification.permission : 'denied'

  async function requestPermission() {
    if (!isSupported) return 'unsupported'
    const result = await Notification.requestPermission()
    console.log('[Notif] Permiso:', result)
    return result
  }

  async function sendLocal(title, body, opts = {}) {
    if (!isSupported || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [150, 50, 150],
      tag: opts.tag || 'suite-notif',
      requireInteraction: opts.sticky || false,
      data: opts.url || '/',
    })
  }

  // Programar recordatorio (usa setTimeout — solo funciona con app abierta)
  function scheduleReminder(title, body, delayMs) {
    if (!isSupported || Notification.permission !== 'granted') return null
    const t = setTimeout(() => sendLocal(title, body), delayMs)
    return t
  }

  // Exportar a calendario (.ics)
  function exportToCalendar({ title, date, notes, allDay = true }) {
    const dt = date.replace(/-/g, '')
    const now = new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MiSuitePersonal//ES',
      'BEGIN:VEVENT',
      `UID:${now}@misuite`,
      `DTSTAMP:${now}`,
      allDay ? `DTSTART;VALUE=DATE:${dt}` : `DTSTART:${dt}T090000`,
      allDay ? `DTEND;VALUE=DATE:${dt}`   : `DTEND:${dt}T100000`,
      `SUMMARY:${title}`,
      notes ? `DESCRIPTION:${notes}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g,'-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { isSupported, permission, requestPermission, sendLocal, scheduleReminder, exportToCalendar }
}
