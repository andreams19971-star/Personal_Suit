// apartamento/Modals.jsx
import { useState, useEffect } from "react";
import { C, today, fmtCOP } from "./shared.js";

export function ReservationModal({rooms, reservations=[], onClose, onAdd, editData}) {
  const [form,setForm]=useState({
    roomId:   editData?.roomId||rooms[0]?.id||"",
    guest:    "", phone:"", checkIn:td(), checkOut:"",
    platform: "Directo", notes:"", gender:"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const nights = form.checkIn&&form.checkOut
    ? Math.max(0,Math.round((new Date(form.checkOut)-new Date(form.checkIn))/86400000))
    : 0;

  // ── Live conflict detection ──
  const activeRes = reservations.filter(r => r.status!=="blocked" && r.status!=="cancelled");

  const roomConflict = nights>0 ? activeRes.find(r =>
    r.roomId === form.roomId &&
    r.checkIn  < form.checkOut &&
    r.checkOut > form.checkIn
  ) : null;

  const genderConflict = (nights>0 && form.gender) ? activeRes.find(r =>
    r.checkIn  < form.checkOut &&
    r.checkOut > form.checkIn &&
    r.gender && r.gender !== form.gender
  ) : null;

  const hasConflict = !!roomConflict || !!genderConflict;
  const ok = form.guest && form.checkIn && form.checkOut && nights>0 && form.gender && !hasConflict;

  return(
    <ModalWrap title="Nueva Reserva" onClose={onClose}>

      {/* HABITACIÓN */}
      <div>
        <div style={lbl}>HABITACIÓN</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {rooms.map(r=>{
            const conflict = nights>0 && activeRes.some(res =>
              res.roomId===r.id && res.checkIn<form.checkOut && res.checkOut>form.checkIn
            );
            return (
              <button key={r.id} onClick={()=>set("roomId",r.id)}
                style={{flex:1,padding:"8px 6px",borderRadius:9,
                  border:"1px solid "+(conflict?C.red:form.roomId===r.id?r.color:C.border),
                  background:conflict?C.redDim:form.roomId===r.id?r.color+"22":"transparent",
                  color:conflict?C.red:form.roomId===r.id?r.color:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600}}>
                {conflict?"🚫 ":""}{r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* GÉNERO */}
      <div>
        <div style={lbl}>GÉNERO DEL HUÉSPED</div>
        <div style={{display:"flex",gap:8}}>
          {[["M","👨 Masculino","#60A5FA"],["F","👩 Femenino","#F472B6"]].map(([val,label,color])=>(
            <button key={val} onClick={()=>set("gender",val)}
              style={{flex:1,padding:"10px 8px",borderRadius:10,border:"1px solid "+(form.gender===val?color:C.border),background:form.gender===val?color+"22":"transparent",color:form.gender===val?color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:700}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* DATOS */}
      {[["Nombre del huésped","guest","text","María García"],["Teléfono","phone","tel","300..."]].map(([label,key,type,ph])=>(
        <div key={key}><div style={lbl}>{label.toUpperCase()}</div>
          <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={inp}/>
        </div>
      ))}

      {/* FECHAS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><div style={lbl}>CHECK-IN</div><input type="date" value={form.checkIn} onChange={e=>set("checkIn",e.target.value)} style={inp}/></div>
        <div><div style={lbl}>CHECK-OUT</div><input type="date" value={form.checkOut} onChange={e=>set("checkOut",e.target.value)} style={inp}/></div>
      </div>

      {/* RESUMEN / CONFLICTOS */}
      {nights>0 && !hasConflict && (
        <div style={{background:C.accentDim,border:"1px solid "+(C.accent+"44"),borderRadius:10,padding:"10px 14px",fontSize:13,textAlign:"center"}}>
          <span style={{color:C.accent,fontWeight:800}}>{nights} noche{nights!==1?"s":""}</span>
          <span style={{color:C.textMuted}}> · Empresa</span>
        </div>
      )}
      {roomConflict && (
        <div style={{background:C.redDim,border:"1px solid "+(C.red+"44"),borderRadius:10,padding:"10px 14px",fontSize:12,color:C.red,fontWeight:600}}>
          🚫 Habitación ocupada del <strong>{roomConflict.checkIn}</strong> al <strong>{roomConflict.checkOut}</strong> por {roomConflict.guest}
        </div>
      )}
      {genderConflict && !roomConflict && (
        <div style={{background:C.redDim,border:"1px solid "+(C.red+"44"),borderRadius:10,padding:"10px 14px",fontSize:12,color:C.red,fontWeight:600}}>
          🚫 Ya hay {genderConflict.gender==="M"?"hombres":"mujeres"} hospedados del {genderConflict.checkIn} al {genderConflict.checkOut}. No se puede mezclar géneros.
        </div>
      )}

      {/* PLATAFORMA Y NOTAS */}
      <div><div style={lbl}>PLATAFORMA / ORIGEN</div>
        <select value={form.platform} onChange={e=>set("platform",e.target.value)} style={inp}>
          {PLATFORMS.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div><div style={lbl}>NOTAS</div>
        <input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Opcional..." style={inp}/>
      </div>

      {!form.gender && (
        <div style={{fontSize:11,color:C.yellow,textAlign:"center",padding:"4px 0"}}>
          ⚠️ Selecciona el género del huésped para continuar
        </div>
      )}

      <button onClick={()=>ok&&onAdd(form)}
        style={{...btnStyle,background:ok?C.accent:C.border,color:ok?"#000":C.textMuted,opacity:hasConflict?0.5:1}}>
        {hasConflict?"No disponible":"Crear Reserva"}
      </button>
    </ModalWrap>
  );
}

export function ReservationDetailModal({res,rooms,onClose,onStatusChange,onDelete}) {
  const room=rooms.find(r=>r.id===res.roomId);
  const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
  return(
    <ModalWrap title="Detalle de Reserva" onClose={onClose}>
      <div style={{background:(room?.color||C.accent)+"22",border:"1px solid "+((room?.color||C.accent)+"44"),borderRadius:14,padding:14}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>{res.guest}</div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:8}}>{room?.name} · {res.platform}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["Check-in",res.checkIn],["Check-out",res.checkOut],[res.nights+" noche"+(res.nights!==1?"s":""),""]].map(([l,v])=>(
            <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:9,color:C.textMuted,marginBottom:2}}>{l.toUpperCase()}</div>
              <div style={{fontSize:12,fontWeight:700}}>{v||l}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={lbl}>ESTADO</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(STATUS_CONFIG).map(([key,s])=>{
            const isActive = res.status===key;
            return (
              <button key={key} onClick={()=>onStatusChange(res.id,key)}
                style={{flex:"1 1 auto",padding:"8px 4px",borderRadius:9,
                  border:"1px solid "+(isActive?s.color:C.border),
                  background:isActive?s.bg:"transparent",
                  color:isActive?s.color:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600}}>
                {s.icon} {s.label}
              </button>
            );
          })}
        </div>
      </div>
      {res.notes&&<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.textSub}}>{"\uD83D\uDCAC"} {res.notes}</div>}
      <button onClick={()=>onDelete(res.id)} style={{background:C.redDim,border:"1px solid "+C.red+"33",color:C.red,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",width:"100%"}}>Eliminar reserva</button>
    </ModalWrap>
  );
}

export function ExpenseModal({onClose,onAdd,rooms}) {
  const [form,setForm]=useState({date:td(),category:"Servicios",amount:"",room:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const cats=["Servicios","Limpieza","Mantenimiento","Insumos","Publicidad","Impuestos","Otro"];
  return(
    <ModalWrap title="Nuevo Gasto" onClose={onClose}>
      <div style={{background:C.redDim,border:"1px solid "+((C.red)+"33"),borderRadius:14,padding:14}}>
        <div style={lbl}>MONTO</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:18,color:C.textMuted}}>$</span>
          <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
            style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color:C.red}}/>
        </div>
      </div>
      <div><div style={lbl}>CATEGORÍA</div><select value={form.category} onChange={e=>set("category",e.target.value)} style={inp}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><div style={lbl}>HABITACIÓN (opcional)</div>
        <select value={form.room} onChange={e=>set("room",e.target.value)} style={inp}>
          <option value="">General (todas)</option>
          {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div><div style={lbl}>FECHA</div><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/></div>
      <div><div style={lbl}>DESCRIPCIÓN</div><input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Pago de agua y luz" style={inp}/></div>
      <button onClick={()=>form.amount&&onAdd({...form,amount:parseFloat(form.amount)})}
        style={{...btnStyle,background:form.amount?C.red:C.border,color:form.amount?"#fff":C.textMuted}}>Registrar Gasto</button>
    </ModalWrap>
  );
}

export function RoomEditModal({rooms,onClose,onSave}) {
  const [selId,setSelId]=useState(rooms[0]?.id);
  const room=rooms.find(r=>r.id===selId);
  const [form,setForm]=useState({name:room?.name||"",description:room?.description||"",basePrice:room?.basePrice||0,amenities:(room?.amenities||[]).join(", ")});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <ModalWrap title="Configurar Habitaciones" onClose={onClose}>
      <div style={{display:"flex",gap:8}}>
        {rooms.map(r=><button key={r.id} onClick={()=>{setSelId(r.id);setForm({name:r.name,description:r.description||"",basePrice:r.basePrice||0,amenities:(r.amenities||[]).join(", ")});}} style={{flex:1,padding:"8px 4px",borderRadius:9,border:"1px solid "+(selId===r.id?r.color:C.border),background:selId===r.id?r.color+"22":"transparent",color:selId===r.id?r.color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>{r.name}</button>)}
      </div>
      {[["Nombre","name","text"],["Descripción","description","text"]].map(([label,key,type])=>(
        <div key={key}><div style={lbl}>{label.toUpperCase()}</div><input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} style={inp}/></div>
      ))}
      <div><div style={lbl}>PRECIO POR NOCHE</div><input type="number" value={form.basePrice} onChange={e=>set("basePrice",parseFloat(e.target.value)||0)} style={inp}/></div>
      <div><div style={lbl}>COMODIDADES (separadas por coma)</div><input value={form.amenities} onChange={e=>set("amenities",e.target.value)} placeholder="WiFi, AC, TV..." style={inp}/></div>
      <button onClick={()=>onSave(selId,{...form,basePrice:parseFloat(form.basePrice)||0,amenities:form.amenities.split(",").map(a=>a.trim()).filter(Boolean)})}
        style={{...btnStyle,background:C.accent,color:"#000"}}>Guardar Habitación</button>
    </ModalWrap>
  );
}

export function ModalWrap({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 32px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+((C.accent)+"55"),animation:"ap-su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800}}>{title}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>{children}</div>
      </div>
    </div>
  );
}

const lbl = {fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4,textTransform:"uppercase"};
const inp = {width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13,boxSizing:"border-box"};
const btnStyle = {width:"100%",marginTop:4,padding:13,borderRadius:12,border:"none",fontWeight:800,fontSize:15,cursor:"pointer"};
