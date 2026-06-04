import { useState, useEffect, useContext } from 'react';
import { usePlannerData } from '../hooks/usePlannerData.js';
import { AuthContext } from '../hooks/useAuth.js';
import { loadSetting, saveSetting } from '../hooks/useSettings.js';
import { supabase } from '../supabase.js';
import { showLocalNotification, requestPermission } from '../hooks/useNotifications.js';
import { C, today } from './planner/shared.js';
import { TodayView } from './planner/TodayView.jsx';
import { TaskRow } from './planner/TaskRow.jsx';
import { EditTaskModal } from './planner/EditTaskModal.jsx';
import { AllTasksView } from './planner/AllTasksView.jsx';
import { CalendarView } from './planner/CalendarView.jsx';
import { HabitsView } from './planner/HabitsView.jsx';
import { GoalsView } from './planner/GoalsView.jsx';
import { NotesView } from './planner/NotesView.jsx';
import { TaskModal, TaskCatManager, HabitModal, GoalModal, NoteModal, Modal, MF } from './planner/Modals.jsx';

function _getUser() { try { const a=useContext(AuthContext); return a?.user?.id; } catch{} return null; }
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

  // Recordatorios automáticos — notificar tareas del día y de mañana
  useEffect(() => {
    if (!tasks.length) return;
    requestPermission().then(perm => {
      if (perm !== "granted") return;
      const today    = today();
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
      const tmrStr   = tomorrow.toISOString().slice(0,10);
      const todayTasks = tasks.filter(t=>t.date===today&&(t.status==="pending"||t.status==="in_progress"));
      const tmrTasks   = tasks.filter(t=>t.date===tmrStr&&t.status==="pending");
      if (todayTasks.length > 0) {
        showLocalNotification(
          "📋 Tienes "+todayTasks.length+" tarea"+(todayTasks.length>1?"s":"")+" para hoy",
          todayTasks.slice(0,3).map(t=>t.title).join(", "),
          { tag:"planner-today" }
        );
      }
      if (tmrTasks.length > 0) {
        showLocalNotification(
          "⏰ Mañana tienes "+tmrTasks.length+" tarea"+(tmrTasks.length>1?"s":""),
          tmrTasks.slice(0,2).map(t=>t.title).join(", "),
          { tag:"planner-tomorrow" }
        );
      }
    });
  }, [tasks.length]);

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
  const [selDate, setSelDate]     = useState(today());
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
        <button onClick={onBack} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:500,flexShrink:0,padding:0}}>← Suite</button>
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
