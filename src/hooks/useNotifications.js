// useNotifications.js — Notificaciones push reales via Web Push API + SW

const VAPID_KEY_STORAGE = "suite_vapid_sub";

// Convierte base64url a Uint8Array (para VAPID public key)
function b64ToUint8(base64) {
  const str = atob(base64.replace(/-/g,"+").replace(/_/g,"/"));
  const arr = new Uint8Array(str.length);
  for (let i=0; i<str.length; i++) arr[i]=str.charCodeAt(i);
  return arr;
}

// Pedir permiso de notificaciones
export async function requestPermission() {
  if (typeof Notification === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch { return "denied"; }
}

// Mostrar notificación local (sin servidor, instantánea)
export function showLocalNotification(title, body, options={}) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon:  "/favicon.svg",
        badge: "/favicon.svg",
        vibrate: [200, 100, 200],
        ...options
      });
    }).catch(()=>{});
  } else {
    try { new Notification(title, { body, icon:"/favicon.svg", ...options }); } catch {}
  }
}

// Revisar y disparar notificaciones automáticas
export function checkFinanzAlerts({ loans=[], cards=[] }) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  loans.forEach(loan => {
    if (loan.status !== "active") return;
    // Notificar si el préstamo tiene más de 30 días sin abono
    const lastPayment = loan.payments?.[loan.payments.length-1];
    const lastDate = lastPayment?.date || loan.date;
    const daysSince = Math.floor((today - new Date(lastDate)) / 86400000);
    if (daysSince >= 30 && daysSince < 31) {
      showLocalNotification(
        "💰 Préstamo pendiente",
        loan.debtor + " lleva " + daysSince + " días sin abonar. Saldo: $" + loan.balance.toLocaleString("es-CO"),
        { tag: "loan-"+loan.id }
      );
    }
  });

  cards.forEach(card => {
    if (!card.payDay || !card.balance) return;
    // Notificar 2 días antes del día de pago
    const payDay = parseInt(card.payDay);
    const todayDay = today.getDate();
    if (todayDay === payDay - 2 || todayDay === payDay - 1) {
      showLocalNotification(
        "💳 Pago de tarjeta próximo",
        card.name + " — Pago el día " + payDay + ". Saldo: $" + card.balance.toLocaleString("es-CO"),
        { tag: "card-"+card.id }
      );
    }
  });
}

// Suscribirse a push del servidor (requiere VAPID key en env)
export async function subscribePush() {
  const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!VAPID_PUBLIC) {
    console.warn("[Push] VITE_VAPID_PUBLIC_KEY no configurada");
    return null;
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const perm = await requestPermission();
  if (perm !== "granted") return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(VAPID_PUBLIC),
      });
    }
    console.log("[Push] Suscripción activa:", sub.endpoint.slice(-20));
    return sub;
  } catch(e) {
    console.error("[Push] Error:", e.message);
    return null;
  }
}
