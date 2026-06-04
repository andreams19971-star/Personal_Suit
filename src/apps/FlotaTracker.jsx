import { useState, useEffect } from 'react';
import { useFlotaData } from '../hooks/useFlotaData.js';
import { C, CAR1, CAR2, today, fmtCOP, fmtShort, ACCOUNTS, MONTHS } from './flota/shared.js';
import { Dashboard } from './flota/Dashboard.jsx';
import { CarroView } from './flota/CarroView.jsx';
import { GastosView } from './flota/GastosView.jsx';
import { EditPagoModal, GastoModal, DiaModal, CarroConfig, AddCarModal, ModalWrap, MF } from './flota/Modals.jsx';

export default function FlotaTracker({ onBack }) {
  const {
    cars, loading, online,
    togglePayment, deletePayment, updatePayment, addWorkDay, addExpense, updateCar, addCar, deleteCar,
  } = useFlotaData();

  const [view,        setView]        = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(today().slice(0,7));
  const [modal,       setModal]       = useState(null);
  const [editPago,    setEditPago]    = useState(null);
  const [showAddCar,  setShowAddCar]  = useState(false);

  const handleAddCar    = async (data) => { await addCar(data);   showToast("Carro agregado ✓"); setShowAddCar(false); };
  const handleDeleteCar = async (id)   => { await deleteCar(id);  showToast("Carro eliminado",  "err"); };
  const [sidebar,     setSidebar]     = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = (m, t="ok") => { setToast({m,t}); setTimeout(()=>setToast(null),2200); };

  const [y, mo] = filterMonth.split("-").map(Number);
  const year = y; const month = mo - 1;

  const getStats = (carro) => {
    const pagosMes = (carro.pagos||[]).filter(p => p.fecha.startsWith(filterMonth));
    if (carro.tipo === "diario") {
      const workDaysTotal = getWorkDaysInMonth(year, month);
      const esperadoMes   = workDaysTotal * (carro.valor_diario || CARRO1_DIARIO);
      const cobrado       = pagosMes.filter(p=>p.pagado).reduce((s,p)=>s+p.monto,0);
      const pendiente     = pagosMes.filter(p=>!p.pagado).reduce((s,p)=>s+p.monto,0);
      return { esperadoMes, cobrado, pendiente, diasPagados:pagosMes.filter(p=>p.pagado).length, diasPendientes:pagosMes.filter(p=>!p.pagado).length, workDaysTotal };
    } else {
      const val = carro.valor_mensual || CARRO2_MENSUAL;
      // Si no hay registro del mes, asumir pendiente
      const pagoMes = pagosMes[0];
      const pagado = pagoMes?.pagado ? val : 0;
      const pendiente = pagoMes?.pagado ? 0 : val;
      return { esperadoMes:val, cobrado:pagado, pendiente, pagado:!!pagoMes?.pagado, tienePago:!!pagoMes, pagoId:pagoMes?.id };
    }
  };

  const totalEsperado  = cars.reduce((s,c) => s + getStats(c).esperadoMes, 0);
  const totalCobrado   = cars.reduce((s,c) => s + getStats(c).cobrado, 0);
  const totalPendiente = cars.reduce((s,c) => s + getStats(c).pendiente, 0);
  const totalGastos    = cars.reduce((s,c) => s + (c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).reduce((a,g)=>a+g.monto,0), 0);
  const totalNeto      = totalCobrado - totalGastos;

  const marcarPagado = async (carroId, pagoId) => {
    const carro = cars.find(c=>c.id===carroId);
    const pago  = carro?.pagos?.find(p=>p.id===pagoId);
    if (!pago) { showToast("Registro no encontrado","err"); return; }

    const nowPaid = await togglePayment(carroId, pagoId);

    if (nowPaid) {
      try {
        await supabase.from('transactions').insert([{
          id: "flota-"+Date.now(),
          date: pago.fecha, type: "income",
          category: "flota_inc",
          subcategory: carro?.nombre||"Flota",
          account: pago.account || "cash",
          amount: pago.monto,
          note: "Cobro "+(carro?.nombre||"")+" · "+pago.fecha,
          loan_id: null,
        }]);
        console.log('[FlotaTracker] ✅ Ingreso en FinanzApp');
      } catch(e) { console.error('[FlotaTracker]', e); }
      showToast("✓ Pagado — ingreso en FinanzApp");
    } else {
      showToast("Marcado como pendiente");
    }
  };
  const agregarGasto = async (carroId, gasto) => {
    const r = await addExpense(carroId, gasto);
    if (r?.error) showToast("Error: "+r.error,"err");
    else showToast("Gasto registrado ✓");
    setModal(null);
    // Sincronizar con FinanzApp como egreso
    try {
      const carro = cars.find(c=>c.id===carroId);
      await supabase.from('transactions').insert([{
        id: "flota-exp-"+Date.now(),
        date: gasto.fecha,
        type: "expense",
        category: "transport",
        subcategory: gasto.categoria,
        account: gasto.account || "cash",
        amount: gasto.monto,
        note: "Gasto "+(carro?.nombre||"Flota")+" · "+gasto.categoria,
        loan_id: null,
      }]);
      console.log('[FlotaTracker] ✅ Gasto sincronizado con FinanzApp');
    } catch(e) { console.error('[FlotaTracker] sync gasto:', e); }
  };

  const agregarPagoDiario = async (carroId, fecha, account, monto) => {
    const r = await addWorkDay(carroId, fecha, account, monto);
    if (r?.error) showToast("Error: "+r.error,"err");
    else showToast("Día agregado ✓");
    setModal(null);
  };

  const nav = [
    {id:"dashboard", icon:"📊", label:"Resumen"},
    ...cars.map((c,i) => ({id:"carro_"+c.id, icon:i===0?"🚗":"🚙", label:c.nombre||("Carro "+(i+1))})),
    {id:"gastos", icon:"🔧", label:"Gastos"},
  ];

  const [yStr, mStr] = filterMonth.split("-");

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",color:C.text,display:"flex",flexDirection:"column"}}>

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:"1px solid "+C.border,paddingTop:"max(13px,calc(env(safe-area-inset-top) + 8px))",paddingBottom:"13px",paddingLeft:"16px",paddingRight:"16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 12px",color:C.textSub,cursor:"pointer",fontSize:13,fontWeight:600}}>← Suite</button>
        <div style={{fontSize:16,fontWeight:800,flex:1}}>🚗 FlotaTracker</div>
        <div style={{display:"flex",alignItems:"center",gap:4,background:C.card,borderRadius:8,padding:"5px 10px",border:"1px solid "+(C.border)}}>
          <button onClick={()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()-1);setFilterMonth(d.toISOString().slice(0,7));}} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:14,lineHeight:1}}>‹</button>
          <span style={{fontSize:11,fontWeight:700,minWidth:55,textAlign:"center"}}>{MONTHS[parseInt(mStr)-1]} {yStr}</span>
          <button onClick={()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()+1);if(d<=new Date())setFilterMonth(d.toISOString().slice(0,7));}} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:14,lineHeight:1}}>›</button>
        </div>
        <button onClick={()=>setSidebar(true)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:14}}>⚙</button>
        <button onClick={()=>setShowAddCar(true)} style={{background:C.accent,border:"none",borderRadius:8,padding:"7px 10px",color:"#000",cursor:"pointer",fontSize:14,fontWeight:700}}>+</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:58}}>
        {loading && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:14}}>
            <div style={{width:32,height:32,border:"3px solid "+(C.border),borderTop:"3px solid "+(C.accent),borderRadius:"50%",animation:"ft-spin .8s linear infinite"}}/>
            <div style={{fontSize:13,color:C.textMuted}}>Cargando datos...</div>
          </div>
        )}
        {!loading && view==="dashboard" && <Dashboard carros={cars} getStats={getStats} totalEsperado={totalEsperado} totalCobrado={totalCobrado} totalPendiente={totalPendiente} totalGastos={totalGastos} totalNeto={totalNeto} filterMonth={filterMonth} setView={setView} />}
        {!loading && cars.map(carro => (
          view==="carro_"+carro.id && <CarroView key={carro.id} carro={carro} stats={getStats(carro)} pagos={carro.pagos||[]} filterMonth={filterMonth} marcarPagado={marcarPagado} eliminarPago={(carId,pagoId)=>{deletePayment(carId,pagoId);showToast("Registro eliminado","err");}} editarPago={(carId,pago)=>setEditPago({carId,pago})} setModal={setModal} />
        ))}
        {!loading && view==="gastos"    && <GastosView carros={cars} filterMonth={filterMonth} setModal={setModal} totalGastos={totalGastos} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:"1px solid "+(C.border),display:"flex",zIndex:50}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 0",border:"none",background:"transparent",color:view===n.id?"#fff":C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600,borderTop:view===n.id?"2px solid "+(n.id==="dashboard"?C.green:n.id.startsWith("carro_")?CAR1:C.green):"2px solid transparent"}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {modal?.type==="gasto" && <GastoModal carroId={modal.carroId} carros={cars} onClose={()=>setModal(null)} onAdd={agregarGasto} accounts={ACCOUNTS}/>}
      {modal?.type==="dia"   && <DiaModal   carroId={modal.carroId} onClose={()=>setModal(null)} onAdd={agregarPagoDiario} cars={cars} accounts={ACCOUNTS}/>}
      {editPago && <EditPagoModal carId={editPago.carId} pago={editPago.pago} accounts={ACCOUNTS} onClose={()=>setEditPago(null)} onSave={async(pagoId,updates)=>{ const r=await updatePayment(editPago.carId,pagoId,updates); if(r?.error){showToast("Error: "+r.error,"err");}else{showToast("Registro actualizado ✓");setEditPago(null);}}}/>}
      {showAddCar && <AddCarModal onClose={()=>setShowAddCar(false)} onSave={handleAddCar}/>}

      {/* SIDEBAR CONFIGURACIÓN */}
      {sidebar && <>
        <div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"#0009",zIndex:200}}/>
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:Math.min(320,window.innerWidth-40),background:C.surface,borderLeft:"1px solid "+(C.border),zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"18px 16px",borderBottom:"1px solid "+(C.border),display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div style={{fontWeight:800,fontSize:16}}>⚙ Configuración</div>
            <button onClick={()=>setSidebar(false)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{padding:16,display:"grid",gap:14,overflowY:"auto"}}>
            {/* ESTADO CONEXIÓN */}
            <div style={{background:C.card,border:"1px solid "+(online?C.green+"44":C.red+"44"),borderRadius:12,padding:12,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:online?C.green:C.red,flexShrink:0}}/>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:online?C.green:C.red}}>{online?"Conectado a Supabase":"Sin conexión"}</div>
                <div style={{fontSize:11,color:C.textMuted}}>Los datos se {online?"guardan en la nube":"guardan localmente"}</div>
              </div>
            </div>
            {/* CONFIG CARROS */}
            {cars.map(carro=>(
              <CarroConfig key={carro.id} carro={carro} onSave={(updates)=>{updateCar(carro.id,updates);showToast((carro.nombre)+" actualizado ✓");}} onDelete={(id)=>{handleDeleteCar(id);setSidebar(false);}}/>
            ))}
          </div>
        </div>
      </>}

      {toast && <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",background:toast.t==="err"?C.red:C.green,color:"#fff",padding:"8px 20px",borderRadius:100,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap",animation:"su .25s ease"}}>{toast.m}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
