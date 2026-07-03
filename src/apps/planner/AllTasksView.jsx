// planner/AllTasksView.jsx
import { useState, useEffect } from "react";
import { C, today, TASK_STATUS } from "./shared.js";
import { TaskRow } from "./TaskRow.jsx";

export function AllTasksView({ tasks, setTaskStatus, deleteTask, taskCats, setEditTask }) {
  const [filter, setFilter]   = useState("all");
  const [groupBy, setGroupBy] = useState("status");

  // Exclude archived from main view unless filter=archived
  const activeTasks   = tasks.filter(t => t.status !== "archived");
  const archivedTasks = tasks.filter(t => t.status === "archived");

  const filtered = filter === "archived" ? archivedTasks
    : filter === "all" ? activeTasks
    : activeTasks.filter(t => (t.status||"pending") === filter);

  // Group tasks — handle empty date
  const grouped = filtered.reduce((acc, t) => {
    let key;
    if (groupBy === "status")   key = t.status || "pending";
    if (groupBy === "category") key = t.category || "other";
    if (groupBy === "date")     key = t.date || "sin_fecha";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const groupLabel = (key) => {
    if (groupBy === "status")   return TASK_STATUS[key] ? TASK_STATUS[key].icon + " " + TASK_STATUS[key].label : key;
    if (groupBy === "category") return (taskCats?.find(c=>c.id===key)?.icon||"📦") + " " + (taskCats?.find(c=>c.id===key)?.label||key);
    if (groupBy === "date") {
      if (key === "sin_fecha") return "📋 Sin fecha";
      const today = new Date().toISOString().slice(0,10);
      if (key === today) return "📅 Hoy";
      if (key < today) return "⚠️ Vencidas — " + key;
      return "📅 " + new Date(key+"T12:00").toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"});
    }
    return key;
  };
  const groupColor = (key) => groupBy === "status" ? (TASK_STATUS[key]?.color || C.textMuted) : C.textMuted;
  const sortedKeys = Object.keys(grouped).sort((a,b) => {
    if (groupBy === "status") { const o={pending:0,in_progress:1,done:2,archived:3}; return (o[a]||0)-(o[b]||0); }
    if (groupBy === "date") { if (a==="sin_fecha") return 1; if (b==="sin_fecha") return -1; return a.localeCompare(b); }
    return a.localeCompare(b);
  });

  return (
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}}>
      {/* STATS — pills incluyendo archivadas */}
      <div className="overflow-guard">
        <div className="hscroll" style={{gap:6,paddingBottom:2}}>
          {[
            {key:"all",     icon:"◎", label:"Todas",    color:C.accentText, bg:C.accentDim, count:activeTasks.length},
            ...Object.entries(TASK_STATUS).filter(([k])=>k!=="archived").map(([k,s])=>({key:k,icon:s.icon,label:s.label,color:s.color,bg:s.bg,count:activeTasks.filter(t=>(t.status||"pending")===k).length})),
            {key:"archived",icon:"📦",label:"Archivadas",color:C.textMuted,  bg:C.card,      count:archivedTasks.length},
          ].map(item=>(
            <button key={item.key} onClick={()=>setFilter(filter===item.key?"all":item.key)}
              style={{background:filter===item.key?item.bg:C.card,border:"1px solid "+(filter===item.key?item.color:C.border),borderRadius:10,padding:"8px 12px",cursor:"pointer",textAlign:"center",minWidth:68}}>
              <div style={{fontSize:14}}>{item.icon}</div>
              <div style={{fontSize:16,fontWeight:800,color:item.color}}>{item.count}</div>
              <div style={{fontSize:8,color:item.color,fontWeight:600,marginTop:1,whiteSpace:"nowrap"}}>{item.label.toUpperCase()}</div>
            </button>
          ))}
        </div>
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
