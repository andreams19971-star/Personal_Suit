import { useState } from "react";

const C = {
  bg: "#0A0A0F", surface: "#111118", card: "#18181F", cardHover: "#1E1E28",
  border: "#252530", accent: "#FB923C", accentDim: "#2A1A0A", accentText: "#FB923C",
  green: "#34D399", greenDim: "#0A2A1A", red: "#F87171", redDim: "#2A0F0F",
  blue: "#60A5FA", yellow: "#FBBF24", purple: "#A78BFA",
  text: "#F0F4FF", textSub: "#8899BB", textMuted: "#3A3A50",
};

const fmt = v => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v, dec = 1) => (v || 0).toFixed(dec);
const td = () => new Date().toISOString().slice(0, 10);
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const CAR_EXPENSE_CATS = [
  { id: "fuel",        label: "Gasolina",       icon: "⛽" },
  { id: "oil",         label: "Aceite",          icon: "🛢️" },
  { id: "tires",       label: "Llantas",         icon: "🔄" },
  { id: "soat",        label: "SOAT",            icon: "📋" },
  { id: "revision",    label: "Revisión técnica", icon: "🔧" },
  { id: "maintenance", label: "Mantenimiento",   icon: "🔩" },
  { id: "washing",     label: "Lavado",          icon: "🚿" },
  { id: "insurance",   label: "Seguro",          icon: "🛡️" },
  { id: "parking",     label: "Parqueadero",     icon: "🅿️" },
  { id: "other",       label: "Otro",            icon: "📦" },
];

function seedData() {
  const now = new Date();
  const d = (days) => { const x = new Date(now); x.setDate(x.getDate() - days); return x.toISOString().slice(0,10); };

  return {
    car: {
      brand: "Chevrolet",
      model: "Aveo",
      year: 2019,
      plate: "ABC-123",
      currentKm: 87450,
      purchaseKm: 45000,
      purchasePrice: 28000000,
      fuelType: "corriente",
      tankCapacity: 45,
      nextOilChange: 90000,
      nextRevision: 92000,
    },
    shifts: [
      { id: "S1", date: d(0), startTime: "06:00", endTime: "14:00", kmStart: 87250, kmEnd: 87450, earnings: 185000, trips: 12, platform: "Uber", notes: "" },
      { id: "S2", date: d(1), startTime: "14:00", endTime: "22:00", kmStart: 87050, kmEnd: 87250, earnings: 210000, trips: 15, platform: "Uber", notes: "" },
      { id: "S3", date: d(2), startTime: "06:00", endTime: "13:00", kmStart: 86880, kmEnd: 87050, earnings: 160000, trips: 10, platform: "InDriver", notes: "" },
      { id: "S4", date: d(4), startTime: "15:00", endTime: "23:00", kmStart: 86650, kmEnd: 86880, earnings: 230000, trips: 17, platform: "Uber", notes: "Día muy bueno" },
      { id: "S5", date: d(5), startTime: "07:00", endTime: "15:00", kmStart: 86430, kmEnd: 86650, earnings: 195000, trips: 13, platform: "Uber", notes: "" },
      { id: "S6", date: d(7), startTime: "14:00", endTime: "21:00", kmStart: 86250, kmEnd: 86430, earnings: 175000, trips: 11, platform: "Cabify", notes: "" },
      { id: "S7", date: d(8), startTime: "06:00", endTime: "14:00", kmStart: 86050, kmEnd: 86250, earnings: 200000, trips: 14, platform: "Uber", notes: "" },
    ],
    expenses: [
      { id: "E1", date: d(3),  category: "fuel",        amount: 120000, km: 86800, note: "Tanque lleno", liters: 30 },
      { id: "E2", date: d(6),  category: "washing",     amount: 25000,  km: 86400, note: "Lavado completo", liters: 0 },
      { id: "E3", date: d(10), category: "fuel",        amount: 120000, km: 86000, note: "Tanque lleno", liters: 30 },
      { id: "E4", date: d(15), category: "oil",         amount: 85000,  km: 85500, note: "Cambio aceite 5W30", liters: 0 },
      { id: "E5", date: d(20), category: "maintenance", amount: 150000, km: 85000, note: "Frenos delanteros", liters: 0 },
    ],
  };
}

export default function UberTracker({ onBack }) {
  const [data, setData] = useState(seedData);
  const [view, setView] = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(td().slice(0,7));
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2200); };

  const addShift = (shift) => {
    setData(d => ({
      ...d,
      shifts: [{ ...shift, id: "S" + Date.now() }, ...d.shifts],
      car: { ...d.car, currentKm: Math.max(d.car.currentKm, shift.kmEnd || d.car.currentKm) }
    }));
    showToast("Turno registrado ✓");
    setShowShiftModal(false);
  };

  const addExpense = (exp) => {
    setData(d => ({ ...d, expenses: [{ ...exp, id: "E" + Date.now() }, ...d.expenses] }));
    showToast("Gasto registrado ✓");
    setShowExpenseModal(false);
  };

  const deleteShift = (id) => { setData(d => ({ ...d, shifts: d.shifts.filter(s => s.id !== id) })); showToast("Turno eliminado", "err"); };
  const deleteExpense = (id) => { setData(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) })); showToast("Gasto eliminado", "err"); };

  // COMPUTE STATS
  const mShifts   = data.shifts.filter(s => s.date.startsWith(filterMonth));
  const mExpenses = data.expenses.filter(e => e.date.startsWith(filterMonth));
  const totalEarnings = mShifts.reduce((s, x) => s + x.earnings, 0);
  const totalKm       = mShifts.reduce((s, x) => s + (x.kmEnd - x.kmStart), 0);
  const totalTrips    = mShifts.reduce((s, x) => s + x.trips, 0);
  const totalExpenses = mExpenses.reduce((s, e) => s + e.amount, 0);
  const totalHours    = mShifts.reduce((s, x) => {
    const [sh, sm] = x.startTime.split(":").map(Number);
    const [eh, em] = x.endTime.split(":").map(Number);
    return s + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);
  const netEarnings   = totalEarnings - totalExpenses;
  const perKm         = totalKm > 0 ? totalEarnings / totalKm : 0;
  const perHour       = totalHours > 0 ? totalEarnings / totalHours : 0;
  const perTrip       = totalTrips > 0 ? totalEarnings / totalTrips : 0;
  const costPerKm     = totalKm > 0 ? totalExpenses / totalKm : 0;

  const nav = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "shifts",    icon: "🕐",  label: "Turnos" },
    { id: "expenses",  icon: "⛽",  label: "Gastos" },
    { id: "car",       icon: "🚗",  label: "Mi Carro" },
  ];

  const [y, m] = filterMonth.split("-");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", background: C.bg, minHeight: "100vh", color: C.text, overflow: "hidden" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        input,select,textarea{outline:none;font-family:inherit}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes su{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .3s ease both}.bp:active{transform:scale(.96)}.hr:hover{background:${C.cardHover}!important}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.textSub, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Suite</button>
        <div style={{ fontSize: 16, fontWeight: 800, flex: 1 }}>🚗 UberTracker</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.card, borderRadius: 8, padding: "5px 10px", border: `1px solid ${C.border}` }}>
          <button onClick={() => { const d = new Date(filterMonth+"-01"); d.setMonth(d.getMonth()-1); setFilterMonth(d.toISOString().slice(0,7)); }} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 11, fontWeight: 600, minWidth: 55, textAlign: "center" }}>{MONTHS[parseInt(m)-1]} {y}</span>
          <button onClick={() => { const d = new Date(filterMonth+"-01"); d.setMonth(d.getMonth()+1); if(d<=new Date()) setFilterMonth(d.toISOString().slice(0,7)); }} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 14 }}>›</button>
        </div>
        <button onClick={() => { if(view==="shifts") setShowShiftModal(true); else if(view==="expenses") setShowExpenseModal(true); else if(view==="car") setShowCarModal(true); else setShowShiftModal(true); }}
          style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Agregar</button>
      </div>

      {/* CONTENT */}
      <div style={{ overflowY: "auto", paddingBottom: 60, height: "calc(100vh - 108px)" }}>
        {view === "dashboard" && <DashboardView shifts={mShifts} expenses={mExpenses} car={data.car} totalEarnings={totalEarnings} totalKm={totalKm} totalTrips={totalTrips} totalExpenses={totalExpenses} totalHours={totalHours} netEarnings={netEarnings} perKm={perKm} perHour={perHour} perTrip={perTrip} costPerKm={costPerKm} allShifts={data.shifts} />}
        {view === "shifts"    && <ShiftsView shifts={mShifts} deleteShift={deleteShift} totalEarnings={totalEarnings} totalKm={totalKm} totalHours={totalHours} />}
        {view === "expenses"  && <ExpensesView expenses={mExpenses} deleteExpense={deleteExpense} totalExpenses={totalExpenses} />}
        {view === "car"       && <CarView car={data.car} allExpenses={data.expenses} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0", border: "none", background: "transparent", color: view === n.id ? C.accent : C.textMuted, cursor: "pointer", fontSize: 9, fontWeight: 600 }}>
            <span style={{ fontSize: 17 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {showShiftModal   && <ShiftModal   onClose={() => setShowShiftModal(false)}   onAdd={addShift}   currentKm={data.car.currentKm} />}
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onAdd={addExpense} currentKm={data.car.currentKm} />}
      {toast && <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: toast.t === "err" ? C.red : C.accent, color: toast.t === "err" ? "#fff" : "#000", padding: "8px 18px", borderRadius: 100, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>{toast.m}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ shifts, expenses, car, totalEarnings, totalKm, totalTrips, totalExpenses, totalHours, netEarnings, perKm, perHour, perTrip, costPerKm, allShifts }) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const dayShifts = allShifts.filter(s => s.date === key);
    return { label: ["D","L","M","M","J","V","S"][d.getDay()], earnings: dayShifts.reduce((s,x)=>s+x.earnings,0), km: dayShifts.reduce((s,x)=>s+(x.kmEnd-x.kmStart),0) };
  });
  const maxEarning = Math.max(...last7.map(d => d.earnings), 1);

  const kmToOilChange   = car.nextOilChange - car.currentKm;
  const kmToRevision    = car.nextRevision - car.currentKm;

  const expByCat = {};
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount; });

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg,${C.accentDim},${C.card})`, border: `1px solid ${C.accent}44`, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -25, right: -25, width: 110, height: 110, borderRadius: "50%", background: `${C.accent}0D` }} />
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 3 }}>GANANCIAS DEL MES</div>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>{fmt(totalEarnings)}</div>
        <div style={{ fontSize: 13, color: netEarnings >= 0 ? C.green : C.red, fontWeight: 700, marginTop: 2 }}>Neto: {fmt(netEarnings)}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {[[C.accent, "🛣️ Km", fmtN(totalKm,0)+"km"],[C.blue,"🕐 Horas",fmtN(totalHours,1)+"h"],[C.green,"🚗 Viajes",totalTrips],[C.red,"💸 Gastos",fmt(totalExpenses)]].map(([color,label,val])=>(
            <div key={label} style={{ flex: 1, minWidth: 60 }}>
              <div style={{ fontSize: 9, color, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Ganancia x km", value: fmt(perKm), sub: "ingreso bruto", color: C.accent, icon: "📍" },
          { label: "Ganancia x hora", value: fmt(perHour), sub: "ingreso bruto", color: C.blue, icon: "⏱️" },
          { label: "Ganancia x viaje", value: fmt(perTrip), sub: "promedio", color: C.green, icon: "🚕" },
          { label: "Costo x km", value: fmt(costPerKm), sub: "gastos del carro", color: C.red, icon: "⚙️" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${kpi.color}33`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* EARNINGS CHART */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Ganancias últimos 7 días</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 70 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {d.earnings > 0 && <div style={{ fontSize: 8, color: C.textMuted }}>{(d.earnings/1000).toFixed(0)}k</div>}
              <div style={{ width: "100%", borderRadius: 4, background: d.earnings ? C.accent : C.border, height: d.earnings ? Math.max(4, (d.earnings / maxEarning) * 50) : 3 }} />
              <span style={{ fontSize: 9, color: C.textMuted }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CAR ALERTS */}
      {(kmToOilChange < 2000 || kmToRevision < 2000) && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ Alertas del carro</div>
          {kmToOilChange < 2000 && <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>🛢️ Cambio de aceite en {kmToOilChange} km</div>}
          {kmToRevision < 2000 && <div style={{ fontSize: 12, color: C.textSub }}>🔧 Revisión técnica en {kmToRevision} km</div>}
        </div>
      )}

      {/* EXPENSE BREAKDOWN */}
      {Object.keys(expByCat).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Gastos del mes</div>
          {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([catId, amount]) => {
            const cat = CAR_EXPENSE_CATS.find(c => c.id === catId) || { label: catId, icon: "📦" };
            const pct = Math.round((amount / totalExpenses) * 100);
            return (
              <div key={catId} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12 }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{fmt(amount)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: C.border }}>
                  <div style={{ height: "100%", borderRadius: 2, background: C.red, width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENT SHIFTS */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Turnos recientes</div>
        {shifts.slice(0, 4).map((s, i) => <ShiftRow key={s.id} shift={s} showDiv={i < Math.min(3, shifts.length - 1)} />)}
        {shifts.length === 0 && <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, padding: 12 }}>📭 Sin turnos este mes</div>}
      </div>
    </div>
  );
}

// ─── SHIFTS VIEW ──────────────────────────────────────────────────────────────
function ShiftsView({ shifts, deleteShift, totalEarnings, totalKm, totalHours }) {
  const sorted = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[[C.accent,"💰","Ingresos",fmt(totalEarnings)],[C.blue,"🛣️","Km",fmtN(totalKm,0)+" km"],[C.green,"🕐","Horas",fmtN(totalHours,1)+"h"]].map(([color,icon,label,val])=>(
          <div key={label} style={{ background: C.card, border: `1px solid ${color}33`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin turnos. ¡Registra tu primer turno!</div>}
      {sorted.map(s => (
        <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{new Date(s.date + "T12:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{s.startTime} – {s.endTime} · {s.platform}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{fmt(s.earnings)}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{s.trips} viajes</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: s.notes ? 8 : 0 }}>
            {[
              { label: "Km recorridos", value: `${s.kmEnd - s.kmStart} km`, color: C.blue },
              { label: "x km", value: fmt(s.earnings / Math.max(1, s.kmEnd - s.kmStart)), color: C.green },
              { label: "x viaje", value: fmt(s.earnings / Math.max(1, s.trips)), color: C.yellow },
            ].map(kpi => (
              <div key={kpi.label} style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          {s.notes && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginBottom: 8 }}>💬 {s.notes}</div>}
          <button onClick={() => deleteShift(s.id)} style={{ fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>🗑 Eliminar</button>
        </div>
      ))}
    </div>
  );
}

// ─── EXPENSES VIEW ────────────────────────────────────────────────────────────
function ExpensesView({ expenses, deleteExpense, totalExpenses }) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }} className="fu">
      <div style={{ background: `linear-gradient(135deg,${C.redDim},${C.card})`, border: `1px solid ${C.red}44`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 3 }}>TOTAL GASTOS DEL MES</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>{fmt(totalExpenses)}</div>
      </div>
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin gastos este mes</div>}
      {sorted.map(exp => {
        const cat = CAR_EXPENSE_CATS.find(c => c.id === exp.category) || { label: exp.category, icon: "📦" };
        return (
          <div key={exp.id} className="hr" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.redDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{cat.label}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{exp.date} · {exp.km ? `${exp.km} km` : ""}{exp.note ? ` · ${exp.note}` : ""}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{fmt(exp.amount)}</div>
              {exp.liters > 0 && <div style={{ fontSize: 10, color: C.textMuted }}>{exp.liters}L · {fmt(exp.amount / exp.liters)}/L</div>}
            </div>
            <button onClick={() => deleteExpense(exp.id)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, opacity: .5 }}>🗑</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── CAR VIEW ─────────────────────────────────────────────────────────────────
function CarView({ car, allExpenses }) {
  const totalFuelExpense = allExpenses.filter(e => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
  const totalLiters = allExpenses.filter(e => e.category === "fuel").reduce((s, e) => s + (e.liters || 0), 0);
  const kmDriven = car.currentKm - car.purchaseKm;
  const depreciation = Math.round(car.purchasePrice * 0.15);
  const kmToOilChange = car.nextOilChange - car.currentKm;
  const kmToRevision  = car.nextRevision  - car.currentKm;

  const maintenances = [
    { label: "Cambio de aceite",    icon: "🛢️", nextKm: car.nextOilChange,   kmLeft: kmToOilChange,  every: 5000 },
    { label: "Revisión técnica",    icon: "🔧", nextKm: car.nextRevision,    kmLeft: kmToRevision,   every: 10000 },
    { label: "Llantas (estimado)",  icon: "🔄", nextKm: car.currentKm+15000, kmLeft: 15000,          every: 40000 },
    { label: "Filtro de aire",      icon: "💨", nextKm: car.currentKm+8000,  kmLeft: 8000,           every: 15000 },
  ];

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {/* CAR CARD */}
      <div style={{ background: `linear-gradient(135deg,${C.accentDim},${C.card})`, border: `1px solid ${C.accent}44`, borderRadius: 20, padding: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚗</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{car.brand} {car.model} {car.year}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Placa {car.plate} · {car.fuelType}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Km actuales",   value: `${car.currentKm.toLocaleString()} km`, color: C.accent },
            { label: "Km recorridos", value: `${kmDriven.toLocaleString()} km`,      color: C.blue },
            { label: "Depreciación",  value: fmt(depreciation)+"/año",               color: C.red },
            { label: "Combustible",   value: totalLiters > 0 ? `${fmtN(totalFuelExpense/totalLiters,0)}/L` : "—", color: C.yellow },
          ].map((item, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAINTENANCE SCHEDULE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🔧 Plan de Mantenimiento</div>
        {maintenances.map((m, i) => {
          const pct = Math.max(0, Math.min(100, 100 - Math.round((m.kmLeft / m.every) * 100)));
          const urgent = m.kmLeft < 1000;
          const warning = m.kmLeft < 2000;
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{m.icon} {m.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: urgent ? C.red : warning ? C.yellow : C.green }}>
                  {m.kmLeft > 0 ? `${m.kmLeft.toLocaleString()} km` : "¡Ya!"}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                <div style={{ height: "100%", borderRadius: 3, background: urgent ? C.red : warning ? C.yellow : C.accent, width: `${pct}%`, transition: "width 1s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Siguiente a los {m.nextKm.toLocaleString()} km</div>
            </div>
          );
        })}
      </div>

      {/* FUEL STATS */}
      {totalLiters > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⛽ Estadísticas de Combustible</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Total gastado", value: fmt(totalFuelExpense), color: C.red },
              { label: "Total litros",  value: `${fmtN(totalLiters, 0)} L`, color: C.yellow },
              { label: "Costo por litro", value: fmt(totalFuelExpense / totalLiters), color: C.accent },
              { label: "Km por litro", value: `${fmtN(kmDriven / totalLiters, 1)} km/L`, color: C.green },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHIFT ROW ────────────────────────────────────────────────────────────────
function ShiftRow({ shift, showDiv }) {
  const km = shift.kmEnd - shift.kmStart;
  return (
    <div className="hr" style={{ padding: "10px 0", borderBottom: showDiv ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🕐</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(shift.date + "T12:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric" })} · {shift.startTime}–{shift.endTime}</div>
        <div style={{ fontSize: 10, color: C.textMuted }}>{shift.platform} · {km} km · {shift.trips} viajes</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{fmt(shift.earnings)}</div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function ShiftModal({ onClose, onAdd, currentKm }) {
  const [form, setForm] = useState({ date: td(), startTime: "06:00", endTime: "14:00", kmStart: currentKm, kmEnd: "", earnings: "", trips: "", platform: "Uber", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const ok = form.earnings && form.kmEnd && form.trips;
  return (
    <ModalWrap title="Nuevo Turno" onClose={onClose}>
      <MF label="Fecha"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp} /></MF>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MF label="Hora inicio"><input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} style={inp} /></MF>
        <MF label="Hora fin"><input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} style={inp} /></MF>
      </div>
      <div style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3 }}>GANANCIAS DEL TURNO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18, color: C.textMuted }}>$</span>
          <input type="number" value={form.earnings} onChange={e => set("earnings", e.target.value)} placeholder="0" style={{ flex: 1, background: "transparent", border: "none", fontSize: 22, fontWeight: 900, color: C.accent }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MF label="Km inicio"><input type="number" value={form.kmStart} onChange={e => set("kmStart", e.target.value)} style={inp} /></MF>
        <MF label="Km fin"><input type="number" value={form.kmEnd} onChange={e => set("kmEnd", e.target.value)} placeholder={String(currentKm + 50)} style={inp} /></MF>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MF label="Número de viajes"><input type="number" value={form.trips} onChange={e => set("trips", e.target.value)} placeholder="0" style={inp} /></MF>
        <MF label="Plataforma">
          <select value={form.platform} onChange={e => set("platform", e.target.value)} style={inp}>
            {["Uber","InDriver","Cabify","Beat","Didi","Otro"].map(p => <option key={p}>{p}</option>)}
          </select>
        </MF>
      </div>
      <MF label="Notas (opcional)"><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observaciones del turno..." style={inp} /></MF>
      {ok && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.textSub }}>
          Km recorridos: <strong style={{ color: C.blue }}>{(parseFloat(form.kmEnd) - parseFloat(form.kmStart)).toFixed(0)} km</strong> ·
          Ganancia/km: <strong style={{ color: C.accent }}> {fmt(parseFloat(form.earnings) / Math.max(1, parseFloat(form.kmEnd) - parseFloat(form.kmStart)))}</strong>
        </div>
      )}
      <button onClick={() => ok && onAdd({ ...form, earnings: parseFloat(form.earnings), kmStart: parseFloat(form.kmStart), kmEnd: parseFloat(form.kmEnd), trips: parseInt(form.trips) })}
        style={{ ...btn, background: ok ? C.accent : C.border, color: ok ? "#000" : C.textMuted }}>Registrar Turno</button>
    </ModalWrap>
  );
}

function ExpenseModal({ onClose, onAdd, currentKm }) {
  const [form, setForm] = useState({ date: td(), category: "fuel", amount: "", km: currentKm, liters: "", note: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isFuel = form.category === "fuel";
  return (
    <ModalWrap title="Gasto del Carro" onClose={onClose}>
      <MF label="Categoría">
        <select value={form.category} onChange={e => set("category", e.target.value)} style={inp}>
          {CAR_EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </MF>
      <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3 }}>MONTO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18, color: C.textMuted }}>$</span>
          <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0" style={{ flex: 1, background: "transparent", border: "none", fontSize: 22, fontWeight: 900, color: C.red }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MF label="Fecha"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp} /></MF>
        <MF label="Km del carro"><input type="number" value={form.km} onChange={e => set("km", e.target.value)} style={inp} /></MF>
      </div>
      {isFuel && <MF label="Litros cargados"><input type="number" value={form.liters} onChange={e => set("liters", e.target.value)} placeholder="0" style={inp} /></MF>}
      {isFuel && form.amount && form.liters && (
        <div style={{ background: C.card, borderRadius: 9, padding: "8px 12px", fontSize: 12, color: C.textSub }}>
          Precio por litro: <strong style={{ color: C.yellow }}>{fmt(parseFloat(form.amount) / parseFloat(form.liters))}</strong>
        </div>
      )}
      <MF label="Nota (opcional)"><input value={form.note} onChange={e => set("note", e.target.value)} placeholder="Ej: Cambio de aceite 5W30" style={inp} /></MF>
      <button onClick={() => form.amount && onAdd({ ...form, amount: parseFloat(form.amount), km: parseInt(form.km), liters: parseFloat(form.liters) || 0 })}
        style={{ ...btn, background: form.amount ? C.red : C.border, color: form.amount ? "#fff" : C.textMuted }}>Registrar Gasto</button>
    </ModalWrap>
  );
}

function ModalWrap({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "16px 16px 32px", maxHeight: "90vh", overflowY: "auto", borderTop: `1px solid ${C.accent}55`, animation: "su .3s ease" }}>
        <div style={{ width: 32, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", color: C.text, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>{children}</div>
      </div>
    </div>
  );
}

function MF({ label, children }) {
  return <div><div style={{ fontSize: 10, color: "#3A3A50", fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>{children}</div>;
}
const inp = { width: "100%", background: "#18181F", border: "1px solid #252530", borderRadius: 9, padding: "9px 11px", color: "#F0F4FF", fontSize: 13 };
const btn = { width: "100%", marginTop: 4, padding: 13, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" };
