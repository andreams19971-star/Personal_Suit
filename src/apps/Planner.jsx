import { useState, useEffect } from "react";
import { usePlannerData } from "../hooks/usePlannerData.js";
import { loadSetting, saveSetting } from "../hooks/useSettings.js";
import { supabase } from "../supabase.js";

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

const DEFAULT_TASK_CATS = [
  { id:"work",     label:"Trabajo",    icon:"💼", subs:["Reunión","Entrega","Revisión","Llamada"] },
  { id:"personal", label:"Personal",   icon:"🧍", subs:["Familia","Amigos","Hogar","Trámite"] },
  { id:"health",   label:"Salud",      icon:"🏥", subs:["Médico","Ejercicio","Farmacia","Control"] },
  { id:"finance",  label:"Finanzas",   icon:"💰", subs:["Pago","Ahorro","Presupuesto","Inversión"] },
  { id:"errands",  label:"Diligencias",icon:"📋", subs:["Banco","Mercado","Oficina","Envío"] },
  { id:"other",    label:"Otro",       icon:"📦", subs:[] },
];

export default function Planner({ onBack }) {
  const {
    tasks, goals, notes, loading,
    addTask: dbAddTask, toggleTask: dbToggleTask, setTaskStatus: dbSetStatus, deleteTask: dbDeleteTask, updateTask: dbUpdateTask,
    addGoal: dbAddGoal, updateGoalProgress: dbUpdateGoal, deleteGoal: dbDeleteGoal,
    addNote: dbAddNote, deleteNote: dbDeleteNote,
  } = usePlannerData();

  const [taskCats, setTaskCats] = useState(DEFAULT_TASK_CATS);
  const saveTaskCats = async (cats) => {
    setTaskCats(cats);
    await saveSetting('pl_task_cats', cats);
  };
  useEffect(() => {
    loadSetting('pl_task_cats', DEFAULT_TASK_CATS).then(cats => {
      if (cats && Array.isArray(cats)) setTaskCats(cats);
    });
  }, []);

  // Reservas de apartamento desde Supabase
  const [aptReservations, setAptReservations] = useState([]);
  useEffect(() => {
    supabase.from('apt_reservations').select('*').then(({ data }) => {
      if (data) setAptReservations(data.map(r => ({
        ...r, roomId: r.room_id, checkIn: r.check_in, checkOut: r.check_out,
        roomName: r.room_id,
      })));
    });
  }, []);
  const [calDate, setCalDate]     = useState(new Date());
  const [selDate, setSelDate]     = useState(td());
  const [showTaskModal, setShowTaskModal]   = useState(false);
  const [showGoalModal, setShowGoalModal]   = useState(false);
  const [showNoteModal, setShowNoteModal]   = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editGoal, setEditGoal]   = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (m, t = "ok") => { setToast({ m, t }); setTimeout(() => setToast(null), 2200); };

  const addTask           = (task) => { dbAddTask(task); showToast("Tarea creada ✓"); setShowTaskModal(false); };
  const toggleTask        = (id)   => dbToggleTask(id);
  const setTaskStatus     = (id,s) => dbSetStatus(id,s);
  const deleteTask        = (id)   => { dbDeleteTask(id); showToast("Eliminada","err"); };
  const updateTask        = async (id, updates) => { await dbUpdateTask(id, updates); showToast("Tarea actualizada ✓"); setEditTask(null); };
  const [editTask, setEditTask] = useState(null);
  const addGoal           = (goal) => { dbAddGoal(goal); showToast("Meta creada ✓"); setShowGoalModal(false); };
  const updateGoalProgress= (id,v) => dbUpdateGoal(id,v);
  const deleteGoal        = (id)   => { dbDeleteGoal(id); showToast("Meta eliminada","err"); };
  const addNote           = (note) => { dbAddNote(note); showToast("Nota guardada ✓"); setShowNoteModal(false); };
  const deleteNote        = (id)   => dbDeleteNote(id);

  const [view, setView] = useState("today");
  const todayTasks = tasks.filter(t => t.date === selDate);
  const nav = [
    { id:"today",    icon:"☀️",  label:"Hoy"       },
    { id:"tasks",    icon:"📋",  label:"Tareas"     },
    { id:"calendar", icon:"📅",  label:"Calendario" },
    { id:"goals",    icon:"🎯",  label:"Metas"      },
    { id:"notes",    icon:"📝",  label:"Notas"      },
  ];

  const viewTitle = {
    today:    "☀️ " + new Date(selDate+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"short"}),
    tasks:    "📋 Todas las tareas",
    calendar: "📅 Calendario",
    goals:    "🎯 Metas",
    notes:    "📝 Notas",
  };

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif", background:C.bg, position:"absolute", top:0, left:0, right:0, bottom:0, overflow:"hidden", color:C.text, display:"flex", flexDirection:"column" }}>

      {loading && (
        <div style={{position:"absolute",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:14}}>
          <div style={{width:32,height:32,border:"3px solid "+(C.border),borderTop:"3px solid "+(C.accent),borderRadius:"50%",animation:"pl-spin .8s linear infinite"}}/>
          <div style={{fontSize:14,color:C.textMuted}}>Cargando...</div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:"1px solid "+(C.border),paddingTop:"max(14px,calc(env(safe-area-inset-top) + 8px))",paddingBottom:"14px",paddingLeft:"16px",paddingRight:"16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>← Suite</button>
        <div style={{fontSize:15,fontWeight:800,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{viewTitle[view]||""}</div>
        {(view==="today"||view==="calendar"||view==="tasks") && (
          <button onClick={()=>setShowCatManager(true)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 8px",color:C.textMuted,cursor:"pointer",fontSize:12,flexShrink:0}}>⚙</button>
        )}
        <button onClick={()=>{ if(view==="today"||view==="calendar"||view==="tasks") setShowTaskModal(true); else if(view==="goals") setShowGoalModal(true); else setShowNoteModal(true); }}
          style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>+ Agregar</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:60,minHeight:0,overflowX:"hidden"}}>
        {view==="today"    && <TodayView tasks={todayTasks} allTasks={tasks} selDate={selDate} toggleTask={toggleTask} setTaskStatus={setTaskStatus} deleteTask={deleteTask} taskCats={taskCats} setEditTask={setEditTask}/>}
        {view==="tasks"    && <AllTasksView tasks={tasks} setTaskStatus={setTaskStatus} deleteTask={deleteTask} taskCats={taskCats} setEditTask={setEditTask}/>}
        {view==="calendar" && <CalendarView tasks={tasks} aptReservations={aptReservations} calDate={calDate} setCalDate={setCalDate} selDate={selDate} setSelDate={setSelDate} toggleTask={toggleTask} setTaskStatus={setTaskStatus} deleteTask={deleteTask} setShowTaskModal={setShowTaskModal} taskCats={taskCats} setEditTask={setEditTask}/>}
        {view==="goals"    && <GoalsView goals={goals} updateGoalProgress={updateGoalProgress} deleteGoal={deleteGoal} setEditGoal={setEditGoal} />}
        {view==="notes"    && <NotesView notes={notes} deleteNote={deleteNote} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:"1px solid "+(C.border),display:"flex",zIndex:50,paddingBottom:"max(env(safe-area-inset-bottom), 6px)"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0",border:"none",background:"transparent",color:view===n.id?C.accent:C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {showTaskModal   && <TaskModal   onClose={()=>setShowTaskModal(false)}   onAdd={addTask}  defaultDate={selDate} taskCats={taskCats}/>}
      {editTask        && <EditTaskModal task={editTask} onClose={()=>setEditTask(null)} onSave={updateTask} taskCats={taskCats}/>}
      {showGoalModal   && <GoalModal   onClose={()=>setShowGoalModal(false)}   onAdd={addGoal} />}
      {showNoteModal   && <NoteModal   onClose={()=>setShowNoteModal(false)}   onAdd={addNote} />}
      {showCatManager  && <TaskCatManager taskCats={taskCats} saveTaskCats={saveTaskCats} onClose={()=>setShowCatManager(false)} />}
      {toast && <div style={{position:"fixed",bottom:70,left:"50%",transform:"translateX(-50%)",background:toast.t==="err"?C.red:C.accent,color:toast.t==="err"?"#fff":"#000",padding:"8px 18px",borderRadius:100,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap"}}>{toast.m}</div>}
    </div>
  );
}

// ─── TODAY VIEW ───────────────────────────────────────────────────────────────
function TodayView({ tasks, allTasks, selDate, toggleTask, setTaskStatus, deleteTask, taskCats, setEditTask }) {
  const todayTasks = tasks;
  const done = todayTasks.filter(t=>t.done).length;
  const total = todayTasks.length;
  const pct = total > 0 ? Math.round((done/total)*100) : 0;
  const upcoming = allTasks.filter(t=>t.date>selDate&&!t.done).slice(0,3);
  const overdue  = allTasks.filter(t=>t.date<selDate&&!t.done).slice(0,3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "¡Buenos días! ☀️" : hour < 18 ? "¡Buenas tardes! 🌤" : "¡Buenas noches! 🌙";

  return (
    <div style={{padding:"14px",display:"grid",gap:12,boxSizing:"border-box"}} className="fu">

      {/* GREETING CARD */}
      <div style={{background:"linear-gradient(135deg,"+C.accentDim+","+C.card+")",border:"1px solid "+C.accent+"33",borderRadius:18,padding:16}}>
        <div style={{fontSize:13,color:C.accentText,fontWeight:700,marginBottom:2}}>{greeting}</div>
        {total === 0 ? (
          <div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>Día libre 🎉</div>
            <div style={{fontSize:12,color:C.textMuted}}>No tienes tareas pendientes para hoy</div>
          </div>
        ) : done === total ? (
          <div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>¡Todo listo! 🏆</div>
            <div style={{fontSize:12,color:C.accentText}}>Completaste {total} tareas hoy</div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>{done}/{total} completadas</div>
            <div style={{height:8,borderRadius:4,background:C.border}}>
              <div style={{height:"100%",borderRadius:4,background:C.accent,width:pct+"%",transition:"width .8s ease"}}/>
            </div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{pct}% del día completado</div>
          </div>
        )}
      </div>

      {/* TAREAS DE HOY */}
      {total === 0 ? (
        <div style={{textAlign:"center",padding:"28px 16px",color:C.textMuted,background:C.card,borderRadius:16,border:"1px solid "+C.border}}>
          <div style={{fontSize:36,marginBottom:8}}>📋</div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:C.text}}>Sin tareas para hoy</div>
          <div style={{fontSize:12}}>Toca <strong style={{color:C.accentText}}>+ Agregar</strong> para crear una</div>
        </div>
      ) : (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:C.textMuted}}>HOY · {total} TAREAS</div>
            {done>0&&<div style={{fontSize:11,color:C.accentText,fontWeight:600}}>{done} completadas ✓</div>}
          </div>
          <div style={{display:"grid",gap:6}}>
            {/* Pendientes primero */}
            {todayTasks.filter(t=>!t.done).map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats}/>)}
            {/* Completadas al final */}
            {todayTasks.filter(t=>t.done).map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats}/>)}
          </div>
        </div>
      )}

      {/* VENCIDAS */}
      {overdue.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8}}>⚠️ VENCIDAS ({overdue.length})</div>
          <div style={{display:"grid",gap:6}}>
            {overdue.map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats} accent={C.red}/>)}
          </div>
        </div>
      )}

      {/* PRÓXIMAS */}
      {upcoming.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>PRÓXIMAS ({allTasks.filter(t=>t.date>selDate&&!t.done).length})</div>
          <div style={{display:"grid",gap:6}}>
            {upcoming.map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats} muted/>)}
          </div>
        </div>
      )}
    </div>
  );
}

const TASK_STATUS = {
  pending:     { label:"Pendiente",  color:"#FBBF24", bg:"#231806", icon:"⏳" },
  in_progress: { label:"En proceso", color:"#60A5FA", bg:"#061022", icon:"🔄" },
  done:        { label:"Terminada",  color:"#34D399", bg:"#062318", icon:"✅" },
};

function TaskRow({ task, onToggle, onSetStatus, onDelete, onEdit, taskCats, muted, accent }) {
  const [showStatus, setShowStatus] = useState(false);
  const cat    = taskCats?.find(c=>c.id===task.category)||{icon:"📦",label:task.category};
  const pr     = PRIORITIES.find(p=>p.id===task.priority)||PRIORITIES[1];
  const st     = TASK_STATUS[task.status||"pending"] || TASK_STATUS.pending;
  const color  = accent || pr.color;
  return (
    <div style={{background:C.card,border:"1px solid "+(task.status==="done"?C.border:color+"33"),borderRadius:12,overflow:"hidden",opacity:muted?0.55:1}}>
      <div className="hr" style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setShowStatus(s=>!s)}
          style={{flexShrink:0,padding:"3px 8px",borderRadius:100,border:"1px solid "+st.color+"55",background:st.bg,color:st.color,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          {st.icon} {st.label}
        </button>
        <span style={{fontSize:15,flexShrink:0}}>{cat.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,textDecoration:task.status==="done"?"line-through":"none",color:task.status==="done"?C.textMuted:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
          <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>
            {cat.label}{task.subcategory?" · "+task.subcategory:""}
            {task.date!==new Date().toISOString().slice(0,10)?" · "+task.date:""}
          </div>
        </div>
        {onEdit&&<button onClick={()=>onEdit(task)} style={{background:"none",border:"none",color:C.accentText,cursor:"pointer",fontSize:12,padding:"2px",opacity:.7,flexShrink:0}}>✏️</button>}
        <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:12,opacity:.4,flexShrink:0,padding:"2px"}}>✕</button>
      </div>
      {showStatus&&(
        <div style={{display:"flex",gap:6,padding:"0 12px 10px"}}>
          {Object.entries(TASK_STATUS).map(([key,s])=>(
            <button key={key} onClick={()=>{onSetStatus&&onSetStatus(task.id,key);setShowStatus(false);}}
              style={{flex:1,padding:"6px 4px",borderRadius:8,border:"1px solid "+(task.status===key?s.color:C.border),background:task.status===key?s.bg:"transparent",color:task.status===key?s.color:C.textSub,cursor:"pointer",fontSize:10,fontWeight:700,textAlign:"center"}}>
              {s.icon}<br/>{s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditTaskModal({task, onClose, onSave, taskCats}) {
  const [form, setForm] = useState({
    title:       task.title,
    category:    task.category,
    subcategory: task.subcategory||"",
    priority:    task.priority||"medium",
    date:        task.date,
    note:        task.note||"",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cat = taskCats?.find(c=>c.id===form.category);
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar tarea</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TÍTULO</div>
            <input value={form.title} onChange={e=>set("title",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:14}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>CATEGORÍA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {(taskCats||[]).map(c=>(
                <button key={c.id} onClick={()=>set("category",c.id)}
                  style={{padding:"6px 10px",borderRadius:9,border:"1px solid "+(form.category===c.id?C.accent:C.border),background:form.category===c.id?C.accentDim:"transparent",color:form.category===c.id?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>SUBCATEGORÍA</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>set("subcategory","")} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(!form.subcategory?C.accent:C.border),background:!form.subcategory?C.accentDim:"transparent",color:!form.subcategory?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>Ninguna</button>
                {cat.subs.map(s=>(
                  <button key={s} onClick={()=>set("subcategory",s)}
                    style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(form.subcategory===s?C.accent:C.border),background:form.subcategory===s?C.accentDim:"transparent",color:form.subcategory===s?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>PRIORIDAD</div>
            <div style={{display:"flex",gap:6}}>
              {PRIORITIES.map(p=>(
                <button key={p.id} onClick={()=>set("priority",p.id)}
                  style={{flex:1,padding:"7px",borderRadius:8,border:"1px solid "+(form.priority===p.id?p.color:C.border),background:form.priority===p.id?p.color+"22":"transparent",color:form.priority===p.id?p.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>FECHA</div>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>NOTA</div>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <button onClick={()=>form.title&&onSave(task.id,form)}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:form.title?C.accent:C.border,color:form.title?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function EmptyPlanner({msg,sub}) {
  return (
    <div style={{textAlign:"center",padding:"20px 16px",color:C.textMuted,background:C.card,borderRadius:12,border:"1px solid "+(C.border)}}>
      <div style={{fontSize:14,marginBottom:4}}>{msg}</div>
      {sub&&<div style={{fontSize:11}}>{sub}</div>}
    </div>
  );
}

// ─── ALL TASKS VIEW ───────────────────────────────────────────────────────────
function AllTasksView({ tasks, setTaskStatus, deleteTask, taskCats, setEditTask }) {
  const [filter, setFilter]   = useState("all");   // all | pending | in_progress | done
  const [groupBy, setGroupBy] = useState("status"); // status | category | date

  const filtered = filter === "all" ? tasks : tasks.filter(t => (t.status||"pending") === filter);

  // Group tasks
  const grouped = filtered.reduce((acc, t) => {
    let key;
    if (groupBy === "status")   key = t.status || "pending";
    if (groupBy === "category") key = t.category || "other";
    if (groupBy === "date")     key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const groupLabel = (key) => {
    if (groupBy === "status")   return TASK_STATUS[key] ? TASK_STATUS[key].icon + " " + TASK_STATUS[key].label : key;
    if (groupBy === "category") return (taskCats?.find(c=>c.id===key)?.icon||"📦") + " " + (taskCats?.find(c=>c.id===key)?.label||key);
    if (groupBy === "date") {
      const today = new Date().toISOString().slice(0,10);
      const d = new Date(key+"T12:00");
      if (key === today) return "📅 Hoy";
      if (key < today) return "⚠️ Vencidas — " + d.toLocaleDateString("es-CO",{day:"numeric",month:"short"});
      return "📅 " + d.toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"});
    }
    return key;
  };

  const groupColor = (key) => {
    if (groupBy === "status") return TASK_STATUS[key]?.color || C.textMuted;
    return C.textMuted;
  };

  // Sort group keys
  const sortedKeys = Object.keys(grouped).sort((a,b) => {
    if (groupBy === "status") {
      const order = { pending:0, in_progress:1, done:2 };
      return (order[a]||0) - (order[b]||0);
    }
    if (groupBy === "date") return a.localeCompare(b);
    return a.localeCompare(b);
  });

  return (
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}}>

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {Object.entries(TASK_STATUS).map(([key,s])=>{
          const count = tasks.filter(t=>(t.status||"pending")===key).length;
          return (
            <button key={key} onClick={()=>setFilter(filter===key?"all":key)}
              style={{background:filter===key?s.bg:C.card,border:"1px solid "+(filter===key?s.color:C.border),borderRadius:12,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:18,fontWeight:900,color:s.color}}>{count}</div>
              <div style={{fontSize:9,color:s.color,fontWeight:600,marginTop:1}}>{s.label.toUpperCase()}</div>
            </button>
          );
        })}
      </div>

      {/* AGRUPAR POR */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,color:C.textMuted,fontWeight:600,flexShrink:0}}>Agrupar por:</span>
        <div style={{display:"flex",gap:6,flex:1}}>
          {[["status","Estado"],["category","Categoría"],["date","Fecha"]].map(([val,lbl])=>(
            <button key={val} onClick={()=>setGroupBy(val)}
              style={{flex:1,padding:"5px 4px",borderRadius:8,border:"1px solid "+(groupBy===val?C.accent:C.border),background:groupBy===val?C.accentDim:"transparent",color:groupBy===val?C.accent:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA AGRUPADA */}
      {filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"24px",color:C.textMuted,background:C.card,borderRadius:14,border:"1px solid "+C.border}}>
          <div style={{fontSize:32,marginBottom:8}}>🎉</div>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>Sin tareas {filter!=="all"?"en este estado":""}</div>
        </div>
      ) : (
        sortedKeys.map(key => (
          <div key={key}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700,color:groupColor(key)}}>{groupLabel(key)}</div>
              <div style={{flex:1,height:1,background:C.border}}/>
              <div style={{fontSize:11,color:C.textMuted,fontWeight:600}}>{grouped[key].length}</div>
            </div>
            <div style={{display:"grid",gap:6}}>
              {grouped[key].map(t=>(
                <TaskRow key={t.id} task={t} onToggle={()=>{}} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats}/>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, aptReservations=[], calDate, setCalDate, selDate, setSelDate, toggleTask, setTaskStatus, deleteTask, setShowTaskModal, taskCats, setEditTask }) {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const dayTasks = tasks.filter(t => t.date === selDate);
  const dayApt   = aptReservations.filter(r => r.checkIn <= selDate && r.checkOut > selDate);

  return (
    <div style={{ padding: 14, display: "grid", gap: 14, boxSizing:"border-box" }} className="fu">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: "1px solid "+(C.border), borderRadius: 14, padding: "12px 16px" }}>
        <button onClick={() => setCalDate(new Date(year, month - 1))} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 20 }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[month]} {year}</span>
        <button onClick={() => setCalDate(new Date(year, month + 1))} style={{ background: "none", border: "none", color: C.textSub, cursor: "pointer", fontSize: 20 }}>›</button>
      </div>

      <div style={{ background: C.card, border: "1px solid "+(C.border), borderRadius: 14, padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textMuted }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = (year)+"-"+(String(month + 1).padStart(2, "0"))+"-"+(String(day).padStart(2, "0"));
            const count = tasks.filter(t => t.date === dateStr).length;
            const hasApt = aptReservations.some(r => r.checkIn <= dateStr && r.checkOut > dateStr);
            const isToday = dateStr === td();
            const isSel = dateStr === selDate;
            return (
              <button key={i} onClick={() => setSelDate(dateStr)} style={{ aspectRatio:"1", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, background: isSel ? C.accent : isToday ? C.accentDim : "transparent", color: isSel ? "#000" : isToday ? C.accent : C.text, fontWeight: isSel||isToday ? 700 : 400, fontSize: 13 }}>
                {day}
                <div style={{display:"flex",gap:2}}>
                  {count>0 && <div style={{ width:4, height:4, borderRadius:"50%", background: isSel?"#000":C.accent }}/>}
                  {hasApt  && <div style={{ width:4, height:4, borderRadius:"50%", background: isSel?"#000":"#818CF8"}}/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {new Date(selDate+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})}
        </div>

        {/* Hospedajes del apartamento */}
        {dayApt.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#818CF8",fontWeight:700,marginBottom:6}}>🏠 HOSPEDAJES ACTIVOS</div>
            <div style={{display:"grid",gap:6}}>
              {dayApt.map((r,i)=>(
                <div key={i} style={{background:C.card,border:"1px solid #818CF844",borderRadius:10,padding:"8px 12px",fontSize:12}}>
                  <div style={{fontWeight:700,color:"#818CF8"}}>{r.roomName||r.roomId}</div>
                  <div style={{color:C.textMuted}}>{r.guest} · Hasta el {r.checkOut}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tareas */}
        {dayTasks.length===0&&dayApt.length===0&&<EmptyPlanner msg="Sin actividad este día" sub="Toca + Agregar para crear una tarea"/>}
        {dayTasks.length>0&&(
          <div style={{display:"grid",gap:6}}>
            {dayTasks.map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onSetStatus={setTaskStatus} onDelete={deleteTask} onEdit={setEditTask} taskCats={taskCats}/>)}
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
      <div style={{ background: "linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")", border: "1px solid "+(C.accent)+"33", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 700, marginBottom: 4 }}>RACHA TOTAL HOY</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>{habits.filter(h => h.completions[td()]).length}/{habits.length} hábitos</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>completados hoy</div>
      </div>

      {habits.map(h => {
        const streak = (() => { let s = 0; for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.completions[d.toISOString().slice(0,10)]) s++; else break; } return s; })();
        return (
          <div key={h.id} style={{ background: C.card, border: "1px solid "+(h.color)+"33", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: h.color + "22", border: "1px solid "+(h.color)+"44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: h.color, fontWeight: 600 }}>🔥 {streak} días seguidos</div>
              </div>
              <button onClick={() => toggleHabit(h.id, td())} style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid "+(h.completions[td()] ? h.color : C.border), background: h.completions[td()] ? h.color : "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <div key={g.id} style={{ background: C.card, border: "1px solid "+(g.color)+"33", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: g.color + "22", border: "1px solid "+(g.color)+"44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{g.icon}</div>
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
              <div style={{ height: "100%", borderRadius: 5, background: g.color, width: (pct)+"%", transition: "width 1s ease" }} />
            </div>

            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Nuevo valor actual" style={{ flex: 1, background: C.bg, border: "1px solid "+(C.border), borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13 }} />
                <button onClick={() => { updateGoalProgress(g.id, parseFloat(editVal) || 0); setEditId(null); }} style={{ background: g.color, color: "#000", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>OK</button>
                <button onClick={() => setEditId(null)} style={{ background: C.border, color: C.text, border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(g.id); setEditVal(g.current.toString()); }} style={{ flex: 1, background: g.color + "22", border: "1px solid "+(g.color)+"44", color: g.color, borderRadius: 8, padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>✏️ Actualizar progreso</button>
                <button onClick={() => deleteGoal(g.id)} style={{ background: C.redDim, border: "1px solid "+(C.red)+"33", color: C.red, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>🗑</button>
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
        <div key={n.id} style={{ background: n.color + "15", border: "1px solid "+(n.color)+"33", borderRadius: 14, padding: 14, position: "relative" }}>
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

// ─── MODALS ───────────────────────────────────────────────────────────────────
function TaskModal({ onClose, onAdd, defaultDate, taskCats=DEFAULT_TASK_CATS }) {
  const [form, setForm] = useState({ title:"", category: taskCats[0]?.id||"other", subcategory:"", priority:"medium", date: defaultDate||td(), note:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cat = taskCats.find(c=>c.id===form.category)||taskCats[0];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accent)+"55",animation:"su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>Nueva Tarea</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={lbl2}>TÍTULO</div>
            <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="¿Qué hay que hacer?"
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={lbl2}>CATEGORÍA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {taskCats.map(c=>(
                <button key={c.id} onClick={()=>set("category",c.id)}
                  style={{padding:"6px 10px",borderRadius:9,border:"1px solid "+(form.category===c.id?C.accent:C.border),background:form.category===c.id?C.accentDim:"transparent",color:form.category===c.id?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={lbl2}>SUBCATEGORÍA</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>set("subcategory","")} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(!form.subcategory?C.accent:C.border),background:!form.subcategory?C.accentDim:"transparent",color:!form.subcategory?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>Ninguna</button>
                {cat.subs.map(s=>(
                  <button key={s} onClick={()=>set("subcategory",s)}
                    style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(form.subcategory===s?C.accent:C.border),background:form.subcategory===s?C.accentDim:"transparent",color:form.subcategory===s?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={lbl2}>PRIORIDAD</div>
            <div style={{display:"flex",gap:6}}>
              {PRIORITIES.map(p=>(
                <button key={p.id} onClick={()=>set("priority",p.id)}
                  style={{flex:1,padding:"7px",borderRadius:8,border:"1px solid "+(form.priority===p.id?p.color:C.border),background:form.priority===p.id?p.color+"22":"transparent",color:form.priority===p.id?p.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={lbl2}>FECHA</div>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={lbl2}>NOTA</div>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <button onClick={()=>form.title&&onAdd(form)}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:form.title?C.accent:C.border,color:form.title?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Crear Tarea
        </button>
      </div>
    </div>
  );
}

function TaskCatManager({ taskCats, saveTaskCats, onClose }) {
  const [editIdx, setEditIdx] = useState(null);
  const [newCat,  setNewCat]  = useState(null);
  const [editSub, setEditSub] = useState(null);
  const icons = ["💼","🧍","🏥","💰","📋","📦","🎯","🚗","📚","🎮","🏠","✈️","🌿","⚡","🎵"];

  const addCat = (cat) => { saveTaskCats([...taskCats,{...cat,id:"tc"+Date.now(),subs:[]}]); setNewCat(null); };
  const updateCat = (idx,u) => { saveTaskCats(taskCats.map((c,i)=>i===idx?{...c,...u}:c)); setEditIdx(null); };
  const deleteCat = (idx) => saveTaskCats(taskCats.filter((_,i)=>i!==idx));
  const addSub = (idx,sub) => { saveTaskCats(taskCats.map((c,i)=>i!==idx?c:{...c,subs:[...(c.subs||[]),sub]})); setEditSub(null); };
  const delSub = (idx,si)  => saveTaskCats(taskCats.map((c,i)=>i!==idx?c:{...c,subs:c.subs.filter((_,j)=>j!==si)}));

  return (
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accent)+"55",animation:"su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>⚙ Categorías de tareas</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <button onClick={()=>setNewCat({label:"",icon:"📦"})} style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accent)+"44",color:C.accent,borderRadius:9,padding:9,fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:10}}>+ Nueva categoría</button>
        {newCat&&(
          <div style={{background:C.card,border:"1px solid "+(C.accent)+"44",borderRadius:12,padding:12,marginBottom:10,display:"grid",gap:8}}>
            <input value={newCat.label} onChange={e=>setNewCat(n=>({...n,label:e.target.value}))} placeholder="Nombre"
              style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.text,fontSize:13}}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {icons.map(ic=><button key={ic} onClick={()=>setNewCat(n=>({...n,icon:ic}))} style={{width:30,height:30,borderRadius:7,border:"1px solid "+(newCat.icon===ic?C.accent:C.border),background:newCat.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:15}}>{ic}</button>)}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>newCat.label&&addCat(newCat)} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"7px",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer"}}>Crear</button>
              <button onClick={()=>setNewCat(null)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:12}}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{display:"grid",gap:8}}>
          {taskCats.map((cat,idx)=>(
            <div key={cat.id||idx} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18,flexShrink:0}}>{cat.icon}</span>
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{cat.label}</span>
                <button onClick={()=>setEditIdx(editIdx===idx?null:idx)} style={{background:C.accentDim,color:C.accent,border:"1px solid "+(C.accent)+"33",borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                <button onClick={()=>deleteCat(idx)} style={{background:C.redDim,color:C.red,border:"1px solid "+(C.red)+"33",borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:700,cursor:"pointer"}}>🗑</button>
              </div>
              {editIdx===idx&&(
                <div style={{padding:"0 12px 10px",borderTop:"1px solid "+(C.border),display:"grid",gap:6}}>
                  <input defaultValue={cat.label} onBlur={e=>updateCat(idx,{label:e.target.value})} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"6px 9px",color:C.text,fontSize:12,marginTop:8}}/>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {icons.map(ic=><button key={ic} onClick={()=>updateCat(idx,{icon:ic})} style={{width:27,height:27,borderRadius:6,border:"1px solid "+(cat.icon===ic?C.accent:C.border),background:cat.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:13}}>{ic}</button>)}
                  </div>
                </div>
              )}
              <div style={{padding:"0 12px 10px"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                  {(cat.subs||[]).map((s,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"center",gap:2,background:C.bg,border:"1px solid "+(C.border),borderRadius:100,padding:"2px 7px"}}>
                      <span style={{fontSize:10,color:C.textSub}}>{s}</span>
                      <button onClick={()=>delSub(idx,si)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:10,padding:"0 1px"}}>✕</button>
                    </div>
                  ))}
                  <button onClick={()=>setEditSub(editSub?.idx===idx?null:{idx,val:""})}
                    style={{background:"transparent",border:"1px dashed "+(C.border),borderRadius:100,padding:"2px 7px",fontSize:10,color:C.textMuted,cursor:"pointer"}}>+ sub</button>
                </div>
                {editSub?.idx===idx&&(
                  <div style={{display:"flex",gap:5}}>
                    <input value={editSub.val} onChange={e=>setEditSub(s=>({...s,val:e.target.value}))} placeholder="Nueva subcategoría..."
                      onKeyDown={e=>{if(e.key==="Enter"&&editSub.val)addSub(idx,editSub.val);}}
                      style={{flex:1,background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"4px 8px",color:C.text,fontSize:11}}/>
                    <button onClick={()=>{if(editSub.val)addSub(idx,editSub.val);}} style={{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"4px 9px",fontWeight:700,fontSize:11,cursor:"pointer"}}>OK</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const lbl2 = {fontSize:10,color:"#3A4A62",fontWeight:700,marginBottom:4};

function HabitModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", icon: "💧", color: C.accent, target: 1, unit: "vez" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Nuevo Hábito" onClose={onClose} accent={C.accent}>
      <MF label="Nombre"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: Tomar agua" style={inp} /></MF>
      <MF label="Ícono">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HABIT_ICONS.map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid "+(form.icon === ic ? C.accent : C.border), background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 18 }}>{ic}</button>)}
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
          {["🎯","✈️","📚","⚖️","💰","🏠","🚗","💪","🌎","🎵"].map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid "+(form.icon === ic ? C.accent : C.border), background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 16 }}>{ic}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {colors.map(c => <button key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
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
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "16px 16px 32px", maxHeight: "88vh", overflowY: "auto", borderTop: "1px solid "+(accent)+"55", animation: "su .3s ease" }}>
        <div style={{ width: 32, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.card, border: "1px solid "+(C.border), borderRadius: 6, padding: "4px 8px", color: C.text, cursor: "pointer" }}>✕</button>
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
