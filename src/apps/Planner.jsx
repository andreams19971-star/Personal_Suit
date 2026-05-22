import { useState, useEffect } from "react";
import { usePlannerData } from "../hooks/usePlannerData.js";

const C = {
  bg: "#080C14", surface: "#0F1624", card: "#141E30", cardHover: "#192338",
  border: "#1E2D45", accent: "#60A5FA", accentDim: "#0A1A35", accentText: "#60A5FA",
  green: "#34D399", greenDim: "#0A2A1E", red: "#F87171", redDim: "#2A0F0F",
  yellow: "#FBBF24", purple: "#A78BFA", pink: "#F472B6",
  text: "#F0F4FF", textSub: "#8899BB", textMuted: "#3A4A62",
};

const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const td = () => new Date().toISOString().slice(0, 10);

const HABIT_ICONS = ["💧","🏃","📚","🧘","🥗","😴","💪","🚭","🙏","✍️","🎯","🌿"];
const PRIORITIES = [
  { id: "high",   label: "Alta",   color: "#F87171" },
  { id: "medium", label: "Media",  color: "#FBBF24" },
  { id: "low",    label: "Baja",   color: "#34D399" },
];
const TASK_CATS = [
  { id: "work",     label: "Trabajo",   icon: "💼" },
  { id: "personal", label: "Personal",  icon: "🧍" },
  { id: "health",   label: "Salud",     icon: "🏥" },
  { id: "finance",  label: "Finanzas",  icon: "💰" },
  { id: "errands",  label: "Diligencias",icon: "📋" },
  { id: "other",    label: "Otro",      icon: "📦" },
];

function seedData() {
  const now = new Date();
  const d = (days) => { const x = new Date(now); x.setDate(x.getDate() + days); return x.toISOString().slice(0,10); };
  return {
    tasks: [
      { id: "T1", title: "Revisar extracto bancario", category: "finance", priority: "high", date: td(), done: false, note: "" },
      { id: "T2", title: "Ir al médico control", category: "health", priority: "medium", date: td(), done: false, note: "Cita 3pm" },
      { id: "T3", title: "Llamar al seguro del carro", category: "errands", priority: "medium", date: d(1), done: false, note: "" },
      { id: "T4", title: "Completar informe semanal", category: "work", priority: "high", date: d(1), done: false, note: "" },
      { id: "T5", title: "Comprar mercado", category: "personal", priority: "low", date: d(2), done: false, note: "" },
      { id: "T6", title: "Pagar servicios", category: "finance", priority: "high", date: d(3), done: false, note: "" },
    ],
    habits: [
      { id: "H1", name: "Tomar agua", icon: "💧", target: 8, unit: "vasos", color: C.accent, completions: {} },
      { id: "H2", name: "Ejercicio", icon: "🏃", target: 1, unit: "sesión", color: C.green, completions: {} },
      { id: "H3", name: "Leer", icon: "📚", target: 30, unit: "minutos", color: C.purple, completions: {} },
      { id: "H4", name: "Meditar", icon: "🧘", target: 1, unit: "sesión", color: C.yellow, completions: {} },
    ],
    goals: [
      { id: "G1", title: "Ahorrar para viaje", icon: "✈️", target: 5000000, current: 1200000, deadline: d(120), color: C.accent, category: "finance" },
      { id: "G2", title: "Leer 12 libros", icon: "📚", target: 12, current: 3, deadline: d(240), color: C.purple, category: "personal" },
      { id: "G3", title: "Bajar 8 kg", icon: "⚖️", target: 8, current: 2, deadline: d(90), color: C.green, category: "health" },
    ],
    notes: [
      { id: "N1", title: "Ideas de negocio", content: "App de delivery para mascotas, consultoría de finanzas...", color: C.yellow, date: td() },
      { id: "N2", title: "Lista mercado", content: "Arroz, fríjoles, aceite, pollo, verduras, frutas", color: C.green, date: td() },
    ],
  };
}

export default function Planner({ onBack }) {
  const {
    tasks, habits, goals, notes, loading,
    addTask: dbAddTask, toggleTask: dbToggleTask, deleteTask: dbDeleteTask,
    addHabit: dbAddHabit, toggleHabit: dbToggleHabit, deleteHabit: dbDeleteHabit,
    addGoal: dbAddGoal, updateGoalProgress: dbUpdateGoal, deleteGoal: dbDeleteGoal,
    addNote: dbAddNote, deleteNote: dbDeleteNote,
  } = usePlannerData();

  const [view, setView] = useState("today");
  const [calDate, setCalDate] = useState(new Date());
  const [selDate, setSelDate] = useState(td());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2200); };

  const toggleTask        = (id)        => dbToggleTask(id);
  const deleteTask        = (id)        => { dbDeleteTask(id); showToast("Tarea eliminada", "err"); };
  const addTask           = (task)      => { dbAddTask(task); showToast("Tarea creada ✓"); setShowTaskModal(false); };
  const toggleHabit       = (hId, date) => dbToggleHabit(hId, date);
  const addHabit          = (habit)     => { dbAddHabit(habit); showToast("Hábito creado ✓"); setShowHabitModal(false); };
  const deleteHabit       = (id)        => dbDeleteHabit(id);
  const addGoal           = (goal)      => { dbAddGoal(goal); showToast("Meta creada ✓"); setShowGoalModal(false); };
  const updateGoalProgress= (id, val)   => dbUpdateGoal(id, val);
  const deleteGoal        = (id)        => { dbDeleteGoal(id); showToast("Meta eliminada", "err"); };
  const addNote           = (note)      => { dbAddNote(note); showToast("Nota guardada ✓"); setShowNoteModal(false); };
  const deleteNote        = (id)        => dbDeleteNote(id);

  const todayTasks = tasks.filter(t => t.date === selDate);
  const doneTodayCount = todayTasks.filter(t => t.done).length;
  const nav = [
    { id: "today",    icon: "☀️", label: "Hoy" },
    { id: "calendar", icon: "📅", label: "Calendario" },
    { id: "habits",   icon: "🔁", label: "Hábitos" },
    { id: "goals",    icon: "🎯", label: "Metas" },
    { id: "notes",    icon: "📝", label: "Notas" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", background: C.bg, height: "100dvh", maxHeight: "100dvh", color: C.text, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,select,textarea{outline:none;font-family:inherit}
        ::-webkit-scrollbar{width:0}
        @keyframes su{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pl-spin{to{transform:rotate(360deg)}}
        .fu{animation:fu .3s ease both}.bp:active{transform:scale(.96)}.hr:hover{background:${C.cardHover}!important}
      `}</style>

      {loading && (
        <div style={{position:"absolute",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:14}}>
          <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"pl-spin .8s linear infinite"}}/>
          <div style={{fontSize:14,color:C.textMuted}}>Cargando...</div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.textSub, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Suite</button>
        <div style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>
          {view === "today" ? `📅 ${new Date(selDate + "T12:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}` :
           view === "calendar" ? "📅 Calendario" :
           view === "habits" ? "🔁 Hábitos" :
           view === "goals" ? "🎯 Metas" : "📝 Notas"}
        </div>
        <button
          onClick={() => { if(view==="today"||view==="calendar") setShowTaskModal(true); else if(view==="habits") setShowHabitModal(true); else if(view==="goals") setShowGoalModal(true); else setShowNoteModal(true); }}
          style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Agregar</button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 60, minHeight: 0 }}>
        {view === "today"    && <TodayView tasks={todayTasks} allTasks={tasks} habits={habits} selDate={selDate} toggleTask={toggleTask} deleteTask={deleteTask} toggleHabit={toggleHabit} doneTodayCount={doneTodayCount} />}
        {view === "calendar" && <CalendarView tasks={tasks} calDate={calDate} setCalDate={setCalDate} selDate={selDate} setSelDate={setSelDate} toggleTask={toggleTask} deleteTask={deleteTask} setShowTaskModal={setShowTaskModal} />}
        {view === "habits"   && <HabitsView habits={habits} toggleHabit={toggleHabit} deleteHabit={deleteHabit} />}
        {view === "goals"    && <GoalsView goals={goals} updateGoalProgress={updateGoalProgress} deleteGoal={deleteGoal} setEditGoal={setEditGoal} />}
        {view === "notes"    && <NotesView notes={notes} deleteNote={deleteNote} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0", border: "none", background: "transparent", color: view === n.id ? C.accent : C.textMuted, cursor: "pointer", fontSize: 9, fontWeight: 600 }}>
            <span style={{ fontSize: 17 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} onAdd={addTask} defaultDate={selDate} />}
      {showHabitModal && <HabitModal onClose={() => setShowHabitModal(false)} onAdd={addHabit} />}
      {showGoalModal && <GoalModal onClose={() => setShowGoalModal(false)} onAdd={addGoal} />}
      {showNoteModal && <NoteModal onClose={() => setShowNoteModal(false)} onAdd={addNote} />}
      {toast && <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: toast.t === "err" ? C.red : C.accent, color: toast.t === "err" ? "#fff" : "#000", padding: "8px 18px", borderRadius: 100, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>{toast.m}</div>}
    </div>
  );
}

// ─── TODAY VIEW ───────────────────────────────────────────────────────────────
function TodayView({ tasks, allTasks, habits, selDate, toggleTask, deleteTask, toggleHabit, doneTodayCount }) {
  const total = tasks.length;
  const pct = total > 0 ? Math.round((doneTodayCount / total) * 100) : 0;
  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {/* PROGRESS */}
      <div style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.card})`, border: `1px solid ${C.accent}33`, borderRadius: 18, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div><div style={{ fontSize: 11, color: C.accentText, fontWeight: 700 }}>PROGRESO DEL DÍA</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{doneTodayCount}/{total} tareas</div></div>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.accentDim, border: `3px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: C.accent }}>{pct}%</div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: C.border }}>
          <div style={{ height: "100%", borderRadius: 3, background: C.accent, width: `${pct}%`, transition: "width .8s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
          {pct === 100 ? "🎉 ¡Día completado! Excelente trabajo" : pct >= 50 ? "💪 Vas muy bien, sigue así" : "🚀 ¡Vamos, tú puedes!"}
        </div>
      </div>

      {/* HABITS QUICK */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Hábitos de hoy</div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
          {habits.map(h => {
            const done = h.completions[selDate];
            return (
              <button key={h.id} onClick={() => toggleHabit(h.id, selDate)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 12px", borderRadius: 12, border: `1px solid ${done ? h.color + "66" : C.border}`, background: done ? h.color + "22" : "transparent", cursor: "pointer", flexShrink: 0, minWidth: 70 }}>
                <span style={{ fontSize: 22 }}>{h.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: done ? h.color : C.textMuted }}>{h.name}</span>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? h.color : "transparent", border: `2px solid ${done ? h.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{done ? "✓" : ""}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PENDING TASKS */}
      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>PENDIENTES ({pending.length})</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {pending.map((t, i) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} showDiv={i < pending.length - 1} />)}
          </div>
        </div>
      )}

      {/* DONE TASKS */}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>COMPLETADAS ({done.length})</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", opacity: .7 }}>
            {done.map((t, i) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} showDiv={i < done.length - 1} />)}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", color: C.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌟</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Día libre</div>
          <div style={{ fontSize: 13 }}>No tienes tareas para hoy</div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, calDate, setCalDate, selDate, setSelDate, toggleTask, deleteTask }) {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const dayTasks = tasks.filter(t => t.date === selDate);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {/* MONTH NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px" }}>
        <button onClick={() => setCalDate(new Date(year, month - 1))} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 20 }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setCalDate(new Date(year, month + 1))} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 20 }}>›</button>
      </div>

      {/* CALENDAR GRID */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textMuted }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTaskCount = tasks.filter(t => t.date === dateStr).length;
            const isToday = dateStr === td();
            const isSel = dateStr === selDate;
            return (
              <button key={i} onClick={() => setSelDate(dateStr)} style={{ aspectRatio: "1", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: isSel ? C.accent : isToday ? C.accentDim : "transparent", color: isSel ? "#000" : isToday ? C.accent : C.text, fontWeight: isSel || isToday ? 700 : 400, fontSize: 13 }}>
                {day}
                {dayTaskCount > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "#000" : C.accent }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY TASKS */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {new Date(selDate + "T12:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} · {dayTasks.length} tarea{dayTasks.length !== 1 ? "s" : ""}
        </div>
        {dayTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: C.textMuted, fontSize: 13, background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}>Sin tareas este día</div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {dayTasks.map((t, i) => <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} showDiv={i < dayTasks.length - 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HABITS VIEW ──────────────────────────────────────────────────────────────
function HabitsView({ habits, toggleHabit, deleteHabit }) {
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      <div style={{ background: `linear-gradient(135deg,${C.accentDim},${C.card})`, border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 700, marginBottom: 4 }}>RACHA TOTAL HOY</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>{habits.filter(h => h.completions[td()]).length}/{habits.length} hábitos</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>completados hoy</div>
      </div>

      {habits.map(h => {
        const streak = (() => { let s = 0; for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.completions[d.toISOString().slice(0,10)]) s++; else break; } return s; })();
        return (
          <div key={h.id} style={{ background: C.card, border: `1px solid ${h.color}33`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: h.color + "22", border: `1px solid ${h.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: h.color, fontWeight: 600 }}>🔥 {streak} días seguidos</div>
              </div>
              <button onClick={() => toggleHabit(h.id, td())} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${h.completions[td()] ? h.color : C.border}`, background: h.completions[td()] ? h.color : "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {h.completions[td()] ? "✓" : ""}
              </button>
            </div>
            {/* LAST 7 DAYS */}
            <div style={{ display: "flex", gap: 4 }}>
              {last7.map((date, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, background: h.completions[date] ? h.color : C.border, cursor: "pointer" }} onClick={() => toggleHabit(h.id, date)} />
                  <span style={{ fontSize: 8, color: C.textMuted }}>{DAYS[new Date(date + "T12:00").getDay()][0]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => deleteHabit(h.id)} style={{ marginTop: 10, fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>🗑 Eliminar hábito</button>
          </div>
        );
      })}
      {habits.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin hábitos. ¡Crea tu primer hábito!</div>}
    </div>
  );
}

// ─── GOALS VIEW ───────────────────────────────────────────────────────────────
function GoalsView({ goals, updateGoalProgress, deleteGoal }) {
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const daysLeft = Math.max(0, Math.round((new Date(g.deadline) - new Date()) / 86400000));
        const isEditing = editId === g.id;
        return (
          <div key={g.id} style={{ background: C.card, border: `1px solid ${g.color}33`, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: g.color + "22", border: `1px solid ${g.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{daysLeft} días restantes · vence {new Date(g.deadline + "T12:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: g.color }}>{pct}%</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>completado</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: C.textMuted }}>Progreso actual</span>
              <span style={{ fontWeight: 700 }}>{g.current} / {g.target}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: C.border, marginBottom: 12 }}>
              <div style={{ height: "100%", borderRadius: 5, background: g.color, width: `${pct}%`, transition: "width 1s ease" }} />
            </div>

            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Nuevo valor actual" style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13 }} />
                <button onClick={() => { updateGoalProgress(g.id, parseFloat(editVal) || 0); setEditId(null); }} style={{ background: g.color, color: "#000", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>OK</button>
                <button onClick={() => setEditId(null)} style={{ background: C.border, color: C.text, border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(g.id); setEditVal(g.current.toString()); }} style={{ flex: 1, background: g.color + "22", border: `1px solid ${g.color}44`, color: g.color, borderRadius: 8, padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>✏️ Actualizar progreso</button>
                <button onClick={() => deleteGoal(g.id)} style={{ background: C.redDim, border: `1px solid ${C.red}33`, color: C.red, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>🗑</button>
              </div>
            )}
          </div>
        );
      })}
      {goals.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin metas. ¡Define tu primer objetivo!</div>}
    </div>
  );
}

// ─── NOTES VIEW ───────────────────────────────────────────────────────────────
function NotesView({ notes, deleteNote }) {
  const colors = [C.yellow, C.green, C.accent, C.purple, C.pink];
  return (
    <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="fu">
      {notes.map(n => (
        <div key={n.id} style={{ background: n.color + "15", border: `1px solid ${n.color}33`, borderRadius: 14, padding: 14, position: "relative" }}>
          <button onClick={() => deleteNote(n.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, opacity: .6 }}>✕</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: n.color, marginBottom: 6, paddingRight: 20 }}>{n.title}</div>
          <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{n.content}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10 }}>{n.date}</div>
        </div>
      ))}
      {notes.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin notas</div>}
    </div>
  );
}

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete, showDiv }) {
  const pr = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[1];
  const cat = TASK_CATS.find(c => c.id === task.category) || TASK_CATS[5];
  return (
    <div className="hr" style={{ padding: "12px 14px", borderBottom: showDiv ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={onToggle} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${task.done ? C.green : pr.color}`, background: task.done ? C.green : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: "#000" }}>
        {task.done ? "✓" : ""}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, textDecoration: task.done ? "line-through" : "none", color: task.done ? C.textMuted : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
        <div style={{ fontSize: 10, color: C.textMuted }}>{cat.icon} {cat.label} · <span style={{ color: pr.color }}>● {pr.label}</span>{task.note ? ` · ${task.note}` : ""}</div>
      </div>
      <button onClick={onDelete} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, opacity: .5 }}>🗑</button>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function TaskModal({ onClose, onAdd, defaultDate }) {
  const [form, setForm] = useState({ title: "", category: "personal", priority: "medium", date: defaultDate || td(), note: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Nueva Tarea" onClose={onClose} accent={C.accent}>
      <MF label="Título"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="¿Qué necesitas hacer?" style={inp} /></MF>
      <MF label="Categoría">
        <select value={form.category} onChange={e => set("category", e.target.value)} style={inp}>
          {TASK_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </MF>
      <MF label="Prioridad">
        <div style={{ display: "flex", gap: 8 }}>
          {PRIORITIES.map(p => <button key={p.id} onClick={() => set("priority", p.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${form.priority === p.id ? p.color : C.border}`, background: form.priority === p.id ? p.color + "22" : "transparent", color: form.priority === p.id ? p.color : C.textSub, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{p.label}</button>)}
        </div>
      </MF>
      <MF label="Fecha"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp} /></MF>
      <MF label="Nota (opcional)"><input value={form.note} onChange={e => set("note", e.target.value)} placeholder="Detalles..." style={inp} /></MF>
      <button onClick={() => form.title && onAdd(form)} style={{ ...btn, background: form.title ? C.accent : C.border, color: form.title ? "#000" : C.textMuted }}>Crear Tarea</button>
    </Modal>
  );
}

function HabitModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", icon: "💧", color: C.accent, target: 1, unit: "vez" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Nuevo Hábito" onClose={onClose} accent={C.accent}>
      <MF label="Nombre"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: Tomar agua" style={inp} /></MF>
      <MF label="Ícono">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HABIT_ICONS.map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${form.icon === ic ? C.accent : C.border}`, background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 18 }}>{ic}</button>)}
        </div>
      </MF>
      <MF label="Meta diaria">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={form.target} onChange={e => set("target", parseInt(e.target.value) || 1)} style={{ ...inp, width: 80 }} />
          <input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="vez/es, vasos..." style={{ ...inp, flex: 1 }} />
        </div>
      </MF>
      <button onClick={() => form.name && onAdd(form)} style={{ ...btn, background: form.name ? C.accent : C.border, color: form.name ? "#000" : C.textMuted }}>Crear Hábito</button>
    </Modal>
  );
}

function GoalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", icon: "🎯", target: "", current: 0, deadline: "", color: C.accent, category: "personal" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const colors = [C.accent, C.green, C.yellow, C.purple, C.pink, "#F87171"];
  const ok = form.title && form.target && form.deadline;
  return (
    <Modal title="Nueva Meta" onClose={onClose} accent={C.accent}>
      <MF label="Título"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ej: Ahorrar para viaje" style={inp} /></MF>
      <MF label="Ícono & Color">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {["🎯","✈️","📚","⚖️","💰","🏠","🚗","💪","🌎","🎵"].map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${form.icon === ic ? C.accent : C.border}`, background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 16 }}>{ic}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {colors.map(c => <button key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? `3px solid #fff` : "2px solid transparent", cursor: "pointer" }} />)}
        </div>
      </MF>
      <MF label="Meta total"><input type="number" value={form.target} onChange={e => set("target", e.target.value)} placeholder="Ej: 5000000" style={inp} /></MF>
      <MF label="Progreso actual"><input type="number" value={form.current} onChange={e => set("current", e.target.value)} placeholder="0" style={inp} /></MF>
      <MF label="Fecha límite"><input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} style={inp} /></MF>
      <button onClick={() => ok && onAdd({ ...form, target: parseFloat(form.target), current: parseFloat(form.current) || 0 })} style={{ ...btn, background: ok ? C.accent : C.border, color: ok ? "#000" : C.textMuted }}>Crear Meta</button>
    </Modal>
  );
}

function NoteModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", content: "", color: C.yellow });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const colors = [C.yellow, C.green, C.accent, C.purple, "#F472B6"];
  return (
    <Modal title="Nueva Nota" onClose={onClose} accent={C.yellow}>
      <MF label="Título"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Título de la nota" style={inp} /></MF>
      <MF label="Contenido"><textarea value={form.content} onChange={e => set("content", e.target.value)} placeholder="Escribe aquí..." rows={4} style={{ ...inp, resize: "none" }} /></MF>
      <MF label="Color">
        <div style={{ display: "flex", gap: 10 }}>
          {colors.map(c => <button key={c} onClick={() => set("color", c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
        </div>
      </MF>
      <button onClick={() => form.title && onAdd(form)} style={{ ...btn, background: form.title ? form.color : C.border, color: form.title ? "#000" : C.textMuted }}>Guardar Nota</button>
    </Modal>
  );
}

function Modal({ title, onClose, accent, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "16px 16px 32px", maxHeight: "88vh", overflowY: "auto", borderTop: `1px solid ${accent}55`, animation: "su .3s ease" }}>
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
  return <div><div style={{ fontSize: 10, color: "#3A4A62", fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>{children}</div>;
}
const inp = { width: "100%", background: "#141E30", border: "1px solid #1E2D45", borderRadius: 9, padding: "9px 11px", color: "#F0F4FF", fontSize: 13 };
const btn = { width: "100%", marginTop: 6, padding: 13, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" };
