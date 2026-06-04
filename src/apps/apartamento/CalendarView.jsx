// apartamento/CalendarView.jsx
import { useState, useEffect } from "react";
import { C, MONTHS, STATUS_CONFIG, fmt, fmtCOP, today } from "./shared.js";

export function CalendarView({reservations,rooms,calMonth,setCalMonth,setModal}) {
  const year=calMonth.getFullYear(),month=calMonth.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:firstDay},()=>null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));
  const todayStr = today();

  const getDayRes=(day)=>{
    const dateStr=(year)+"-"+(String(month+1).padStart(2,"0"))+"-"+(String(day).padStart(2,"0"));
    return reservations.filter(r=>r.checkIn<=dateStr&&r.checkOut>dateStr);
  };

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      {/* NAV MES */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 16px"}}>
        <button onClick={()=>setCalMonth(new Date(year,month-1))} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:20}}>‹</button>
        <span style={{fontWeight:800,fontSize:16}}>{MONTHS[month]} {year}</span>
        <button onClick={()=>setCalMonth(new Date(year,month+1))} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:20}}>›</button>
      </div>

      {/* LEYENDA */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {Object.entries(STATUS_CONFIG).map(([key,sc])=>(
          <div key={key} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textSub}}>
            <div style={{width:10,height:10,borderRadius:2,background:sc.color}}/>{sc.label}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
          {["D","L","M","M","J","V","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.textMuted}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((day,i)=>{
            if(!day)return<div key={i}/>;
            const dateStr=(year)+"-"+(String(month+1).padStart(2,"0"))+"-"+(String(day).padStart(2,"0"));
            const dayRes=getDayRes(day);
            const isToday=dateStr===todayStr;
            const roomColors=dayRes.map(r=>rooms.find(rm=>rm.id===r.roomId)?.color||C.accent).slice(0,3);
            return(
              <div key={i} onClick={()=>dayRes.length>0&&setModal({type:"viewReservation",data:dayRes[0]})}
                style={{aspectRatio:"1",borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,cursor:dayRes.length>0?"pointer":"default",background:isToday?C.accentDim:dayRes.length>0?C.cardHover:"transparent",border:isToday?"1px solid "+(C.accent):"none"}}>
                <span style={{fontSize:12,fontWeight:isToday?800:400,color:isToday?C.accent:C.text}}>{day}</span>
                {roomColors.length>0&&(
                  <div style={{display:"flex",gap:1}}>
                    {roomColors.map((col,ci)=><div key={ci} style={{width:4,height:4,borderRadius:"50%",background:col}}/>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RESERVAS DEL MES */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>RESERVAS DE {MONTHS[month].toUpperCase()}</div>
        {reservations.filter(r=>r.checkIn.startsWith((year)+"-"+(String(month+1).padStart(2,"0")))).length===0&&
          <div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:"1px solid "+(C.border)}}>Sin reservas este mes</div>}
        <div style={{display:"grid",gap:8}}>
          {reservations.filter(r=>r.checkIn.startsWith((year)+"-"+(String(month+1).padStart(2,"0")))).sort((a,b)=>a.checkIn.localeCompare(b.checkIn)).map(res=>{
            const room=rooms.find(r=>r.id===res.roomId);const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
            return(
              <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})} className="hr"
                style={{background:C.card,border:"1px solid "+((room?.color||C.border)+"33"),borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left",width:"100%",color:C.text,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:"100%",minHeight:36,borderRadius:4,background:room?.color||C.accent,flexShrink:0,alignSelf:"stretch"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.guest}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{room?.name} · {res.checkIn} → {res.checkOut}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{fmt(res.total)}</div>
                  <div style={{fontSize:9,color:sc.color}}>{sc.icon} {sc.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
