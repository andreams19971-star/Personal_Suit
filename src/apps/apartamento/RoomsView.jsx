// apartamento/RoomsView.jsx
import { useState, useEffect } from "react";
import { C, STATUS_CONFIG, fmt, fmtCOP, today } from "./shared.js";

export function RoomsView({rooms,reservations,getRoomStatus,setModal,updateReservationStatus,deleteReservation}) {
  const [selRoom, setSelRoom] = useState(rooms[0]?.id);
  const room = rooms.find(r=>r.id===selRoom)||rooms[0];
  const roomRes = reservations.filter(r=>r.roomId===selRoom).sort((a,b)=>b.checkIn.localeCompare(a.checkIn));
  const today = today();

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      <div className="overflow-guard">
        <div className="hscroll-edge" style={{gap:8,paddingBottom:2}}>
          {rooms.map(r=>{
            const status=getRoomStatus(r.id);const sc=STATUS_CONFIG[status];
            return(
              <button key={r.id} onClick={()=>setSelRoom(r.id)} style={{padding:"9px 14px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:12,background:selRoom===r.id?r.color+"22":C.card,border:"1px solid "+(selRoom===r.id?r.color:C.border),color:selRoom===r.id?r.color:C.textSub,display:"flex",alignItems:"center",gap:6}}>
                <span>{sc.icon}</span>{r.name}
              </button>
            );
          })}
        </div>
      </div>

      {room && (
        <div style={{background:"linear-gradient(135deg,"+(room.color)+"11,"+(C.card)+")",border:"1px solid "+((room.color)+"44"),borderRadius:18,padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:48,height:48,borderRadius:14,background:room.color+"22",border:"1px solid "+((room.color)+"44"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🛏️</div>
            <div style={{flex:1}}>
              <div style={{fontSize:17,fontWeight:800}}>{room.name}</div>
              <div style={{fontSize:12,color:C.textMuted}}>{room.description}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {(room.amenities||[]).map(a=>(
              <span key={a} style={{background:room.color+"22",color:room.color,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:600}}>✓ {a}</span>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:room.color}}>{fmt(room.basePrice)}<span style={{fontSize:11,color:C.textMuted,fontWeight:400}}>/noche</span></div>
            <button onClick={()=>setModal({type:"newReservation",data:{roomId:room.id}})}
              style={{background:room.color,color:"#000",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              + Nueva reserva
            </button>
          </div>
        </div>
      )}

      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>HISTORIAL DE RESERVAS ({roomRes.length})</div>
        {roomRes.length===0&&<div style={{textAlign:"center",padding:20,color:C.textMuted,fontSize:13,background:C.card,borderRadius:12,border:"1px solid "+(C.border)}}>📭 Sin reservas</div>}
        <div style={{display:"grid",gap:8}}>
          {roomRes.map(res=>{
            const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
            const isPast=res.checkOut<today;
            return(
              <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})} className="hr"
                style={{background:C.card,border:"1px solid "+((sc.color)+"33"),borderRadius:14,padding:14,cursor:"pointer",textAlign:"left",width:"100%",color:C.text,opacity:isPast?.7:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.guest}</div>
                    <div style={{fontSize:11,color:C.textMuted}}>{res.checkIn} → {res.checkOut} · {res.nights} noches · {res.platform}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:C.accent}}>{fmt(res.total)}</div>
                    <div style={{background:sc.bg,color:sc.color,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700,marginTop:2}}>{sc.icon} {sc.label}</div>
                  </div>
                </div>
                <div style={{marginTop:8,height:4,borderRadius:2,background:C.border}}>
                  <div style={{height:"100%",borderRadius:2,background:res.paid>=res.total?C.green:C.yellow,width:(Math.min(100,Math.round(((res.paid||0)/Math.max(res.total,1))*100)))+"%" }}/>
                </div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:3}}>Cobrado: {fmt(res.paid||0)} de {fmt(res.total)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
