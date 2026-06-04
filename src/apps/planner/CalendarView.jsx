// planner/CalendarView.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function CalendarView({ tasks, aptReservations=[], calDate, setCalDate, selDate, setSelDate, toggleTask, setTaskStatus, deleteTask, setShowTaskModal, taskCats, setEditTask }) {
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
