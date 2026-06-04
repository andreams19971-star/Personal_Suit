# Mi Suite Personal — Changelog

> **URL:** https://personal-suit.onrender.com  
> **GitHub:** andreams19971-star/Personal_Suit  
> **Supabase:** cpzwvavhbhspjuntlkyz.supabase.co  
> **Stack:** React 18 + Vite 5 + Supabase + Render

---

## [2.9.6] — 2026-06-04 — Fix: 3 crashes en Planner, FlotaTracker y FinanzApp

### Error 1: `Can't find variable: DEFAULT_TASK_CATS` (Planner)
`Planner.jsx` usaba `DEFAULT_TASK_CATS` en el useState inicial y en loadSetting,
pero no lo importaba de `planner/shared.js`. Corregido.

### Error 2: `Can't find variable: getWorkDaysInMonth` (FlotaTracker)
`FlotaTracker.jsx` usaba `getWorkDaysInMonth` y `getWorkDaysPassed` del hook
de flota pero no los importaba de `flota/shared.js`. Corregido.

### Error 3: `Cannot access 'v' before initialization` (TDZ)
En `finanz/shared.js`, `fmtCOP = v => ...` y `fmtShort = v => ...` usaban `v`
como nombre de parámetro. Esbuild minifica los `export const` del módulo a letras
simples (a, b, c, ..., v). Si otro `export const` se renombra a `v` y hay cualquier
forward reference en la inicialización del módulo, se genera TDZ.
Fix: renombrar parámetro `v` → `n` en fmtCOP/fmtShort en los 3 shared.js.

### Adicionalmente
27 módulos re-sincronizados con sus shared.js (auto-fix de imports ejecutado).

### Archivos
- `src/apps/Planner.jsx`
- `src/apps/FlotaTracker.jsx`
- `src/apps/finanz/shared.js`, `flota/shared.js`, `apartamento/shared.js`
- 27 módulos

---

## [2.9.5] — 2026-06-04 — Fix crítico: userId fuera de scope en useFinanzData

### Bugs encontrados

**1. `loadMonth()` usaba `userId` fuera de scope**
`userId` es variable LOCAL de `loadAll()`. Cuando `loadMonth` lo referencia,
es `undefined` → `.eq('user_id', undefined)` → query sin filtro → todos los datos.
Fix: `const userId = userIdRef.current`

**2. `addLoan()` usaba `userId` fuera de scope**
Mismo problema. El insert de loans enviaba `user_id: undefined`.
Fix: declarar `const userId = userIdRef.current || getSession()...` al inicio.

**3. `addLoan()` enviaba IDs hardcodeados**
`id: 'L'+Date.now()` y `id: 'tx-'+Date.now()` — invalidos si columna es uuid.
Fix: omitir id en inserts, Supabase genera UUID. Actualizar estado local con UUID real.

**4. `addPayment()` usaba `userId` fuera de scope + sin user_id en tx insert**
`txToRow(incomeTx)` no incluye `user_id`. El insert de la transacción de cobro
fallaba RLS.
Fix: declarar userId, incluir `user_id: userId` explícito en el insert.

**5. `addTransaction()` insert sin user_id explícito**
`rowData` de `txToRow()` no incluye `user_id`. Solo el trigger lo seteaba.
Fix: `insert([{ ...rowData, user_id: userId }])`

**6. Todos los hooks: `if (!userId) return { error: ... }`**
Los 4 hooks restantes ahora validan que userId existe antes de insertar.

### Archivos
- `src/hooks/useFinanzData.js` — reescrito addLoan, addPayment, addTransaction, loadMonth
- `src/hooks/useCardsData.js`, usePlannerData.js, useFlotaData.js, useApartamentoData.js — guard added

---

## [2.9.4] — 2026-06-04 — Fix definitivo: trigger auto_set_user_id en Supabase

### Problema persistente
`new row violates row-level security policy for table "transactions"`
sigue ocurriendo a pesar del fix de v2.9.2.

### Causa raíz definitiva
La política RLS `WITH CHECK (auth.uid() = user_id)` falla si `user_id` llega NULL
al insert, independientemente del código. Cualquier condición de timing (token
refresh, loadAll lento, etc.) puede causar que `userId` sea null en el insert.

### Solución definitiva: trigger en Supabase
En lugar de confiar solo en el código, un trigger a nivel BD garantiza que
`user_id` nunca sea NULL en un INSERT:

```sql
CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  RETURN NEW;
END;
$$;
```

También se agrega `DEFAULT auth.uid()` en la columna para doble protección.

### SQL requerido
Ejecutar `fix-user-id-trigger.sql` en Supabase SQL Editor.

### Código
Simplificado el fallback en los 5 hooks a una sola línea:
`const userId = userIdRef.current || (await getSession()).user?.id`

---

## [2.9.3] — 2026-06-04 — Auditoría completa: bugs de aislamiento y módulos

### Bugs encontrados y corregidos

**1. `useCardsData.js`: selects sin filtro de usuario**
Las queries a `credit_cards` y `card_charges` no tenían `.eq('user_id', userId)`.
Un usuario podía ver las tarjetas de todos. Corregido: query única con JOIN
`credit_cards?select=*,card_charges(*)` filtrada por `user_id`.

**2. `usePlannerData.js`: selects sin filtro + habits sin user_id**
- `loadTable()` no pasaba `.eq('user_id', userId)` a ninguna tabla (tasks, habits, goals, notes).
- El fallback insert de `safeRow` no incluía `user_id` (si Supabase no tiene columna `status`).
- Insert de `habits` no incluía `user_id`.

**3. `MobileNav.jsx`: import con dobles llaves `{{}}`**
`import {{ C, ... }}` — syntax inválida. Causado por el script sed en v2.8.x.
Corregido a `import { C, ... }`.

**4. 27 módulos con imports de shared.js desactualizados**
El auto-fixer de imports se volvió a correr sobre todos los módulos de las 4 apps
para asegurar que cada archivo importa exactamente los símbolos que usa.

### Archivos
- `src/hooks/useCardsData.js`
- `src/hooks/usePlannerData.js`
- `src/apps/finanz/MobileNav.jsx`
- 27 módulos en `finanz/`, `planner/`, `flota/`, `apartamento/`

---

## [2.9.2] — 2026-06-04 — Bugfix: RLS violation por user_id null en inserts

### Error
`new row violates row-level security policy for table "transactions"`

### Causa
Condición de carrera: el usuario abre FinanzApp y agrega un movimiento ANTES
de que `loadAll()` complete. `userIdRef.current` aún es `null` en ese momento,
por lo que el insert envía `user_id: null`. La política RLS
`USING (auth.uid() = user_id)` falla porque `null != auth.uid()`.

### Fix
En cada función de insert, si `userIdRef.current` es null:
1. Llamar `supabase.auth.getSession()` directamente
2. Guardar el userId en `userIdRef.current` para los siguientes inserts
3. Si aún no hay userId → retornar error "No autenticado"

Aplica a los 5 hooks de datos: `addTransaction`, `addCard`, `addCharge`,
`addTask`, `addWorkDay`, `addExpense`, `addReservation`.

### Archivos
- `src/hooks/useFinanzData.js`
- `src/hooks/useCardsData.js`
- `src/hooks/usePlannerData.js`
- `src/hooks/useFlotaData.js`
- `src/hooks/useApartamentoData.js`

---

## [2.9.1] — 2026-06-03 — Bugfix: useAuth not defined en hooks

### Error
`ReferenceError: useAuth is not defined` en producción.

### Causa
Los 5 hooks de datos importaban `useAuth` del contexto de React para obtener el
userId. Aunque `useAuth.js` exporta la función, en el bundle de producción el
módulo bundleado tenía problemas de resolución de contexto — `useAuth` no estaba
disponible como variable en tiempo de ejecución.

Usar un React hook de contexto dentro de otro custom hook crea una dependencia
frágil: si el árbol de contexto no está completamente inicializado cuando el hook
corre, el valor es undefined.

### Solución
Eliminar el import de `useAuth` de los 5 hooks de datos. En su lugar, obtener
el userId directamente de Supabase al inicio de `loadAll()`:

```js
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;
if (!userId) return; // no autenticado
```

Almacenar el userId en `userIdRef.current` para que las funciones de insert
lo puedan usar sin depender del contexto de React.

### Ventajas del nuevo enfoque
- No depende del árbol de React — funciona aunque el contexto no esté listo
- `supabase.auth.getSession()` siempre tiene el token más fresco
- Más consistente: la misma fuente de verdad para auth (el JWT de Supabase)

### Archivos
- `src/hooks/useFinanzData.js`
- `src/hooks/useCardsData.js`
- `src/hooks/usePlannerData.js`
- `src/hooks/useFlotaData.js`
- `src/hooks/useApartamentoData.js`

---

## [2.9.0] — 2026-06-03 — CRÍTICO: Aislamiento de datos por usuario

### Problema
Todos los usuarios veían los datos de todos los demás usuarios.
Las tablas de datos no tenían columna `user_id` y las políticas RLS
usaban `USING (true)` — cualquier usuario autenticado podía ver todo.

### Solución completa (SQL + código)

**SQL: `fix-user-isolation.sql`**
1. Agrega columna `user_id uuid REFERENCES auth.users(id)` a las 16 tablas
2. Migra datos existentes al usuario admin (andreams1997@gmail.com)
3. Reemplaza políticas `anon_all`/`auth_all` con `user_data`:
   `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

**Código: 5 hooks actualizados**
- Todos los `SELECT` ahora incluyen `.eq('user_id', userId)`
- Todos los `INSERT` ahora incluyen `user_id: userId`
- `useAuth` importado en cada hook para obtener el userId actual

**useAuth.js: limpieza de caché entre usuarios**
Al evento `SIGNED_IN`, si el perfil en caché es de otro usuario
(ids diferentes), se limpia el caché antes de cargar el nuevo perfil.

**useSettings.js: settings aislados por usuario**
`loadSetting` y `saveSetting` aceptan `userId` y filtran por él.

### Archivos
- `fix-user-isolation.sql` — ejecutar en Supabase
- `src/hooks/useFinanzData.js`
- `src/hooks/useCardsData.js`
- `src/hooks/usePlannerData.js`
- `src/hooks/useFlotaData.js`
- `src/hooks/useApartamentoData.js`
- `src/hooks/useSettings.js`
- `src/hooks/useAuth.js`

---

## [2.8.4] — 2026-06-03 — Bugfix: `Notification` no definida en iOS Safari PWA

### Error
`Can't find variable: Notification` — crash global capturado por ErrorBoundary.

### Causa
iOS Safari PWA no tiene la API `Notification` disponible como variable global.
El código la usaba directamente sin verificar su existencia:
- `showLocalNotification()`: `Notification.permission` sin guard → crash
- `Sidebar.jsx` línea 9: `Notification.permission` en useState sin guard

La línea 15 sí tenía el check correcto (`!("Notification" in window)`) pero la
línea 23 lo saltaba porque asumía que si llegaba ahí, `Notification` existía.

### Fix
- `typeof Notification === "undefined"` guard al inicio de `showLocalNotification()`
- `requestPermission()` envuelto en try/catch
- `showNotification` del SW envuelto en `.catch(()=>{})`
- `new Notification()` fallback envuelto en try/catch
- `Sidebar.jsx`: estado inicial con guard triple → `"unsupported"` si no existe

### Archivos
- `src/hooks/useNotifications.js`
- `src/apps/finanz/Sidebar.jsx`

---

## [2.8.3] — 2026-06-03 — Auditoría completa: 32 bugs corregidos

### Metodología
Revisión sistemática de los 56 archivos del proyecto con 5 tipos de checks:
syntax (braces, backticks), duplicate imports, td() residual, exports faltantes,
import/export mismatch entre shells y módulos.

### Problemas encontrados y corregidos

**29 módulos con imports de shared.js incompletos**
El script de split copió solo `{ C, today }` de cada shared.js, pero los módulos
usan MONTHS, DAYS, fmt, STATUS_CONFIG, PLATFORMS, PRIORITIES, etc. Script automático
de corrección actualiza las líneas de import al mínimo necesario (ni más ni menos).

**`EditTaskModal` importado del archivo incorrecto**
`Planner.jsx` importaba `EditTaskModal` desde `TaskRow.jsx` pero está en `EditTaskModal.jsx`.

**`finanz/shared.js` usaba `export {}` al final**
El checker (y potencialmente Rollup en algunos casos) espera `export const X`.
Convertido a inline `export const` en cada declaración.

### Archivos corregidos
- `src/apps/Planner.jsx` — import EditTaskModal desde EditTaskModal.jsx
- `src/apps/finanz/shared.js` — inline export const
- 28 módulos en finanz/, planner/, flota/, apartamento/ — imports shared.js precisos

---

## [2.8.2] — 2026-06-03 — Bugfix: exports faltantes en shared.js + td() residual

### Error
`"C" is not exported by "src/apps/planner/shared.js"`

### Causas

**1. shared.js sin exports**
Los 3 `shared.js` nuevos (planner, flota, apartamento) tenían las constantes
definidas pero sin la keyword `export`. Vite/Rollup no puede importar constantes
no exportadas aunque existan en el archivo.

**2. `fmtCOP`/`fmtShort` ausentes en flota y apartamento**
Estos archivos los usan pero no estaban en sus `shared.js`.

**3. `td()` como llamada de función (no solo como alias)**
El fix de v2.8.0 eliminó `const td = today` (el alias) pero no las llamadas
`td()` que quedaron en 12 archivos. `td` ya no existe → ReferenceError en runtime.

### Fix
- `export const`/`export function` aplicado a todos los símbolos en los 3 shared.js
- `fmtCOP` y `fmtShort` agregados a `flota/shared.js` y `apartamento/shared.js`
- 12 archivos: `td()` → `today()`

---

## [2.8.1] — 2026-06-03 — Bugfix: `today` duplicado en imports

### Error
`The symbol "today" has already been declared` en `FinanzApp.jsx:7`

El import tenía: `import { ..., today, today, ... }` — dos veces.

### Causa
El script de reemplazo `td → today` (v2.8.0) procesó el texto de los imports
y convirtió el `td` que ya existía en el import. Como `today` ya estaba en el
import (también se exporta con ese nombre), quedaron dos instancias.

### Fix
Regex `re.sub(r'\btoday, today\b', 'today', c)` sobre los 11 archivos afectados.

### Archivos corregidos
FinanzApp.jsx, AccountsView.jsx, LoansView.jsx, Modals.jsx, TopBar.jsx,
CardsView.jsx, MobileNav.jsx, Dashboard.jsx, Helpers.jsx, Stats.jsx, Movements.jsx

---

## [2.8.0] — 2026-06-02 — Aplicar todas las sugerencias del análisis

### ✅ 1. Eliminar alias `td`
`shared.js` exportaba `export const td = today` (alias redundante). Eliminado.
22 archivos actualizados de `td` → `today`.

### ✅ 2. SW cache auto-versionado
`vite.config.js` inyecta `__BUILD_STAMP__` (fecha del build) en `sw.js`.
El CACHE ahora es `'suite-' + BUILD_STAMP` en lugar de `'suite-v4'` hardcodeado.
Cada deploy genera un CACHE diferente → limpia el caché obsoleto automáticamente.

### ✅ 3. Tema por horario: timer de re-evaluación
`App.jsx` ahora tiene `setInterval(60s)` cuando el tema es "schedule".
El tema cambia automáticamente a la hora configurada sin necesidad de recargar la app.

### ✅ 4. Script pre-build `scripts/check-imports.js`
Detecta antes del deploy: backticks, llaves desequilibradas, helpers usados sin importar.
Configurado como `prebuild` en `package.json` → se ejecuta automáticamente con `npm run build`.

### ✅ 5. SQL: estandarizar columnas car_expenses a inglés
Generado `fix-car-expenses-columns.sql`. Una vez ejecutado, `car_expenses` usará
`amount/category/note` igual que `apt_expenses`. `useFlotaData.js` actualizado.

### ✅ 6. Dividir Sidebar.jsx (370L → 3 archivos)
- `finanz/AccountsManager.jsx` (136L) — gestión de cuentas
- `finanz/CategoriesManager.jsx` (118L) — gestión de categorías + CatForm
- `finanz/Sidebar.jsx` (110L) — panel lateral

### ✅ 7. Split Planner.jsx (1,074L → shell + 9 módulos en `planner/`)
`Planner.jsx` shell: 162L. Módulos: TodayView, TaskRow, EditTaskModal,
AllTasksView, CalendarView, HabitsView, GoalsView, NotesView, Modals.

### ✅ 8. Split FlotaTracker.jsx (928L → shell + 4 módulos en `flota/`)
`FlotaTracker.jsx` shell: 195L. Módulos: Dashboard, CarroView, GastosView, Modals.

### ✅ 9. Split ApartamentoApp.jsx (770L → shell + 5 módulos en `apartamento/`)
`ApartamentoApp.jsx` shell: 152L. Módulos: DashboardView, RoomsView,
CalendarView, FinancesView, Modals.

### Estructura final de archivos
```
src/apps/
  FinanzApp.jsx (219L)     finanz/    (12 archivos, ~180L promedio)
  Planner.jsx   (162L)     planner/   (9 archivos)
  FlotaTracker.jsx (195L)  flota/     (4 archivos)
  ApartamentoApp.jsx (152L) apartamento/ (5 archivos)
```
Total: 4 shells + 30 módulos = 34 archivos vs 4 monolitos de 2,000+ líneas.

---

## [2.7.2] — 2026-06-02 — Bugfix: MF not defined + SW clone error

### Error 1: `ReferenceError: MF is not defined`
`MF` está definido y exportado en `Helpers.jsx` pero tres archivos lo usaban sin importarlo:
- `Modals.jsx` — usa MF en todos los modales de formulario
- `CardsView.jsx` — usa MF en ChargeModal y EditChargeModal
- `AccountsView.jsx` — usa TxRow y EmptyState

Además `AccountsView.jsx` tenía llaves dobles `{{` en los imports (artefacto del script sed).

### Error 2: `Failed to execute 'clone' on 'Response': Response body is already used`
En sw.js, `res.clone()` se llamaba dentro de un `.then()` asíncrono DESPUÉS de que
`return res` ya consumió el body. La corrección: `const clone = res.clone()` ANTES
del `return res`, y usar `clone` en el `caches.open().then()`.

### Archivos
- `src/apps/finanz/Modals.jsx` — import MF, SectionHeader, EmptyState
- `src/apps/finanz/CardsView.jsx` — import MF, SectionHeader, EmptyState, TxRow
- `src/apps/finanz/AccountsView.jsx` — fix llaves dobles + import TxRow, EmptyState
- `public/sw.js` — clone antes del return en 3 handlers

---

## [2.7.1] — 2026-06-02 — Bugfix: shared.js tenía imports incorrectos

### Error de build
`Could not resolve "../hooks/useFinanzData.js" from "src/apps/finanz/shared.js"`

### Causa
Al extraer `shared.js`, el script de Python copió las primeras líneas de FinanzApp.jsx
que incluían los imports de los hooks (`useFinanzData`, `useCardsData`, XLSX, etc.).
`shared.js` solo debe exportar constantes — no importa nada.

También: `AccountsView.jsx`, `MobileNav.jsx` y `Movements.jsx` heredaron `import XLSX`
innecesariamente (solo `Movements.jsx` lo necesita por `exportXLSX`).

### Fix
- Eliminados imports de hooks y XLSX de `shared.js`
- Eliminado import XLSX de `AccountsView.jsx` y `MobileNav.jsx`
- Mantenido import XLSX en `Movements.jsx` (necesario para exportar)

---

## [2.7.0] — 2026-06-02 — FinanzApp dividida en módulos

### Estructura anterior
Un solo archivo `FinanzApp.jsx` de 2,049 líneas.
Cada cambio tenía riesgo de romper funcionalidades no relacionadas.

### Nueva estructura (10 archivos, promedio 180 líneas cada uno)

```
src/apps/
  FinanzApp.jsx          (219 líneas — shell: hooks, estado, render principal)
  finanz/
    shared.js            (74  líneas — C, fmtCOP, fmtShort, ACCOUNTS_DEF, etc.)
    Helpers.jsx          (32  líneas — TxRow, SectionHeader, EmptyState, Pill, StatCard, MF)
    TopBar.jsx           (57  líneas — TopBar, MobileNav)
    Dashboard.jsx        (157 líneas — sección inicio)
    Movements.jsx        (124 líneas — Movements + AccountsView)
    LoansView.jsx        (156 líneas — LoansView + LoanDetail)
    CardsView.jsx        (339 líneas — CardsView + ChargeModal + EditChargeModal + CardEditModal)
    Stats.jsx            (209 líneas — Stats)
    Sidebar.jsx          (370 líneas — Sidebar + AccountsManager + CategoriesManager + CatForm)
    Modals.jsx           (343 líneas — AddModal + LoanModal + PayModal + EditTxModal + TransferModal)
```

### Beneficios
- Cambios aislados: editar Stats no toca Movements, editar Modals no toca Dashboard
- Code splitting de Vite mejorado: cada módulo puede ser un chunk separado
- Más fácil de debuggear: errores apuntan al archivo exacto
- Todos los archivos tienen exports nombrados y pasan la verificación de sintaxis

---

## [2.6.4] — 2026-05-31 — Bugfix: movimientos de tarjetas no se guardan

### Causas identificadas

**1. Seed con IDs hardcodeados rompía loadAll**
Cuando no había tarjetas, `loadAll` intentaba insertar `DEFAULT_CARDS` con IDs
`'C1'`/`'C2'`. Si la columna `id` de `credit_cards` es de tipo `uuid`, ese insert
fallaba → todo el `loadAll` caía al `catch` → `onlineRef.current = false` →
ningún `addCharge`/`addCard` guardaba (retornaban 'Sin conexión').

**2. addCharge/addCard bloqueaban si onlineRef era false**
A diferencia de los otros hooks (corregidos en v2.6.0), estos dos aún tenían
`if (!onlineRef.current) return { error:'Sin conexión' }`, bloqueando el insert.

**3. Posibles columnas/políticas faltantes en Supabase**
`card_charges` puede no tener política `auth_all` o columnas `installments`/`note`.

### Solución
- **Eliminado el seed automático** de tarjetas — la lista arranca vacía y el usuario
  crea las suyas (evita el insert con IDs hardcodeados inválidos)
- **addCharge y addCard** ahora intentan el insert aunque `onlineRef` sea false
  (consistente con el resto de hooks tras v2.6.0)
- **Fallback offline** usa `[]` en vez de `DEFAULT_CARDS`
- **SQL `fix-cards.sql`** — verifica/corrige columnas, UUID default y políticas RLS
  de `credit_cards` y `card_charges`

### Archivos
- `src/hooks/useCardsData.js`
- `fix-cards.sql` (nuevo)

---

## [2.6.3] — 2026-05-30 — Fix: apps no cargan al volver a la app

### Problema
Al cerrar y volver a abrir la app en pocos segundos, las apps no cargaban.

### Causas identificadas

**1. `clients.navigate(c.url)` en el SW activate**
Forzaba un reload de todas las tabs cuando se instalaba un nuevo SW.
Si el usuario tenía la app abierta y llegaba una nueva versión en background,
el reload ocurría en plena sesión sin aviso.

**2. Network First para TODOS los assets**
Con Render Free (cold start 15-60s), cada chunk de React.lazy esperaba la red.
Al reabrir la app, todos los assets (`vendor-react.js`, `FinanzApp.js`, etc.)
pedían a la red antes de servir del caché. Con cold start = app cargando indefinidamente.

### Solución — SW v4

| Tipo de archivo | Estrategia anterior | Estrategia v4 |
|----------------|---------------------|---------------|
| HTML | Network First | Network First + timeout 5s → caché si red lenta |
| `/assets/*.js` (con hash) | Network First ❌ | **Cache First** ✅ — inmutables por hash |
| Otros | Network First | Network First |
| `clients.navigate()` | Sí ❌ | **Eliminado** ✅ |

**Por qué Cache First es SEGURO para assets con hash:**
Vite genera nombres como `FinanzApp-B9y9GJIo.js`. El hash cambia si cambia el contenido.
Al hacer un nuevo deploy, el nuevo main bundle referencia `FinanzApp-NewHash.js` (nuevo nombre).
El archivo viejo `B9y9GJIo.js` queda en caché pero nadie lo referencia → irrelevante.
El nuevo hash no está en caché → cache miss → se descarga fresco → se cachea para siempre.

**Resultado:**
- Abre la app: assets del caché (instantáneo) + HTML de la red (verifica versión)
- Sin internet: funciona con caché
- Nuevo deploy: HTML actualizado → nuevos hashes → cache miss → descarga nueva versión
- Sin reloads inesperados al volver a la app

### Archivos
- `public/sw.js` — v4

---

## [2.6.2] — 2026-05-30 — Bugfix: columnas car_expenses en español

### Error
`Could not find the 'amount' column of 'car_expenses' in the schema cache`

### Causa
La tabla `car_expenses` fue creada con columnas en español (`monto`, `categoria`, `nota`)
pero el insert enviaba columnas en inglés (`amount`, `category`, `note`).
Los datos SÍ cargan (SELECT funciona) pero el INSERT fallaba con esas columnas inexistentes.

Contraste con `apt_expenses` que sí usa inglés (`amount`, `category`, `note`) y funciona.

### Fix
Cambiar el insert de `car_expenses` a usar los nombres correctos:
- `amount` → `monto`
- `category` → `categoria`
- `note` → `nota`

### Archivos
- `src/hooks/useFlotaData.js` — `addExpense` línea 170

---

## [2.6.1] — 2026-05-30 — Bugfix: columnas faltantes en Supabase

### Causa raíz
El SETUP.sql con las migraciones nunca se ejecutó en Supabase. Al agregar un gasto
de carro el error era: `Could not find the 'account' column of 'car_expenses' in the schema`.

### Columnas faltantes identificadas (4 tablas)

| Tabla | Columna | Necesaria para |
|-------|---------|----------------|
| `car_expenses` | `account` | Selector de cuenta en gastos de carro |
| `car_payments` | `account` | Selector de cuenta en días de trabajo |
| `apt_reservations` | `gender` | Control de géneros M/F |
| `tasks` | `status`, `subcategory` | Estados de tarea (pending/in_progress/done) |

### Fix en dos partes

**1. SQL** (`fix-missing-columns.sql`) — agrega las columnas con `IF NOT EXISTS`

**2. Código resiliente** — si la columna no existe aún en BD, los inserts omiten ese campo
   en lugar de fallar:
   - `addExpense`: `...(account ? { account } : {})`
   - `addWorkDay`: `...(account ? { account } : {})`
   - `addReservation`: `...(gender ? { gender } : {})`
   - `addTask`: reintenta sin `status`/`subcategory` si Supabase retorna error de columna

### Archivos
- `src/hooks/useFlotaData.js`
- `src/hooks/useApartamentoData.js`
- `src/hooks/usePlannerData.js`
- `fix-missing-columns.sql` (nuevo)

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


## 📋 Análisis y Sugerencias — 2026-06-02 (post v2.7.2)

### 🔴 Urgente

**1. Verificar el split de FinanzApp en producción**
Tomó 3 versiones estabilizarse (2.7.0→2.7.1→2.7.2). Confirmar que todas las vistas
cargan sin errores antes de continuar: Dashboard, Movimientos, Cuentas, Préstamos,
Tarjetas, Stats. Si hay más imports faltantes, aparecerán ahora.

**2. SETUP.sql todavía pendiente de ejecución**
El bloque "SQL pendiente" al final del CHANGELOG sigue sin ejecutarse. Si no se corrió,
los bugs de columnas faltantes pueden reaparecer con datos nuevos.

### 🟡 Arquitectura

**3. Script de verificación pre-build (build:check)**
El bug "módulo usa X pero no lo importa" ocurrió 3 veces. Un script que corra antes
del build y detecte imports faltantes evitaría deploys rotos. Agregar a package.json:
`"prebuild": "node scripts/check-imports.js"`

**4. Estandarizar nombres de columnas en Supabase**
`car_expenses` usa español (monto/categoria/nota), `apt_expenses` usa inglés
(amount/category/note). Inconsistencia documentada en v2.6.2. SQL de renombramiento
para alinear todo a inglés.

**5. Dividir Sidebar.jsx (370 líneas, mezcla responsabilidades)**
Contiene Sidebar UI + AccountsManager + CategoriesManager + CatForm.
Mismo argumento que motivó el split de FinanzApp.

### 🟢 Features de alto valor

**6. Aplicar el split a las 3 apps restantes**
Planner (~1,074L), FlotaTracker (~930L), ApartamentoApp (~770L) siguen siendo monolitos.
Patrón ya probado. Beneficios: errores aislados, edición más segura, debugging más rápido.

**7. Tema por horario — completar implementación**
Se agregó opción "Horario" en Settings (v2.4.0) pero `getScheduledTheme` no tiene timer
que re-evalúe cuando cambia la hora. El tema solo cambia al recargar la app.
Fix: `setInterval(() => forceUpdate(), 60000)` en el componente principal.

### 🔧 Deuda técnica

**8. `today` y `td` son la misma función exportada dos veces**
`shared.js` exporta `export const td = today` (alias redundante). Unificar a `today`.

**9. CACHE del SW no se versiona automáticamente**
`const CACHE = 'suite-v4'` está hardcodeado. Propuesta: usar el BUILD timestamp
como versión del cache via plugin de Vite → `'suite-' + BUILD_HASH`.

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
