// planner/TodayView.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";
import { TaskRow } from "./TaskRow.jsx";

export function TodayView({ tasks, allTasks, selDate, toggleTask, setTaskStatus, deleteTask, taskCats, setEditTask }) {
  const todayTasks = tasks;
  const done  = todayTasks.filter(t=>t.done).length;
  const total = todayTasks.length;
  const pct   = total > 0 ? Math.round((done/total)*100) : 0;
  const upcoming = allTasks.filter(t=>t.date>selDate&&!t.done).slice(0,3);
  const overdue  = allTasks.filter(t=>t.date<selDate&&!t.done).slice(0,3);

  // Estadísticas de productividad
  const totalTasks   = allTasks.length;
  const doneTasks    = allTasks.filter(t=>t.done).length;
  const inProgTasks  = allTasks.filter(t=>t.status==="in_progress").length;
  const overdueTasks = allTasks.filter(t=>t.date<selDate&&!t.done).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0;

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

      {/* PRODUCTIVIDAD GLOBAL */}
      {totalTasks > 0 && (
        <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:10}}>PRODUCTIVIDAD GENERAL</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[
              {label:"Total",    val:totalTasks,      color:C.textSub},
              {label:"Hechas",   val:doneTasks,        color:C.green},
              {label:"En curso", val:inProgTasks,      color:C.blue},
              {label:"Vencidas", val:overdueTasks,     color:overdueTasks>0?C.red:C.textMuted},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center",background:C.bg,borderRadius:8,padding:"8px 4px"}}>
                <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9,color:C.textMuted,marginTop:2}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
              <span style={{color:C.textMuted}}>Tasa de completado</span>
              <span style={{color:completionRate>=70?C.green:completionRate>=40?C.yellow:C.red,fontWeight:700}}>{completionRate}%</span>
            </div>
            <div style={{height:4,borderRadius:2,background:C.border}}>
              <div style={{height:"100%",borderRadius:2,width:completionRate+"%",background:completionRate>=70?C.green:completionRate>=40?C.yellow:C.red,transition:"width .8s"}}/>
            </div>
          </div>
        </div>
      )}

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
