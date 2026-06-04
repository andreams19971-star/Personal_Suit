import { useState, useEffect } from 'react';
import { useApartamentoData } from '../hooks/useApartamentoData.js';
import { supabase } from '../supabase.js';
import { C, today, fmtCOP } from './apartamento/shared.js';
import { DashboardView } from './apartamento/DashboardView.jsx';
import { RoomsView } from './apartamento/RoomsView.jsx';
import { CalendarView } from './apartamento/CalendarView.jsx';
import { FinancesView } from './apartamento/FinancesView.jsx';
import { ReservationModal, ReservationDetailModal, ExpenseModal, RoomEditModal, ModalWrap } from './apartamento/Modals.jsx';

export default function ApartamentoApp({ onBack }) {
  const {
    rooms, reservations, expenses, loading, online,
    addReservation: dbAddRes, updateReservationStatus: dbUpdateStatus,
    deleteReservation: dbDeleteRes, addExpense: dbAddExpense,
    deleteExpense: dbDeleteExpense, updateRoom: dbUpdateRoom,
  } = useApartamentoData();

  const [view, setView]         = useState("dashboard");
  const [calMonth, setCalMonth] = useState(new Date());
  const [modal, setModal]       = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (m, t="ok") => { setToast({m,t}); setTimeout(()=>setToast(null),2200); };

  const addReservation = async (res) => {
    const activeRes = reservations.filter(r =>
      r.status !== "blocked" && r.status !== "cancelled"
    );

    // ── Validación 1: Solapamiento de fechas en la misma habitación ──
    const overlap = activeRes.find(r =>
      r.roomId === res.roomId &&
      r.checkIn  < res.checkOut &&
      r.checkOut > res.checkIn
    );
    if (overlap) {
      showToast("❌ Esa habitación ya está reservada del " + overlap.checkIn + " al " + overlap.checkOut, "err");
      return;
    }

    // ── Validación 2: No mezclar géneros ──
    if (res.gender) {
      const activeGuests = activeRes.filter(r =>
        r.checkIn < res.checkOut &&
        r.checkOut > res.checkIn &&
        r.gender && r.gender !== res.gender
      );
      if (activeGuests.length > 0) {
        const otherGender = res.gender === "M" ? "mujeres" : "hombres";
        showToast("❌ Ya hay " + otherGender + " hospedados en esas fechas", "err");
        return;
      }
    }

    await dbAddRes(res);
    showToast("Reserva creada ✓");
    setModal(null);
  };
  const updateReservationStatus = async (id, status) => {
    await dbUpdateStatus(id, status);
    showToast("Estado actualizado ✓");
  };
  const deleteReservation = async (id) => {
    await dbDeleteRes(id);
    showToast("Reserva eliminada","err");
    setModal(null);
  };
  const addExpense = async (exp) => {
    await dbAddExpense(exp);
    showToast("Gasto registrado ✓");
    setModal(null);
  };
  const updateRoom = async (roomId, updates) => {
    await dbUpdateRoom(roomId, updates);
    showToast("Habitación actualizada ✓");
    setModal(null);
  };

  // ── STATS ──
  const now = new Date();
  const mKey = now.toISOString().slice(0,7);
  const totalExpenses  = expenses.reduce((s,e)=>s+e.amount,0);
  const occupancyRate  = Math.round((reservations.filter(r=>r.status==="occupied"||r.status==="reserved").length / Math.max(rooms.length,1)) * 100);

  const getRoomStatus = (roomId) => {
    const todayStr = today();
    const active = reservations.find(r => r.roomId===roomId && r.checkIn<=todayStr && r.checkOut>todayStr);
    if (active) return active.status === "occupied" ? "occupied" : "reserved";
    const upcoming = reservations.find(r => r.roomId===roomId && r.checkIn>todayStr && r.status==="reserved");
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
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",color:C.text,display:"flex",flexDirection:"column"}}>
      {loading && (
        <div style={{position:"absolute",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:14}}>
          <div style={{width:32,height:32,border:"3px solid "+C.border,borderTop:"3px solid "+C.accent,borderRadius:"50%",animation:"ap-spin .8s linear infinite"}}/>
          <div style={{fontSize:14,color:C.textMuted}}>Cargando datos...</div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:"1px solid "+(C.border),
        paddingTop:"max(14px,calc(env(safe-area-inset-top) + 8px))",
        paddingBottom:"14px",paddingLeft:"16px",paddingRight:"16px",
        display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:500,flexShrink:0,padding:0}}>← Suite</button>
        <div style={{fontSize:16,fontWeight:800,flex:1,minWidth:0}}>🏠 Apartamento</div>
        <button onClick={()=>setModal({type:"newReservation"})} style={{background:C.accent,color:"#000",border:"none",borderRadius:8,padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>+ Reserva</button>
        <button onClick={()=>setModal({type:"editRoom"})} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:13,flexShrink:0}}>⚙</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden",paddingBottom:58,minHeight:0}}>
        {view==="dashboard" && <DashboardView rooms={rooms} reservations={reservations} expenses={expenses} totalExpenses={totalExpenses} occupancyRate={occupancyRate} getRoomStatus={getRoomStatus} setModal={setModal} updateReservationStatus={updateReservationStatus} showToast={showToast}/>}
        {view==="rooms"     && <RoomsView rooms={rooms} reservations={reservations} getRoomStatus={getRoomStatus} setModal={setModal} updateReservationStatus={updateReservationStatus} deleteReservation={deleteReservation}/>}
        {view==="calendar"  && <CalendarView reservations={reservations} rooms={rooms} calMonth={calMonth} setCalMonth={setCalMonth} setModal={setModal}/>}
        {view==="finances"  && <FinancesView reservations={reservations} expenses={expenses} totalExpenses={totalExpenses} setModal={setModal} deleteExpense={dbDeleteExpense}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:"1px solid "+(C.border),display:"flex",zIndex:50,paddingBottom:"max(env(safe-area-inset-bottom), 6px)"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0",border:"none",background:"transparent",color:view===n.id?C.accent:C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {modal?.type==="newReservation" && <ReservationModal rooms={rooms} reservations={reservations} onClose={()=>setModal(null)} onAdd={addReservation} editData={modal.data}/>}
      {modal?.type==="viewReservation"&& <ReservationDetailModal res={modal.data} rooms={rooms} onClose={()=>setModal(null)} onStatusChange={updateReservationStatus} onDelete={deleteReservation}/>}
      {modal?.type==="addExpense"     && <ExpenseModal onClose={()=>setModal(null)} onAdd={addExpense} rooms={rooms}/>}
      {modal?.type==="editRoom"       && <RoomEditModal rooms={rooms} onClose={()=>setModal(null)} onSave={updateRoom}/>}

      {toast && <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",background:toast.t==="err"?C.red:C.accent,color:toast.t==="err"?"#fff":"#000",padding:"8px 20px",borderRadius:100,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap",animation:"ap-su .25s ease"}}>{toast.m}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
