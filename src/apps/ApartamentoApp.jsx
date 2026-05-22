import { useState } from "react";

// ─── COLORES ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#080B14",surface:"#0F1320",card:"#161C2E",cardHover:"#1C2438",
  border:"#232D45",
  accent:"#818CF8",accentDim:"#0F1235",accentText:"#818CF8",
  green:"#34D399",greenDim:"#062318",
  red:"#F87171",redDim:"#230606",
  yellow:"#FBBF24",yellowDim:"#231806",
  orange:"#FB923C",orangeDim:"#231206",
  text:"#F1F5FF",textSub:"#7A8CAA",textMuted:"#3A4560",
};

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const fmt = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
const td  = () => new Date().toISOString().slice(0,10);

const STATUS_CONFIG = {
  available: { label:"Disponible",  color:C.green,  bg:C.greenDim,  icon:"✅" },
  reserved:  { label:"Reservado",   color:C.accent, bg:C.accentDim, icon:"📅" },
  occupied:  { label:"Ocupado",     color:C.orange, bg:C.orangeDim, icon:"🏠" },
  cleaning:  { label:"Limpieza",    color:C.yellow, bg:C.yellowDim, icon:"🧹" },
  blocked:   { label:"Bloqueado",   color:C.red,    bg:C.redDim,    icon:"🚫" },
};

const PLATFORMS = ["Airbnb","Booking","Directo","WhatsApp","Referido","Otro"];

function seedData() {
  const now = new Date();
  const d = (days) => { const x = new Date(now); x.setDate(x.getDate()+days); return x.toISOString().slice(0,10); };
  const ago = (days) => { const x = new Date(now); x.setDate(x.getDate()-days); return x.toISOString().slice(0,10); };

  return {
    rooms: [
      { id:"R1", name:"Habitación 1", description:"Cama doble, baño privado", basePrice:120000, icon:"🛏️", color:"#818CF8", amenities:["WiFi","AC","TV","Baño privado"] },
      { id:"R2", name:"Habitación 2", description:"Cama sencilla, baño compartido", basePrice:80000, icon:"🛏️", color:"#34D399", amenities:["WiFi","TV","Baño compartido"] },
      { id:"R3", name:"Habitación 3", description:"Cama doble premium, baño privado", basePrice:150000, icon:"🛏️", color:"#FBBF24", amenities:["WiFi","AC","TV","Baño privado","Balcón"] },
    ],
    reservations: [
      { id:"RES1", roomId:"R1", guest:"Carlos Martínez", phone:"3001234567", checkIn:ago(2), checkOut:d(1), nights:3, platform:"Airbnb", total:360000, status:"occupied", paid:360000, notes:"Viaje de trabajo" },
      { id:"RES2", roomId:"R2", guest:"Ana López",       phone:"3109876543", checkIn:d(3),  checkOut:d(6), nights:3, platform:"Booking", total:240000, status:"reserved",  paid:120000, notes:"" },
      { id:"RES3", roomId:"R3", guest:"Pedro Ruiz",      phone:"3205554433", checkIn:d(1),  checkOut:d(5), nights:4, platform:"Directo",  total:600000, status:"reserved",  paid:300000, notes:"Pareja, aniversario" },
      { id:"RES4", roomId:"R1", guest:"María García",    phone:"3001112222", checkIn:d(5),  checkOut:d(8), nights:3, platform:"WhatsApp", total:360000, status:"reserved",  paid:0,      notes:"" },
    ],
    expenses: [
      { id:"E1", date:ago(5),  category:"Servicios",    amount:180000, note:"Agua + luz",     room:null },
      { id:"E2", date:ago(10), category:"Limpieza",     amount:50000,  note:"Aseo semanal",   room:"R1" },
      { id:"E3", date:ago(3),  category:"Mantenimiento",amount:120000, note:"Grifo baño R2",  room:"R2" },
      { id:"E4", date:ago(1),  category:"Insumos",      amount:35000,  note:"Papel, jabón",   room:null },
    ],
  };
}

export default function ApartamentoApp({ onBack }) {
  const [data, setData]       = useState(seedData);
  const [view, setView]       = useState("dashboard");
  const [calMonth, setCalMonth] = useState(new Date());
  const [selRoom,  setSelRoom]  = useState(null);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (m, t="ok") => { setToast({m,t}); setTimeout(()=>setToast(null),2200); };

  // ── ACCIONES ──
  const addReservation = (res) => {
    const nights = Math.max(1, Math.round((new Date(res.checkOut)-new Date(res.checkIn))/86400000));
    const room   = data.rooms.find(r=>r.id===res.roomId);
    const total  = nights * (room?.basePrice||0);
    setData(d => ({ ...d, reservations: [{ ...res, id:"RES"+Date.now(), nights, total, paid:parseFloat(res.paid)||0, status:"reserved" }, ...d.reservations] }));
    showToast("Reserva creada ✓");
    setModal(null);
  };

  const updateReservationStatus = (id, status) => {
    setData(d => ({ ...d, reservations: d.reservations.map(r => r.id!==id?r:{...r,status}) }));
    showToast("Estado actualizado ✓");
  };

  const deleteReservation = (id) => {
    setData(d => ({ ...d, reservations: d.reservations.filter(r=>r.id!==id) }));
    showToast("Reserva eliminada","err");
    setModal(null);
  };

  const addExpense = (exp) => {
    setData(d => ({ ...d, expenses: [{ ...exp, id:"E"+Date.now() }, ...d.expenses] }));
    showToast("Gasto registrado ✓");
    setModal(null);
  };

  const updateRoom = (roomId, updates) => {
    setData(d => ({ ...d, rooms: d.rooms.map(r => r.id!==roomId?r:{...r,...updates}) }));
    showToast("Habitación actualizada ✓");
    setModal(null);
  };

  // ── STATS ──
  const now = new Date();
  const mKey = now.toISOString().slice(0,7);
  const mRes = data.reservations.filter(r => r.checkIn.startsWith(mKey) || r.checkOut.startsWith(mKey));
  const totalIncome  = data.reservations.filter(r=>r.checkIn.startsWith(mKey)).reduce((s,r)=>s+r.total,0);
  const totalCollected = data.reservations.filter(r=>r.checkIn.startsWith(mKey)).reduce((s,r)=>s+(r.paid||0),0);
  const totalExpenses= data.expenses.reduce((s,e)=>s+e.amount,0);
  const occupancyRate = Math.round((data.reservations.filter(r=>r.status==="occupied"||r.status==="reserved").length / Math.max(data.rooms.length,1)) * 100);

  const getRoomStatus = (roomId) => {
    const today = td();
    const active = data.reservations.find(r => r.roomId===roomId && r.checkIn<=today && r.checkOut>today);
    if (active) return active.status === "occupied" ? "occupied" : "reserved";
    const upcoming = data.reservations.find(r => r.roomId===roomId && r.checkIn>today && r.status==="reserved");
    if (upcoming) return "reserved";
    return "available";
  };

  const nav = [
    {id:"dashboard",icon:"📊",label:"Resumen"},
    {id:"rooms",    icon:"🛏️",label:"Habitaciones"},
    {id:"calendar", icon:"📅",label:"Calendario"},
    {id:"finances", icon:"💰",label:"Finanzas"},
  ];

  const [yStr, mStr] = calMonth.toISOString().slice(0,7).split("-");

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,width:"100vw",height:"100vh",overflow:"hidden",color:C.text,display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,select,textarea{outline:none;font-family:inherit;font-size:16px}
        ::-webkit-scrollbar{display:none}*{scrollbar-width:none}
        @keyframes ap-su{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes ap-fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .ap-fu{animation:ap-fu .3s ease both}.bp:active{transform:scale(.97)}.hr:hover{background:${C.cardHover}!important}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,
        paddingTop:`max(14px,calc(env(safe-area-inset-top)+8px))`,
        paddingBottom:"14px",paddingLeft:"16px",paddingRight:"16px",
        display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>← Suite</button>
        <div style={{fontSize:16,fontWeight:800,flex:1,minWidth:0}}>🏠 Apartamento</div>
        <button onClick={()=>setModal({type:"newReservation"})} style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>+ Reserva</button>
        <button onClick={()=>setModal({type:"editRoom"})} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:13,flexShrink:0}}>⚙</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",paddingBottom:58,minHeight:0}}>
        {view==="dashboard" && <DashboardView rooms={data.rooms} reservations={data.reservations} expenses={data.expenses} totalIncome={totalIncome} totalCollected={totalCollected} totalExpenses={totalExpenses} occupancyRate={occupancyRate} getRoomStatus={getRoomStatus} setModal={setModal} updateReservationStatus={updateReservationStatus}/>}
        {view==="rooms"     && <RoomsView rooms={data.rooms} reservations={data.reservations} getRoomStatus={getRoomStatus} setModal={setModal} updateReservationStatus={updateReservationStatus} deleteReservation={deleteReservation}/>}
        {view==="calendar"  && <CalendarView reservations={data.reservations} rooms={data.rooms} calMonth={calMonth} setCalMonth={setCalMonth} setModal={setModal}/>}
        {view==="finances"  && <FinancesView reservations={data.reservations} expenses={data.expenses} totalIncome={totalIncome} totalCollected={totalCollected} totalExpenses={totalExpenses} setModal={setModal} deleteExpense={id=>setData(d=>({...d,expenses:d.expenses.filter(e=>e.id!==id)}))}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:50,paddingBottom:"max(env(safe-area-inset-bottom),6px)"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0",border:"none",background:"transparent",color:view===n.id?C.accent:C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {modal?.type==="newReservation" && <ReservationModal rooms={data.rooms} onClose={()=>setModal(null)} onAdd={addReservation} editData={modal.data}/>}
      {modal?.type==="viewReservation"&& <ReservationDetailModal res={modal.data} rooms={data.rooms} onClose={()=>setModal(null)} onStatusChange={updateReservationStatus} onDelete={deleteReservation}/>}
      {modal?.type==="addExpense"     && <ExpenseModal onClose={()=>setModal(null)} onAdd={addExpense} rooms={data.rooms}/>}
      {modal?.type==="editRoom"       && <RoomEditModal rooms={data.rooms} onClose={()=>setModal(null)} onSave={updateRoom}/>}

      {toast && <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",background:toast.t==="err"?C.red:C.accent,color:toast.t==="err"?"#fff":"#000",padding:"8px 20px",borderRadius:100,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap",animation:"ap-su .25s ease"}}>{toast.m}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({rooms,reservations,expenses,totalIncome,totalCollected,totalExpenses,occupancyRate,getRoomStatus,setModal,updateReservationStatus}) {
  const today = td();
  const activeRes   = reservations.filter(r=>r.checkIn<=today&&r.checkOut>today);
  const upcomingRes = reservations.filter(r=>r.checkIn>today&&r.status==="reserved").sort((a,b)=>a.checkIn.localeCompare(b.checkIn)).slice(0,4);
  const neto = totalCollected - totalExpenses;

  return (
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box",overflowX:"hidden"}} className="ap-fu">

      {/* HERO */}
      <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.card})`,border:`1px solid ${C.accent}44`,borderRadius:18,padding:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:90,height:90,borderRadius:"50%",background:`${C.accent}0D`,pointerEvents:"none"}}/>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:4}}>ESTE MES</div>
        <div style={{fontSize:28,fontWeight:900,letterSpacing:-1}}>{fmt(totalCollected)}</div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>de {fmt(totalIncome)} facturado</div>
        <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
          {[[C.accent,"🏠 Ocupación",occupancyRate+"%"],[C.green,"💰 Cobrado",fmt(totalCollected)],[C.red,"🔧 Gastos",fmt(totalExpenses)],[neto>=0?C.green:C.red,"= Neto",fmt(neto)]].map(([color,label,val])=>(
            <div key={label} style={{flex:"1 1 0",minWidth:0}}>
              <div style={{fontSize:9,color,fontWeight:700,whiteSpace:"nowrap"}}>{label}</div>
              <div style={{fontSize:13,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis"}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ESTADO HABITACIONES */}
      <div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Estado de habitaciones</div>
        <div style={{display:"grid",gap:10}}>
          {rooms.map(room=>{
            const status = getRoomStatus(room.id);
            const sc = STATUS_CONFIG[status];
            const active = reservations.find(r=>r.roomId===room.id&&r.checkIn<=today&&r.checkOut>today);
            const next   = reservations.filter(r=>r.roomId===room.id&&r.checkIn>today&&r.status==="reserved").sort((a,b)=>a.checkIn.localeCompare(b.checkIn))[0];
            return (
              <div key={room.id} style={{background:C.card,border:`1px solid ${room.color}33`,borderRadius:16,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:active||next?10:0}}>
                  <div style={{width:42,height:42,borderRadius:12,background:room.color+"22",border:`1px solid ${room.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🛏️</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800}}>{room.name}</div>
                    <div style={{fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{room.description}</div>
                  </div>
                  <div style={{background:sc.bg,border:`1px solid ${sc.color}44`,borderRadius:100,padding:"4px 10px",fontSize:11,fontWeight:700,color:sc.color,flexShrink:0}}>
                    {sc.icon} {sc.label}
                  </div>
                </div>
                {active && (
                  <div style={{background:C.bg,borderRadius:10,padding:"8px 12px",fontSize:12}}>
                    <div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>👤 {active.guest}</div>
                    <div style={{color:C.textMuted,marginTop:2}}>Hasta el {active.checkOut} · {fmt(active.total)}</div>
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      {["occupied","cleaning","available"].map(s=>(
                        <button key={s} onClick={()=>updateReservationStatus(active.id,s)}
                          style={{flex:1,padding:"5px",borderRadius:7,border:`1px solid ${STATUS_CONFIG[s].color}44`,background:active.status===s?STATUS_CONFIG[s].bg:"transparent",color:STATUS_CONFIG[s].color,cursor:"pointer",fontSize:10,fontWeight:600}}>
                          {STATUS_CONFIG[s].icon}
                        </button>
                      ))}
                      <button onClick={()=>setModal({type:"viewReservation",data:active})}
                        style={{flex:2,padding:"5px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,cursor:"pointer",fontSize:10,fontWeight:600}}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                )}
                {!active && next && (
                  <div style={{background:C.bg,borderRadius:10,padding:"8px 12px",fontSize:12}}>
                    <div style={{color:C.accent,fontWeight:700}}>📅 Próxima: {next.guest}</div>
                    <div style={{color:C.textMuted,marginTop:2}}>Check-in: {next.checkIn} · {fmt(next.total)}</div>
                  </div>
                )}
                {!active && !next && (
                  <button onClick={()=>setModal({type:"newReservation",data:{roomId:room.id}})}
                    style={{width:"100%",marginTop:8,padding:"7px",borderRadius:10,border:`1px solid ${room.color}44`,background:room.color+"11",color:room.color,cursor:"pointer",fontSize:12,fontWeight:600}}>
                    + Agregar reserva
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PRÓXIMAS RESERVAS */}
      {upcomingRes.length > 0 && (
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>📅 Próximas llegadas</div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
            {upcomingRes.map((res,i)=>{
              const room=rooms.find(r=>r.id===res.roomId);
              return(
                <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})} className="hr"
                  style={{width:"100%",padding:"11px 14px",borderBottom:i<upcomingRes.length-1?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",cursor:"pointer",color:C.text,textAlign:"left"}}>
                  <div style={{width:36,height:36,borderRadius:9,background:room?.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🛏️</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.guest}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>{room?.name} · {res.checkIn} → {res.checkOut}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.accent}}>{fmt(res.total)}</div>
                    <div style={{fontSize:10,color:res.paid>=res.total?C.green:C.yellow}}>{res.paid>=res.total?"Pagado":"Pendiente"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOMS VIEW ───────────────────────────────────────────────────────────────
function RoomsView({rooms,reservations,getRoomStatus,setModal,updateReservationStatus,deleteReservation}) {
  const [selRoom, setSelRoom] = useState(rooms[0]?.id);
  const room = rooms.find(r=>r.id===selRoom)||rooms[0];
  const roomRes = reservations.filter(r=>r.roomId===selRoom).sort((a,b)=>b.checkIn.localeCompare(a.checkIn));
  const today = td();

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
        {rooms.map(r=>{
          const status=getRoomStatus(r.id);const sc=STATUS_CONFIG[status];
          return(
            <button key={r.id} onClick={()=>setSelRoom(r.id)} style={{padding:"9px 14px",borderRadius:12,flexShrink:0,cursor:"pointer",fontWeight:700,fontSize:12,background:selRoom===r.id?r.color+"22":C.card,border:`1px solid ${selRoom===r.id?r.color:C.border}`,color:selRoom===r.id?r.color:C.textSub,display:"flex",alignItems:"center",gap:6}}>
              <span>{sc.icon}</span>{r.name}
            </button>
          );
        })}
      </div>

      {room && (
        <div style={{background:`linear-gradient(135deg,${room.color}11,${C.card})`,border:`1px solid ${room.color}44`,borderRadius:18,padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:48,height:48,borderRadius:14,background:room.color+"22",border:`1px solid ${room.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🛏️</div>
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
        {roomRes.length===0&&<div style={{textAlign:"center",padding:20,color:C.textMuted,fontSize:13,background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>📭 Sin reservas</div>}
        <div style={{display:"grid",gap:8}}>
          {roomRes.map(res=>{
            const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
            const isPast=res.checkOut<today;
            return(
              <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})} className="hr"
                style={{background:C.card,border:`1px solid ${sc.color}33`,borderRadius:14,padding:14,cursor:"pointer",textAlign:"left",width:"100%",color:C.text,opacity:isPast?.7:1}}>
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
                  <div style={{height:"100%",borderRadius:2,background:res.paid>=res.total?C.green:C.yellow,width:`${Math.min(100,Math.round(((res.paid||0)/Math.max(res.total,1))*100))}%`}}/>
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

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({reservations,rooms,calMonth,setCalMonth,setModal}) {
  const year=calMonth.getFullYear(),month=calMonth.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:firstDay},()=>null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));
  const today=td();

  const getDayRes=(day)=>{
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return reservations.filter(r=>r.checkIn<=dateStr&&r.checkOut>dateStr);
  };

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      {/* NAV MES */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px"}}>
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
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
          {["D","L","M","M","J","V","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.textMuted}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((day,i)=>{
            if(!day)return<div key={i}/>;
            const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayRes=getDayRes(day);
            const isToday=dateStr===today;
            const roomColors=dayRes.map(r=>rooms.find(rm=>rm.id===r.roomId)?.color||C.accent).slice(0,3);
            return(
              <div key={i} onClick={()=>dayRes.length>0&&setModal({type:"viewReservation",data:dayRes[0]})}
                style={{aspectRatio:"1",borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,cursor:dayRes.length>0?"pointer":"default",background:isToday?C.accentDim:dayRes.length>0?C.cardHover:"transparent",border:isToday?`1px solid ${C.accent}`:"none"}}>
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
        {reservations.filter(r=>r.checkIn.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length===0&&
          <div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>Sin reservas este mes</div>}
        <div style={{display:"grid",gap:8}}>
          {reservations.filter(r=>r.checkIn.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).sort((a,b)=>a.checkIn.localeCompare(b.checkIn)).map(res=>{
            const room=rooms.find(r=>r.id===res.roomId);const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
            return(
              <button key={res.id} onClick={()=>setModal({type:"viewReservation",data:res})} className="hr"
                style={{background:C.card,border:`1px solid ${room?.color||C.border}33`,borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left",width:"100%",color:C.text,display:"flex",alignItems:"center",gap:10}}>
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

// ─── FINANCES VIEW ────────────────────────────────────────────────────────────
function FinancesView({reservations,expenses,totalIncome,totalCollected,totalExpenses,setModal,deleteExpense}) {
  const neto = totalCollected - totalExpenses;
  const pending = totalIncome - totalCollected;

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[[C.accent,"💰","Facturado",fmt(totalIncome)],[C.green,"✓","Cobrado",fmt(totalCollected)],[C.yellow,"⏳","Por cobrar",fmt(pending)],[neto>=0?C.green:C.red,"=","Neto",fmt(neto)]].map(([color,icon,label,val])=>(
          <div key={label} style={{background:C.card,border:`1px solid ${color}33`,borderRadius:14,padding:14}}>
            <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>{label.toUpperCase()}</div>
            <div style={{fontSize:15,fontWeight:800,color}}>{val}</div>
          </div>
        ))}
      </div>

      <button onClick={()=>setModal({type:"addExpense"})} style={{background:C.redDim,border:`1px solid ${C.red}44`,color:C.red,borderRadius:12,padding:12,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Registrar gasto</button>

      {/* PENDIENTES DE COBRO */}
      {reservations.filter(r=>r.paid<r.total).length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.yellow,marginBottom:8}}>⏳ PENDIENTES DE COBRO</div>
          <div style={{display:"grid",gap:8}}>
            {reservations.filter(r=>r.paid<r.total).map(res=>(
              <div key={res.id} style={{background:C.card,border:`1px solid ${C.yellow}33`,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{res.guest}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{res.checkIn}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.yellow}}>{fmt(res.total-(res.paid||0))}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>pendiente</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GASTOS */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>GASTOS ({expenses.length})</div>
        {expenses.length===0&&<div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>Sin gastos registrados</div>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          {expenses.map((exp,i)=>(
            <div key={exp.id} className="hr" style={{padding:"10px 14px",borderBottom:i<expenses.length-1?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🔧</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.note||exp.category}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{exp.category} · {exp.date}{exp.room?` · ${exp.room}`:""}</div>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:C.red,flexShrink:0}}>-{fmt(exp.amount)}</div>
              <button onClick={()=>deleteExpense(exp.id)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,opacity:.5,flexShrink:0}}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function ReservationModal({rooms,onClose,onAdd,editData}) {
  const [form,setForm]=useState({roomId:editData?.roomId||rooms[0]?.id||"",guest:"",phone:"",checkIn:td(),checkOut:"",platform:"Directo",paid:"",notes:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const room=rooms.find(r=>r.id===form.roomId);
  const nights=form.checkIn&&form.checkOut?Math.max(0,Math.round((new Date(form.checkOut)-new Date(form.checkIn))/86400000)):0;
  const total=nights*(room?.basePrice||0);
  const ok=form.guest&&form.checkIn&&form.checkOut&&nights>0;
  return(
    <ModalWrap title="Nueva Reserva" onClose={onClose}>
      <div><div style={lbl}>HABITACIÓN</div>
        <div style={{display:"flex",gap:8}}>
          {rooms.map(r=><button key={r.id} onClick={()=>set("roomId",r.id)} style={{flex:1,padding:"8px",borderRadius:9,border:`1px solid ${form.roomId===r.id?r.color:C.border}`,background:form.roomId===r.id?r.color+"22":"transparent",color:form.roomId===r.id?r.color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>{r.name}</button>)}
        </div>
      </div>
      {[["Nombre del huésped","guest","text","María García"],["Teléfono","phone","tel","300..."]].map(([label,key,type,ph])=>(
        <div key={key}><div style={lbl}>{label.toUpperCase()}</div><input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={inp}/></div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><div style={lbl}>CHECK-IN</div><input type="date" value={form.checkIn} onChange={e=>set("checkIn",e.target.value)} style={inp}/></div>
        <div><div style={lbl}>CHECK-OUT</div><input type="date" value={form.checkOut} onChange={e=>set("checkOut",e.target.value)} style={inp}/></div>
      </div>
      {nights>0&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:10,padding:"10px 14px",fontSize:13}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.textSub}}>{nights} noches × {fmt(room?.basePrice||0)}</span><span style={{fontWeight:800,color:C.accent}}>{fmt(total)}</span></div>
      </div>}
      <div><div style={lbl}>PLATAFORMA</div>
        <select value={form.platform} onChange={e=>set("platform",e.target.value)} style={inp}>
          {PLATFORMS.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div><div style={lbl}>ABONO INICIAL</div><input type="number" value={form.paid} onChange={e=>set("paid",e.target.value)} placeholder="0" style={inp}/></div>
      <div><div style={lbl}>NOTAS</div><input value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Opcional..." style={inp}/></div>
      <button onClick={()=>ok&&onAdd(form)} style={{...btnStyle,background:ok?C.accent:C.border,color:ok?"#000":C.textMuted}}>Crear Reserva</button>
    </ModalWrap>
  );
}

function ReservationDetailModal({res,rooms,onClose,onStatusChange,onDelete}) {
  const room=rooms.find(r=>r.id===res.roomId);
  const sc=STATUS_CONFIG[res.status]||STATUS_CONFIG.available;
  const [paid,setPaid]=useState(res.paid||0);
  return(
    <ModalWrap title="Detalle de Reserva" onClose={onClose}>
      <div style={{background:`${room?.color||C.accent}22`,border:`1px solid ${room?.color||C.accent}44`,borderRadius:14,padding:14}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>{res.guest}</div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:8}}>{room?.name} · {res.platform}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["Check-in",res.checkIn],["Check-out",res.checkOut],[`${res.nights} noches`,fmt(res.total)]].map(([l,v])=>(
            <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:9,color:C.textMuted,marginBottom:2}}>{l.toUpperCase()}</div>
              <div style={{fontSize:12,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={lbl}>ESTADO</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(STATUS_CONFIG).map(([key,s])=>(
            <button key={key} onClick={()=>onStatusChange(res.id,key)}
              style={{flex:"1 1 auto",padding:"8px 4px",borderRadius:9,border:`1px solid ${res.status===key?s.color:C.border}`,background:res.status===key?s.bg:"transparent",color:res.status===key?s.color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={lbl}>COBRO</div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{color:C.textMuted,fontSize:13}}>Total</span><span style={{fontWeight:800,fontSize:14}}>{fmt(res.total)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{color:C.textMuted,fontSize:13}}>Cobrado</span><span style={{fontWeight:800,fontSize:14,color:C.green}}>{fmt(paid)}</span>
          </div>
          <div style={{height:4,borderRadius:2,background:C.border,marginBottom:10}}>
            <div style={{height:"100%",borderRadius:2,background:paid>=res.total?C.green:C.yellow,width:`${Math.min(100,Math.round((paid/Math.max(res.total,1))*100))}%`}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input type="number" value={paid} onChange={e=>setPaid(parseFloat(e.target.value)||0)} style={{...inp,flex:1}}/>
            <button onClick={()=>onStatusChange(res.id,res.status)} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}44`,borderRadius:9,padding:"8px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>OK</button>
          </div>
        </div>
      </div>
      {res.notes&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.textSub}}>💬 {res.notes}</div>}
      <button onClick={()=>onDelete(res.id)} style={{background:C.redDim,border:`1px solid ${C.red}33`,color:C.red,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",width:"100%"}}>🗑 Eliminar reserva</button>
    </ModalWrap>
  );
}

function ExpenseModal({onClose,onAdd,rooms}) {
  const [form,setForm]=useState({date:td(),category:"Servicios",amount:"",room:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const cats=["Servicios","Limpieza","Mantenimiento","Insumos","Publicidad","Impuestos","Otro"];
  return(
    <ModalWrap title="Nuevo Gasto" onClose={onClose}>
      <div style={{background:C.redDim,border:`1px solid ${C.red}33`,borderRadius:14,padding:14}}>
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

function RoomEditModal({rooms,onClose,onSave}) {
  const [selId,setSelId]=useState(rooms[0]?.id);
  const room=rooms.find(r=>r.id===selId);
  const [form,setForm]=useState({name:room?.name||"",description:room?.description||"",basePrice:room?.basePrice||0,amenities:(room?.amenities||[]).join(", ")});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <ModalWrap title="Configurar Habitaciones" onClose={onClose}>
      <div style={{display:"flex",gap:8}}>
        {rooms.map(r=><button key={r.id} onClick={()=>{setSelId(r.id);setForm({name:r.name,description:r.description||"",basePrice:r.basePrice||0,amenities:(r.amenities||[]).join(", ")});}} style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1px solid ${selId===r.id?r.color:C.border}`,background:selId===r.id?r.color+"22":"transparent",color:selId===r.id?r.color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>{r.name}</button>)}
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

function ModalWrap({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 32px",maxHeight:"90vh",overflowY:"auto",borderTop:`1px solid ${C.accent}55`,animation:"ap-su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800}}>{title}</div>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>{children}</div>
      </div>
    </div>
  );
}

const lbl={fontSize:10,color:"#3A4560",fontWeight:700,marginBottom:4};
const inp={width:"100%",background:"#161C2E",border:"1px solid #232D45",borderRadius:9,padding:"9px 11px",color:"#F1F5FF",fontSize:13};
const btnStyle={width:"100%",marginTop:4,padding:13,borderRadius:12,border:"none",fontWeight:800,fontSize:15,cursor:"pointer"};
