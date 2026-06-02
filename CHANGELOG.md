# Mi Suite Personal — Changelog

> **URL:** https://personal-suit.onrender.com  
> **GitHub:** andreams19971-star/Personal_Suit  
> **Supabase:** cpzwvavhbhspjuntlkyz.supabase.co  
> **Stack:** React 18 + Vite 5 + Supabase + Render

---

## [2.6.0] — 2026-05-30 — Aplicar todas las sugerencias del análisis

### ✅ SW Network First
- Todos los assets ahora usan **Network First** mientras el proyecto esté en desarrollo activo
- Previene el problema de chunks obsoletos en caché
- Fallback offline sigue funcionando
- Nota: cambiar `/assets/` a Cache First cuando el proyecto esté estable

### ✅ onlineRef no bloquea silenciosamente
- Eliminados todos los `if (!onlineRef.current) return` silenciosos en los 5 hooks
- Ahora intenta el insert de todas formas y retorna el error real de Supabase
- El usuario recibe feedback concreto en lugar de un ✓ falso

### ✅ SETUP.sql único (186 líneas)
- Un solo archivo `SETUP.sql` reemplaza los 8 SQLs dispersos de versiones anteriores
- Cubre: columnas nuevas, UUIDs, profiles, triggers, RLS, RPC admin, marcar admin
- Seguro de re-ejecutar (IF NOT EXISTS + EXCEPTION handlers)

### ✅ Validaciones antes de insert
- `addTask`: valida título no vacío antes del optimistic update
- `addReservation`: valida huésped, fechas, y que salida > entrada
- `addTransaction`: valida monto > 0 y cuenta seleccionada

### ❌ Dividir FinanzApp.jsx — pospuesto
La extracción automática requiere resolver ~50 dependencias cruzadas entre componentes.
Se hará en una sesión dedicada con testing manual. Catalogado para próxima sesión.

### Archivos modificados
- `public/sw.js`
- `src/hooks/useFinanzData.js`, `useFlotaData.js`, `usePlannerData.js`,
  `useApartamentoData.js`, `useCardsData.js`
- `src/apps/FinanzApp.jsx`
- `src/hooks/useApartamentoData.js`
- `src/hooks/usePlannerData.js`
- `SETUP.sql` (nuevo, reemplaza todos los SQL anteriores)

---

## [2.5.1] — 2026-05-30 — Bugfix: SW cacheaba chunks obsoletos

### Problema
El SW tenía cacheado `FinanzApp-B9y9GJIo.js` (hash anterior). Al hacer un nuevo deploy,
Vite genera un nuevo hash para ese chunk pero el SW seguía sirviendo el viejo.
El viejo archivo ya no existe en el servidor → `Failed to fetch dynamically imported module` → 404.

### Causa raíz
El SW usaba `Cache-First` para `/assets/` pero al activar solo eliminaba caches con
nombre diferente al actual. Si el cache `suite-assets-v2` contenía chunks obsoletos,
seguían ahí indefinidamente.

### Solución
- **CACHE='suite-v3'** — nombre nuevo fuerza limpieza al activar
- **Activate limpia TODOS los caches** sin excepción (antes filtraba por nombre)
- **`clients.navigate(c.url)`** — recarga todas las tabs al activar el nuevo SW,
  eliminando cualquier referencia a chunks obsoletos
- **HTML con `cache:'no-store'`** — más agresivo que `no-cache`, garantiza
  que el HTML nunca quede en el caché del browser

### Archivos
- `public/sw.js` — versión v3, limpieza total

---

## [2.5.0] — 2026-05-30 — Fix: loadProfile con timeout propio + caché inmediato

### Causa raíz del timeout
`loadProfile` no tenía timeout propio — dependía del timeout global de 7s de `useAuth`.
Si Supabase tardaba en refrescar el JWT (token refresh al abrir la app), la query
de `profiles` se colgaba indefinidamente. El timeout de 7s forzaba `loading=false`
pero `profile` quedaba `null` → pantalla de "Cargando perfil...".

### Solución
1. **AbortController en la query** — la query de `profiles` se aborta a los 5s
   si Supabase no responde. Previene que el hook quede colgado.
2. **Caché inmediato al inicio** — si hay perfil en caché (`suite_profile_cache`),
   se setea al perfil ANTES de hacer la query. Las apps aparecen de inmediato
   mientras la consulta a Supabase ocurre en background.
3. **Fallback en timeout/error** — si la query falla o se aborta, se usa el caché.

### SQL requerido
Ejecutar `fix-profiles-rls-v3.sql`:
- Elimina todas las policies existentes de profiles
- Crea policies limpias: SELECT para `authenticated` Y `anon`
- Corrige el perfil de admin

### Archivos
- `src/hooks/useAuth.js` — `loadProfile` con AbortController + caché inmediato

---

## [2.4.9] — 2026-05-30 — Bugfix: health check Supabase incorrecto

### Causa
El endpoint `HEAD /rest/v1/` de Supabase retorna 404 (ruta no existe).
`res.ok` era siempre `false` → indicador siempre "Sin conexión" aunque Supabase funcionara.

### Fix
Cambiar a `GET /auth/v1/health` — endpoint oficial de salud de Supabase,
retorna 200 si el servidor está activo. No requiere autenticación.
Condición: `res.status < 500` (acepta 200, 401, 403, etc. — indica servidor activo).

### Archivos
- `src/App.jsx` — checkDb() usa `/auth/v1/health`

---

## [2.4.8] — 2026-05-30 — Bugfix build: async faltante en agregarPagoDiario

### Error
`"await" can only be used inside an "async" function` en FlotaTracker.jsx:225
`agregarPagoDiario` era una arrow function sin `async` pero usaba `await` internamente.

### Fix
Cambiar `const agregarPagoDiario = (carroId...) =>` a `const agregarPagoDiario = async (carroId...) =>`

---

## [2.4.7] — 2026-05-30 — Bugfix global: inserts con ID inválido en todas las apps

### Auditoría completa
El mismo bug de v2.4.5 y v2.4.6 existía en 3 hooks adicionales — **8 inserts afectados**:

| Hook | Función | ID inválido |
|------|---------|-------------|
| usePlannerData | addTask | 'T'+Date.now() |
| usePlannerData | addHabit | 'H'+Date.now() |
| usePlannerData | addGoal | 'G'+Date.now() |
| usePlannerData | addNote | 'N'+Date.now() |
| useApartamentoData | addReservation | 'RES'+Date.now() |
| useApartamentoData | addExpense | 'E'+Date.now() |
| useCardsData | addCharge | 'ch-'+Date.now() |
| useCardsData | addCard | 'card-'+Date.now() |

### Solución aplicada (idéntica a v2.4.5/2.4.6)
- Omitir `id` en el insert → Supabase genera UUID automáticamente
- Rollback del estado local si el insert falla
- El state local se actualiza con el UUID real de Supabase tras el insert

### SQL requerido
Ejecutar `fix-all-tables-uuid.sql` — aplica `DEFAULT gen_random_uuid()::text`
y política `auth_all` a las 16 tablas de datos en un solo script.

### Archivos
- `src/hooks/usePlannerData.js`
- `src/hooks/useApartamentoData.js`
- `src/hooks/useCardsData.js`

---

## [2.4.6] — 2026-05-30 — Bugfix: FlotaTracker edición/guardado silenciosa

### Causa (misma raíz que v2.4.5)
- `addWorkDay` enviaba `id:'P'+Date.now()` — inválido para columna `uuid`
- `addExpense` enviaba `id:'E'+Date.now()` — mismo problema
- Registros solo en estado local → `updatePayment` hacía `WHERE id='P...'` sin match → 0 rows updated
- Errores silenciosos: UI mostraba ✓ aunque Supabase fallara

### Solución
- `addWorkDay` y `addExpense` omiten `id` → Supabase genera UUID
- Rollback automático si el insert falla
- `updatePayment` retorna `{data}` o `{error}` + revierte estado local en error
- FlotaTracker muestra toast rojo con mensaje real si falla

### Archivos
- `src/hooks/useFlotaData.js` — `addWorkDay`, `addExpense`, `updatePayment`
- `src/apps/FlotaTracker.jsx` — manejo de errores en handlers

### SQL requerido
El mismo `fix-transactions.sql` aplica para `car_payments` y `car_expenses`:
- Verificar tipo de columna `id`
- Asegurar `DEFAULT gen_random_uuid()::text`
- Asegurar política `auth_all` para `authenticated`

---

## [2.4.5] — 2026-05-30 — Bugfix: Movimientos no se guardaban en Supabase

### Causas identificadas (revisando CHANGELOG + código)

1. **ID inválido** — `addTransaction` enviaba `id: 'tx-1716xxx'` a Supabase.
   Si `transactions.id` es de tipo `uuid`, Supabase rechaza el insert con error de tipo.
   El error se logeaba en consola pero NO se mostraba al usuario → parecía guardado (estado
   local) pero desaparecía al recargar.

2. **Errores silenciosos** — La función retornaba `void` sin propagar el error.
   FinanzApp siempre mostraba "Movimiento registrado ✓" aunque Supabase fallara.

3. **onlineRef potencialmente false** — Si `loadAll()` falla por RLS u otro error,
   `onlineRef.current` queda en `false` y todos los inserts se omiten silenciosamente.

### Solución

- **`addTransaction` ahora omite el `id`** — Supabase genera el UUID con `gen_random_uuid()`.
  Tras el insert exitoso, el estado local se actualiza con el UUID real de Supabase.
- **Rollback en error** — si el insert falla, la transacción se elimina del estado local
  (no queda "fantasma" visible pero no guardada).
- **Retorna `{ data }` o `{ error }`** — FinanzApp puede mostrar toast de error real.
- **Toast de error** — cuando falla, muestra "Error al guardar: [motivo]" en rojo.

### SQL requerido
Ejecutar `fix-transactions.sql` para:
- Verificar tipo de columna `id` en transactions
- Asegurar `DEFAULT gen_random_uuid()::text`
- Crear política `auth_all` si no existe

### Archivos
- `src/hooks/useFinanzData.js` — `addTransaction` reescrito
- `src/apps/FinanzApp.jsx` — `addTransaction` y `addTransfer` manejan errores
- `fix-transactions.sql` — SQL para verificar/corregir la tabla

---

## [2.4.4] — 2026-05-30 — Bugfix: Sin conexión persistente

### Causa
El health check de Supabase usaba `profiles.select("count")` pero el rol `anon` no tiene
política SELECT en `profiles` (solo `authenticated`). La query siempre fallaba → "Sin conexión".

### Solución
- Health check ahora usa `HEAD /rest/v1/` de Supabase — no requiere permisos de tabla
- Auto-retry cada 5 segundos cuando falla (no solo en visibilitychange)
- Indicador actualizado: "Reconectando..." (con animación) mientras reintenta
- Nunca queda atascado en "Sin conexión" para siempre

### Archivos
- `src/App.jsx` — nueva lógica de checkDb() con fetch HEAD + retryTimer

---

## [2.4.3] — 2026-05-30 — Bugfix: useAuthProvider duplicado

### Corregido
- `useAuthProvider` declarado dos veces en `useAuth.js` (str_replace previo no eliminó la función vieja)
- Build fallaba con `Identifier 'useAuthProvider' has already been declared`

---

## [2.4.2] — 2026-05-30 — Bugfix: Reconexión automática al volver a la app

### Problema
Al dejar la app inactiva y volver, iOS Safari cierra la conexión WebSocket con Supabase.
El perfil quedaba `null`, la conexión mostraba "Sin conexión", y el usuario tenía que
borrar el caché para que volviera a funcionar.

### Solución
- **Caché de perfil en localStorage** (`suite_profile_cache`) — el perfil se guarda al
  cargarse. Al reiniciar, React se inicializa con el caché y las apps aparecen de inmediato
  sin pantalla de "Cargando perfil".
- **Auto-reconexión en visibilitychange** — `useAuth.js` escucha cuando la app vuelve
  a foreground y espera 800ms (para que la red se estabilice) antes de recargar el perfil.
- **Conexión auto-reintento** — `App.jsx` repite el check de conexión a Supabase cada vez
  que la app vuelve a primer plano (ya no queda en "Sin conexión" para siempre).
- Si `loadProfile` falla, usa el caché como fallback en lugar de mostrar `null`.

### Archivos modificados
- `src/hooks/useAuth.js` — `saveProfileCache`, `loadProfileCache`, estado inicial desde caché,
  fallback en errores, retry delay de 800ms en visibilitychange
- `src/App.jsx` — `checkDb()` extraída como función, listener visibilitychange

---

## [2.4.1] — 2026-05-30 — Bugfix: Editar/Eliminar en vista Cuentas

### Corregido
- **AccountsView** no recibía `deleteTransaction` ni `setEditTx` — las transacciones
  se mostraban pero sin handlers. `TxRow` renderizaba sin `onDelete`/`onEdit`.
- Solución: pasar las dos funciones desde el render principal y usarlas en el `TxRow` de AccountsView.

### Archivos modificados
- `src/apps/FinanzApp.jsx` — línea 246 (llamada) + línea 550 (firma) + línea 585 (TxRow)

---

## [2.4.0] — 2026-05-29 — Todas las recomendaciones

### Nuevo
- `src/theme.js` — Paleta `C`, `fmtCOP`, `fmtShort` centralizados para importar en cualquier app
- **Presupuestos mensuales** en Dashboard de FinanzApp — barra de progreso por categoría, alerta si se excede
- **Comparativo mes anterior** en Stats — cards ▲▼ con % e importe vs mes anterior
- **Modo oscuro por horario** en Settings — opción "Horario" con inputs hora inicio/fin, soporta rango que cruza medianoche
- **Recordatorios automáticos** en Planner — notifica tareas de hoy y de mañana al abrir la app
- **Estadísticas de productividad** en Planner TodayView — Total / Hechas / En curso / Vencidas + tasa de completado

### Mejorado
- `ErrorBoundary` por app — cada app lazy-loaded tiene su propio `<ErrorBoundary>`, crash de una no afecta las demás
- Exportar **xlsx real** con SheetJS — 2 hojas: Movimientos + Resumen por categoría (reemplaza CSV anterior)
- `package.json` — agregada dependencia `xlsx: ^0.18.5`

---

## [2.3.0] — 2026-05-29 — Performance y velocidad

### Nuevo
- **React.lazy + Suspense** — code splitting por app, bundle inicial cae de ~300KB a ~80KB
- **Vite manual chunks** — `vendor-react` y `vendor-supabase` separados, se cachean entre deploys
- **Keep-alive en SW** — ping HEAD a `/favicon.svg` cada 10 min para evitar cold starts en Render Free
- **Preconnect a Supabase** en `index.html` — DNS resuelto antes de que el JS lo solicite (~200ms ahorro)

### Archivos modificados
- `vite.config.js` — manualChunks: vendor-react, vendor-supabase
- `public/sw.js` — keep-alive via `message` listener + CACHE versión bumpeada a v2
- `src/main.jsx` — `sendKeepAlive()` en visibilitychange
- `index.html` — `<link rel="preconnect">` + `<link rel="dns-prefetch">` a Supabase
- `src/App.jsx` — React.lazy para las 4 apps + helper `wrap()` con Suspense

---

## [2.2.0] — 2026-05-29 — Bugfix masivo + Admin funcional

### Corregido
- **Admin no podía editar apps de usuarios** — RLS UPDATE solo permitía self-edit. Solución: función RPC `admin_update_profile` con `security definer` que bypasea RLS pero verifica is_admin internamente
- **App se queda cargando (React error #310)** — `Promise.race` con `throw Error` interrumpía el ciclo de React. Simplificado a try/catch normal en `useAuth.js`
- **`lbl is not defined`** en FlotaTracker — constante de estilo definida solo en ApartamentoApp. Agregada a nivel de módulo en FlotaTracker
- **`btnStyle` declarado dos veces** en ApartamentoApp — duplicado por script Python. Eliminado
- **`lbl`/`inp` con colores hardcodeados** — actualizados a paleta `C` en Planner, FlotaTracker, ApartamentoApp
- **404 en assets tras deploy** — SW cacheaba HTML con hashes viejos. Nuevo SW: HTML siempre red, `/assets/*.js` Cache First, otros Network First
- **Ctrl+Shift+R necesario** — reemplazado con `skipWaiting()` + auto-reload al activar nuevo SW

### SQL requerido
- `fix-admin-update.sql` — función RPC `admin_update_profile` con security definer

---

## [2.1.0] — 2026-05-29 — Auth robusta + Sesión persistente

### Nuevo
- **Remember Me** en AuthScreen — checkbox guarda email en `localStorage.suite_email`
- **Visibilitychange listener** en `useAuth.js` — recarga perfil al volver a la app
- **Timeout 7s** en `useAuth.js` — evita pantalla de carga infinita si Supabase tarda
- **Estado "Cargando perfil"** en launcher — si profile es null pero user existe, muestra spinner con botón Reintentar
- **`detectSessionInUrl: false`** en supabase.js — evita conflictos en PWA

### SQL requerido
- `fix-profiles-final.sql` — policies SELECT `using(true)`, UPDATE `using(auth.uid()=id)` sin subquery (evita timeout)
- JWT expiry: cambiar a 604800 en Supabase → Authentication → Settings

---

## [2.0.0] — 2026-05-29 — Sistema de autenticación completo

### Nuevo
- **AuthScreen.jsx** — Login/registro con email+contraseña, modo login/register, Remember Me
- **AdminPanel.jsx** — Panel admin con toggle de apps por usuario, toggle is_admin, selector de color avatar
- **LockScreen.jsx** — Face ID / Touch ID via WebAuthn (`navigator.credentials.create/get`)
- **useBiometric.js** — `registerBiometric()`, `authenticateBiometric()`, `hasBiometricRegistered()`
- **useAuth.js** — `useAuthProvider()` hook con onAuthStateChange, timeout, mounted flag
- **ErrorBoundary.jsx** — Captura crashes globales, muestra pantalla amigable con "Recargar" / "Reintentar"
- **Settings** en launcher — toggle biométrica, tema, tamaño letra, perfil, cerrar sesión
- Badge "Admin" en launcher para usuario admin
- Botón 👥 solo visible para admin → abre AdminPanel

### Supabase
- Tabla `profiles` con trigger `on_auth_user_created`
- RLS: SELECT `using(true)`, UPDATE `using(auth.uid()=id)`, INSERT `with check(auth.uid()=id)`
- RPC `admin_update_profile` con security definer
- `auth_all` policies en todas las tablas de datos

### SQL requerido
```sql
-- Ejecutar en orden:
-- 1. supabase-auth.sql — tabla profiles + trigger
-- 2. fix-all-rls.sql — auth_all en todas las tablas
-- 3. fix-admin-update.sql — RPC admin
-- 4. Marcar admin:
UPDATE profiles SET is_admin=true, name='Andre',
  allowed_apps=array['finanz','planner','flota','apartamento']
WHERE email='andreams1997@gmail.com';
```

---

## [1.5.0] — 2026-05-28 — Mejoras FinanzApp + Bugfixes críticos

### Nuevo en FinanzApp
- **Exportar CSV** (📊) y **PDF** (🖨) desde vista Movimientos
- **Paginación por mes** — `loadMonth(yearMonth)` en `useFinanzData.js` carga meses bajo demanda; al navegar ‹ › se llama automáticamente
- **Pago mínimo estimado** en tarjetas — 5% del saldo + ~3% intereses, panel amarillo
- **Préstamos desde tarjeta** — LoanModal tiene toggle Cuenta / Tarjeta
- **Notificaciones automáticas** — `checkFinanzAlerts()` dispara si préstamo 30+ días sin abono o tarjeta vence en 1-2 días
- **`useNotifications.js`** nuevo — `requestPermission`, `showLocalNotification`, `checkFinanzAlerts`, `subscribePush`

### Corregido
- `useCardsData()` movido ANTES de los `useEffect` que usan `cards` — evitaba Temporal Dead Zone crash en producción
- `useNotifications` viejo eliminado del Sidebar — causaba `ReferenceError: useNotifications is not defined`
- `Planner.jsx` — `loadAll` con fallback sin `order('created_at')` si la columna no existe
- `EditPagoModal` — optional chaining + guard DESPUÉS de hooks (Rules of Hooks)

---

## [1.4.0] — 2026-05-28 — Overflow iOS Safari PWA fix definitivo

### CSS (`src/index.css`)
- `.hscroll` — scroll horizontal con scrollbar invisible, snap nativo, flex-shrink:0 en hijos
- `.hscroll-edge` — scroll horizontal edge-to-edge con negative margin trick
- `.overflow-guard` — aísla overflow de hijos (crítico en iOS Safari PWA)
- `.fa-pad` — padding seguro que no rompe `width:100%` en iOS WebKit
- `.fa-scroll` — scroll container con `-webkit-overflow-scrolling: touch`
- `.fa-dash` — Dashboard root con overflow-x:hidden en cada hijo

### FinanzApp Dashboard reescrito
- Patrón `<div className="fa-pad">` por sección — padding no suma al width
- Barra de gráfica: `overflow:hidden` + `Math.min(40,...)` como techo de altura
- Métricas: `fmtShort()` para valores compactos ($2.7M, $484k), no `fmtCOP()`

### Scroll horizontal
- Dashboard cuentas → `.hscroll-edge`
- CardsView selector → `.hscroll-edge`
- Planner filtros → `.hscroll`
- ApartamentoApp habitaciones → `.hscroll-edge`

---

## [1.3.0] — 2026-05-27 — Service Worker correcto

### SW estrategia por tipo de archivo
| Tipo | Estrategia |
|------|-----------|
| `index.html` / SPA | Siempre red (`no-cache`) — nunca cachear |
| `/assets/*.js` (con hash) | Cache First — inmutables, el hash cambia con el contenido |
| Otros estáticos | Network First |
| Supabase / APIs externas | Bypass total |

- `skipWaiting()` + `clients.claim()` al activar → recarga automática en todas las tabs

---

## [1.2.0] — 2026-05-27 — Features FinanzApp

### Nuevo
- Editar movimientos (EditTxModal)
- Transferencias entre cuentas (FAB ↔️ secundario)
- Tarjetas de crédito — saldo, límite, día de corte, gastos
- Gastos de tarjetas sumados al Dashboard como egresos
- Préstamos (Cuentas por Cobrar) con historial de abonos
- Categorías personalizables guardadas en `app_settings.fa_categories`

### FlotaTracker
- Selector de cuenta en pagos y gastos
- Sync automático → FinanzApp (income/expense con cuenta elegida)
- Valor manual al registrar día de trabajo

### ApartamentoApp
- Validación solapamiento de fechas en tiempo real
- Control de géneros M/F
- Campo `gender` en reservas

---

## [1.1.0] — 2026-05-26 — Planner mejorado

### Nuevo
- 3 estados de tarea: `pending` / `in_progress` / `done` (+ `archived`)
- Vista "Todas las Tareas" con filtros y agrupación
- Tareas sin fecha (toggle en modal)
- Click en card → panel expandido con info completa
- Archivar tareas completadas
- Categorías editables en `app_settings.pl_task_cats`

### SQL requerido
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subcategory text;
```

---

## [1.0.0] — 2026-05-25 — Lanzamiento inicial

### Apps
- **FinanzApp** — Dashboard, Movimientos, Cuentas, Por cobrar, Stats
- **Planner** — Hoy, Tareas, Calendario, Metas, Notas
- **FlotaTracker** — Resumen, Carro 1/2, Gastos, Mantenimiento
- **ApartamentoApp** — Resumen, Habitaciones, Calendario, Finanzas

### Stack
- React 18 + Vite 5 + Supabase 2.39 + Render (Static Site)
- PWA con Service Worker, manifest.json, favicon.svg

### Supabase tablas iniciales
`transactions`, `loans`, `account_balances`, `credit_cards`, `card_charges`, `tasks`, `goals`, `notes`, `cars`, `car_payments`, `car_expenses`, `apt_rooms`, `apt_reservations`, `apt_expenses`, `app_settings`

---


## 📋 Análisis y Sugerencias — 2026-05-30

### 🔴 Urgente — Estabilidad

**SW Cache frágil (v1→v2→v3 ya)**
El mismo problema ha ocurrido 3 veces. Mientras el proyecto esté en desarrollo
activo con deploys frecuentes, usar `Network First` para todo es más seguro.
Cache-First solo tiene sentido en producción estable.

**`fix-all-tables-uuid.sql` — ejecutarlo YA**
Desde v2.4.5 hasta v2.4.7 se corrigieron 10 funciones de insert. Todas dependen
de que las columnas `id` tengan `DEFAULT gen_random_uuid()::text` en Supabase.
Sin ese SQL, los datos no se guardan aunque el código esté correcto.

**`onlineRef` demasiado estricto**
Si `loadAll()` falla por cualquier razón, `onlineRef.current = false` y todos los
inserts se bloquean. Debería intentar el insert de todas formas y dejar que Supabase
retorne el error real. El check de `onlineRef` solo debería bloquear si NO hay internet.

### 🟡 Arquitectura

**Dividir `FinanzApp.jsx` (1,970 líneas)**
Archivo con mayor concentración de bugs en el historial. Cada fix tiene riesgo de
introducir nuevos errores. Dividir en: `Dashboard.jsx`, `Movements.jsx`,
`CardsView.jsx`, `Stats.jsx`, `LoansView.jsx`.

**Un solo `SETUP.sql` completo**
El CHANGELOG tiene 8 SQLs distintos. Alguien que instale desde cero no sabe cuáles
ejecutar ni en qué orden. Crear `SETUP.sql` único que los combine todos en orden correcto.

**Validación antes de insert**
Los hooks hacen insert optimista (agregan al estado local primero, rollback si falla).
Mejor: validar campos requeridos ANTES de agregar al estado para no mostrar datos
que pueden desaparecer al recargar.

### 🟢 Features de alto valor

**Offline real con IndexedDB**
La app tiene historial frecuente de problemas de conectividad. Con IndexedDB se podría
crear/editar datos sin internet y sincronizar al reconectar. Resolvería el 80% de
las quejas de conexión de esta sesión.

**Render paid ($7/mes)**
Múltiples bugs de "timeout", "Sin conexión", "Cargando perfil" tienen origen en los
cold starts del free tier (30-60s de espera). A $7/mes desaparece por completo.

---

## Reglas críticas de código

1. **CERO backticks en JSX** — bug esbuild en producción, usar concatenación
2. **TODO el CSS en `index.css`** — nunca `<style>` inline en JSX
3. **Hooks antes de cualquier return condicional** — React Rules of Hooks
4. **`useCardsData()` antes de useEffect que usa `cards`** — evita TDZ crash
5. **CERO localStorage para datos** — todo en Supabase (`suite_prefs` es la excepción)
6. **Root div de cada app:** `position:absolute, inset:0`
7. **Padding en mobile:** usar `.fa-pad` en lugar de padding inline en `width:100%`
8. **Números largos:** `fmtShort()` en espacios compactos, `fmtCOP()` en detalles

## SQL pendiente (ejecutar una vez)

```sql
-- 1. Columnas tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Account en carros
ALTER TABLE car_payments  ADD COLUMN IF NOT EXISTS account text DEFAULT 'cash';
ALTER TABLE car_expenses   ADD COLUMN IF NOT EXISTS account text DEFAULT 'cash';

-- 3. Gender en reservas
ALTER TABLE apt_reservations ADD COLUMN IF NOT EXISTS gender text;

-- 4. app_settings
CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb NOT NULL);

-- 5. RLS authenticated en todas las tablas de datos
-- (ver fix-all-rls.sql)

-- 6. Profiles + admin
-- (ver supabase-auth.sql + fix-admin-update.sql)

-- 7. Marcar tu cuenta como admin
UPDATE profiles SET is_admin=true, name='Andre',
  allowed_apps=array['finanz','planner','flota','apartamento']
WHERE email='andreams1997@gmail.com';
```
