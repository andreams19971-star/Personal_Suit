// apartamento/DashboardView.jsx
import { useState, useEffect } from "react";
import { C, today, fmtCOP } from "./shared.js";

export function DashboardView({rooms,reservations,expenses,totalExpenses,occupancyRate,getRoomStatus,setModal,updateReservationStatus,showToast}) {
  const today = today();
  const activeRes   = reservations.filter(r=>r.checkIn<=today&&r.checkOut>today);
  const upcomingRes = reservations.filter(r=>r.checkIn>today&&r.status==="reserved").sort((a,b)=>a.checkIn.localeCompare(b.checkIn)).slice(0,3);
  const availableCount = rooms.filter(r=>getRoomStatus(r.id)==="available").length;
  const occupiedCount  = rooms.filter(r=>["occupied","reserved"].includes(getRoomStatus(r.id))).length;

  return (
    <div style={{padding:"14px",display:"grid",gap:12,boxSizing:"border-box",overflowX:"hidden"}} className="ap-fu">

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,"+C.accentDim+","+C.card+")",border:"1px solid "+(C.accent+"33"),borderRadius:18,padding:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:C.accent+"08",pointerEvents:"none"}}/>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:1,marginBottom:6}}>ESTADO DEL APARTAMENTO</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:26,fontWeight:900,letterSpacing:-1,lineHeight:1}}>{occupiedCount}/{rooms.length}</div>
            <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>habitaciones ocupadas</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:900,color:occupancyRate>0?C.accent:C.textMuted}}>{occupancyRate}%</div>
            <div style={{fontSize:11,color:C.textMuted}}>ocupación</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[
            [C.green,  "✅", availableCount+" disponibles"],
            [C.accent, "📅", occupiedCount+" activas"],
            [C.red,    "🔧", fmt(totalExpenses)+" gastos"],
          ].map(([color,icon,val])=>(
            <div key={val} style={{flex:1,background:C.bg+"99",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:14}}>{icon}</div>
              <div style={{fontSize:10,color,fontWeight:700,marginTop:2,lineHeight:1.2}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HABITACIONES */}
      <div style={{fontSize:13,fontWeight:700,marginBottom:-4}}>Estado de habitaciones</div>
      {rooms.map(room=>{
        const status = getRoomStatus(room.id);
        const sc = STATUS_CONFIG[status];
        const active = reservations.find(r=>r.roomId===room.id&&r.checkIn<=today&&r.checkOut>today);
        const next   = reservations.filter(r=>r.roomId===room.id&&r.checkIn>today&&r.status==="reserved").sort((a,b)=>a.checkIn.localeCompare(b.checkIn))[0];
        return (
          <div key={room.id} style={{background:C.card,border:"1px solid "+(room.color+"22"),borderRadius:16,overflow:"hidden"}}>
            {/* Header */}
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:room.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛏️</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800}}>{room.name}</div>
                <div style={{fontSize:10,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{room.description}</div>
              </div>
              <div style={{background:sc.bg,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,color:sc.color,flexShrink:0,whiteSpace:"nowrap"}}>
                {sc.icon} {sc.label}
              </div>
            </div>
            {/* Huésped info */}
            <div style={{padding:"0 14px 12px"}}>
              {active && (
                <div style={{background:C.bg,borderRadius:8,padding:"6px 10px",marginBottom:8,fontSize:12}}>
                  <span style={{fontWeight:700}}>👤 {active.guest}</span>
                  <span style={{color:C.textMuted}}> · sale el {active.checkOut}</span>
                </div>
              )}
              {!active && next && (
                <div style={{background:C.accentDim,borderRadius:8,padding:"6px 10px",marginBottom:8,fontSize:12,color:C.accent}}>
                  📅 Próximo: <strong>{next.guest}</strong> · llega el {next.checkIn}
                </div>
              )}
              {/* Botones de estado */}
              <div style={{display:"flex",gap:5}}>
                {["available","reserved","occupied","cleaning","blocked"].map(s=>(
                  <button key={s} onClick={e=>{
                    e.stopPropagation();
                    const target = active||next;
                    if(target) updateReservationStatus(target.id,s);
                    else showToast("Sin reserva activa","err");
                  }}
                    style={{flex:1,padding:"6px 2px",borderRadius:7,border:"1px solid "+(getRoomStatus(room.id)===s?STATUS_CONFIG[s].color+"66":"transparent"),background:getRoomStatus(room.id)===s?STATUS_CONFIG[s].bg:"transparent",color:STATUS_CONFIG[s].color,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {STATUS_CONFIG[s].icon}
                  </button>
                ))}
                <button onClick={e=>{e.stopPropagation();setModal({type:"newReservation",data:{roomId:room.id}});}}
                  style={{flex:2,padding:"6px",borderRadius:7,border:"1px solid "+(room.color+"33"),background:room.color+"11",color:room.color,cursor:"pointer",fontSize:10,fontWeight:700}}>
                  + Reserva
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* PRÓXIMAS LLEGADAS */}
      {upcomingRes.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>📅 PRÓXIMAS LLEGADAS</div>
          <div style={{display:"grid",gap:6}}>
            {upcomingRes.map(res=>{
              const room=rooms.find(r=>r.id===res.roomId);
              const daysLeft=Math.round((new Date(res.checkIn)-new Date())/86400000);
              return(
                <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})}
                  style={{background:C.card,border:"1px solid "+(room?.color||C.accent)+"22",borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left",width:"100%",color:C.text,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:8,minHeight:36,borderRadius:4,background:room?.color||C.accent,flexShrink:0,alignSelf:"stretch"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.guest}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>{room?.name} · {res.checkIn} → {res.checkOut}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:daysLeft<=1?C.red:daysLeft<=3?C.yellow:C.accent,flexShrink:0}}>
                    {daysLeft===0?"Hoy":daysLeft===1?"Mañana":"en "+daysLeft+"d"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {reservations.length===0&&(
        <div style={{textAlign:"center",padding:"24px 16px",color:C.textMuted,background:C.card,borderRadius:14,border:"1px solid "+C.border}}>
          <div style={{fontSize:32,marginBottom:8}}>🏠</div>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Sin reservas aún</div>
          <div style={{fontSize:12}}>Toca <strong style={{color:C.accent}}>+ Reserva</strong> para agregar</div>
        </div>
      )}
    </div>
  );
}
