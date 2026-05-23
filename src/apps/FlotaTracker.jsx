import { useState } from "react";
import { useFlotaData } from "../hooks/useFlotaData.js";

// ─── COLORES ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#07090F", surface:"#0E1119", card:"#141820", cardHover:"#191F2A",
  border:"#1E2535",
  car1:"#3B82F6", car1Dim:"#0A1628",   // Carro 1 - Azul (diario)
  car2:"#A855F7", car2Dim:"#1A0A28",   // Carro 2 - Morado (mensual)
  green:"#22C55E", greenDim:"#0A1F10",
  red:"#EF4444",   redDim:"#1F0A0A",
  yellow:"#EAB308",
  text:"#F1F5FF", textSub:"#7A8CAA", textMuted:"#3A4560",
};

const fmt = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
const td  = () => new Date().toISOString().slice(0,10);
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Carro 1: $70.000 × días laborales (Lun-Sáb)
// Carro 2: $500.000 mensual fijo
const CARRO1_DIARIO  = 70000;
const CARRO2_MENSUAL = 500000;

function getWorkDaysInMonth(year, month) {
  // month: 0-based
  let count = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0) count++; // excluye domingos
  }
  return count;
}

function getWorkDaysPassed(year, month) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const lastDay = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0) count++;
  }
  return count;
}

function seedData() {
  const now = new Date();
  const ago = d => { const x = new Date(now); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10); };

  // Pagos carro 1 (diarios, Lun-Sáb)
  const pagos1 = [];
  for (let i = 0; i < 20; i++) {
    const fecha = ago(i);
    const dow = new Date(fecha+"T12:00").getDay();
    if (dow !== 0) { // no domingos
      pagos1.push({ id:"P1-"+i, fecha, monto: CARRO1_DIARIO, pagado: i > 2, nota:"" });
    }
  }

  // Pagos carro 2 (mensuales)
  const pagos2 = [
    { id:"P2-1", fecha: ago(45), monto: CARRO2_MENSUAL, pagado: true,  nota:"Pago puntual" },
    { id:"P2-2", fecha: ago(15), monto: CARRO2_MENSUAL, pagado: true,  nota:"" },
    { id:"P2-3", fecha: ago(0),  monto: CARRO2_MENSUAL, pagado: false, nota:"" },
  ];

  return {
    carros: [
      {
        id: "C1",
        nombre: "Carro 1",
        placa: "ABC-123",
        modelo: "Chevrolet Aveo 2019",
        conductor: "Carlos R.",
        tipo: "diario",
        valorDiario: CARRO1_DIARIO,
        color: C.car1,
        colorDim: C.car1Dim,
        icon: "🚗",
        activo: true,
        gastos: [
          { id:"G1-1", fecha: ago(5),  categoria:"Gasolina",    monto:80000, nota:"Tanque lleno" },
          { id:"G1-2", fecha: ago(12), categoria:"Mantenimiento",monto:150000,nota:"Frenos" },
          { id:"G1-3", fecha: ago(20), categoria:"SOAT",         monto:320000,nota:"Renovación" },
        ],
      },
      {
        id: "C2",
        nombre: "Carro 2",
        placa: "XYZ-456",
        modelo: "Renault Logan 2020",
        conductor: "Andrés M.",
        tipo: "mensual",
        valorMensual: CARRO2_MENSUAL,
        color: C.car2,
        colorDim: C.car2Dim,
        icon: "🚙",
        activo: true,
        gastos: [
          { id:"G2-1", fecha: ago(8),  categoria:"Gasolina",    monto:70000, nota:"" },
          { id:"G2-2", fecha: ago(30), categoria:"Aceite",       monto:85000, nota:"5W30" },
        ],
      },
    ],
    pagos: { C1: pagos1, C2: pagos2 },
  };
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function FlotaTracker({ onBack }) {
  const {
    cars, loading, online,
    togglePayment, deletePayment, addWorkDay, addExpense, updateCar,
  } = useFlotaData();

  const [view,        setView]        = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(td().slice(0,7));
  const [modal,       setModal]       = useState(null);
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
      const pagoMes = pagosMes[0];
      const val     = carro.valor_mensual || CARRO2_MENSUAL;
      return { esperadoMes:val, cobrado:pagoMes?.pagado?val:0, pendiente:pagoMes?.pagado?0:val, pagado:!!pagoMes?.pagado };
    }
  };

  const totalEsperado  = cars.reduce((s,c) => s + getStats(c).esperadoMes, 0);
  const totalCobrado   = cars.reduce((s,c) => s + getStats(c).cobrado, 0);
  const totalPendiente = cars.reduce((s,c) => s + getStats(c).pendiente, 0);
  const totalGastos    = cars.reduce((s,c) => s + (c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).reduce((a,g)=>a+g.monto,0), 0);
  const totalNeto      = totalCobrado - totalGastos;

  const marcarPagado = (carroId, pagoId) => {
    const carro = cars.find(c=>c.id===carroId);
    const pago  = carro?.pagos?.find(p=>p.id===pagoId);
    // Solo sincronizar cuando se marca como PAGADO (no cuando se desmarca)
    const isPaid = !pago?.pagado;
    togglePayment(carroId, pagoId);
    if (isPaid && pago) {
      // Escribir en localStorage para que FinanzApp lo recoja
      try {
        const pending = JSON.parse(localStorage.getItem("fa_pending_transactions")||"[]");
        pending.push({
          id: "flota-"+Date.now(),
          date: pago.fecha,
          type: "income",
          category: "flota_inc",
          subcategory: carro?.nombre||"Flota",
          account: "cash",
          amount: pago.monto,
          note: "Cobro "+(carro?.nombre)+" · "+(pago.fecha),
        });
        localStorage.setItem("fa_pending_transactions", JSON.stringify(pending));
      } catch {}
    }
    showToast(isPaid ? "Pago registrado ✓ (sincronizado con FinanzApp)" : "Pago desmarcado");
  };
  const agregarGasto      = (carroId, gasto)  => { addExpense(carroId, gasto);     showToast("Gasto registrado ✓");  setModal(null); };
  const agregarPagoDiario = (carroId, fecha)  => { addWorkDay(carroId, fecha);     showToast("Día agregado ✓");      setModal(null); };

  const nav = [
    {id:"dashboard",icon:"📊",label:"Resumen"},
    {id:"carro1",   icon:"🚗",label: cars[0]?.nombre||"Carro 1"},
    {id:"carro2",   icon:"🚙",label: cars[1]?.nombre||"Carro 2"},
    {id:"gastos",   icon:"🔧",label:"Gastos"},
  ];

  const [yStr, mStr] = filterMonth.split("-");

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,width:"100vw",height:"100vh",overflow:"hidden",color:C.text,display:"flex",flexDirection:"column"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,select,textarea{outline:none;font-family:inherit}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes su{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ft-spin{to{transform:rotate(360deg)}}
        .fu{animation:fu .3s ease both}
        .ft-row:hover{background:${C.cardHover}!important}
        .bp:active{transform:scale(.97)}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.textSub,cursor:"pointer",fontSize:13,fontWeight:600}}>← Suite</button>
        <div style={{fontSize:16,fontWeight:800,flex:1}}>🚗 FlotaTracker</div>
        <div style={{display:"flex",alignItems:"center",gap:4,background:C.card,borderRadius:8,padding:"5px 10px",border:`1px solid ${C.border}`}}>
          <button onClick={()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()-1);setFilterMonth(d.toISOString().slice(0,7));}} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:14,lineHeight:1}}>‹</button>
          <span style={{fontSize:11,fontWeight:700,minWidth:55,textAlign:"center"}}>{MONTHS[parseInt(mStr)-1]} {yStr}</span>
          <button onClick={()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()+1);if(d<=new Date())setFilterMonth(d.toISOString().slice(0,7));}} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:14,lineHeight:1}}>›</button>
        </div>
        <button onClick={()=>setSidebar(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:14}}>⚙</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:58}}>
        {loading && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:14}}>
            <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"ft-spin .8s linear infinite"}}/>
            <div style={{fontSize:13,color:C.textMuted}}>Cargando datos...</div>
          </div>
        )}
        {!loading && view==="dashboard" && <Dashboard carros={cars} getStats={getStats} totalEsperado={totalEsperado} totalCobrado={totalCobrado} totalPendiente={totalPendiente} totalGastos={totalGastos} totalNeto={totalNeto} filterMonth={filterMonth} setView={setView} />}
        {!loading && view==="carro1"    && cars[0] && <CarroView carro={cars[0]} stats={getStats(cars[0])} pagos={cars[0]?.pagos||[]} filterMonth={filterMonth} marcarPagado={marcarPagado} eliminarPago={(carId,pagoId)=>{deletePayment(carId,pagoId);showToast("Registro eliminado","err");}} setModal={setModal} />}
        {!loading && view==="carro2"    && cars[1] && <CarroView carro={cars[1]} stats={getStats(cars[1])} pagos={cars[1]?.pagos||[]} filterMonth={filterMonth} marcarPagado={marcarPagado} eliminarPago={(carId,pagoId)=>{deletePayment(carId,pagoId);showToast("Registro eliminado","err");}} setModal={setModal} />}
        {!loading && view==="gastos"    && <GastosView carros={cars} filterMonth={filterMonth} setModal={setModal} totalGastos={totalGastos} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:50}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 0",border:"none",background:"transparent",color:view===n.id?"#fff":C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600,borderTop:view===n.id?"2px solid "+(view==="carro1"?C.car1:view==="carro2"?C.car2:C.green):"2px solid transparent"}}>
            <span style={{fontSize:18}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {modal?.type==="gasto"    && <GastoModal carroId={modal.carroId} carros={cars} onClose={()=>setModal(null)} onAdd={agregarGasto}/>}
      {modal?.type==="dia"      && <DiaModal   carroId={modal.carroId} onClose={()=>setModal(null)} onAdd={agregarPagoDiario} cars={cars}/>}

      {/* SIDEBAR CONFIGURACIÓN */}
      {sidebar && <>
        <div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"#0009",zIndex:200}}/>
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:Math.min(320,window.innerWidth-40),background:C.surface,borderLeft:`1px solid ${C.border}`,zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"18px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div style={{fontWeight:800,fontSize:16}}>⚙ Configuración</div>
            <button onClick={()=>setSidebar(false)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
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
              <CarroConfig key={carro.id} carro={carro} onSave={(updates)=>{updateCar(carro.id,updates);showToast(`${carro.nombre} actualizado ✓`);}}/>
            ))}
          </div>
        </div>
      </>}

      {toast && <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",background:toast.t==="err"?C.red:C.green,color:"#fff",padding:"8px 20px",borderRadius:100,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap",animation:"su .25s ease"}}>{toast.m}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({carros,getStats,totalEsperado,totalCobrado,totalPendiente,totalGastos,totalNeto,filterMonth,setView}) {
  const pctCobrado = totalEsperado > 0 ? Math.round((totalCobrado/totalEsperado)*100) : 0;

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">

      {/* HERO */}
      <div style={{background:`linear-gradient(135deg,#0A1628,${C.card})`,border:`1px solid ${C.car1}44`,borderRadius:20,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${C.car1}0D`}}/>
        <div style={{fontSize:11,color:C.car1,fontWeight:700,letterSpacing:1,marginBottom:4}}>INGRESOS DEL MES</div>
        <div style={{fontSize:34,fontWeight:900,letterSpacing:-1,marginBottom:2}}>{fmt(totalCobrado)}</div>
        <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>de {fmt(totalEsperado)} esperados</div>

        {/* BARRA PROGRESO */}
        <div style={{height:8,borderRadius:4,background:C.border,marginBottom:6}}>
          <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.car1},${C.car2})`,width:`${pctCobrado}%`,transition:"width 1s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:C.car1,fontWeight:700}}>{pctCobrado}% cobrado</span>
          <span style={{color:totalPendiente>0?C.yellow:C.green,fontWeight:700}}>{fmt(totalPendiente)} pendiente</span>
        </div>

        <div style={{display:"flex",gap:12,marginTop:16,paddingTop:14,borderTop:`1px solid ${C.car1}22`}}>
          {[[C.green,"💰","Cobrado",fmt(totalCobrado)],[C.red,"🔧","Gastos",fmt(totalGastos)],[totalNeto>=0?C.green:C.red,"=","Neto",fmt(totalNeto)]].map(([color,icon,label,val])=>(
            <div key={label} style={{flex:1}}>
              <div style={{fontSize:9,color,fontWeight:700,marginBottom:2}}>{icon} {label.toUpperCase()}</div>
              <div style={{fontSize:14,fontWeight:900,color}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TARJETAS POR CARRO */}
      {carros.map(carro => {
        const s = getStats(carro);
        const pct = s.esperadoMes > 0 ? Math.min(100, Math.round((s.cobrado/s.esperadoMes)*100)) : 0;
        const carColor  = carro.color   || (carro.id==="C1"?C.car1:C.car2);
        const carDim    = carro.color_dim|| (carro.id==="C1"?C.car1Dim:C.car2Dim);
        const valDiario = carro.valor_diario  || CARRO1_DIARIO;
        const valMensual= carro.valor_mensual || CARRO2_MENSUAL;
        return (
          <button key={carro.id} onClick={()=>setView(carro.id==="C1"?"carro1":"carro2")} className="bp"
            style={{background:`linear-gradient(135deg,${carDim},${C.card})`,border:`1px solid ${carColor}44`,borderRadius:18,padding:18,textAlign:"left",cursor:"pointer",color:C.text,width:"100%",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:carColor+"22",border:`1px solid ${carColor}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{carro.icon||"🚗"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:800}}>{carro.nombre}</div>
                <div style={{fontSize:11,color:C.textSub}}>{carro.conductor} · {carro.placa}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:900,color:carColor}}>{fmt(s.cobrado)}</div>
                <div style={{fontSize:10,color:C.textMuted}}>cobrado</div>
              </div>
            </div>

            {carro.tipo === "diario" ? (
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Días pagados</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.green}}>{s.diasPagados}</div>
                </div>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Días pendientes</div>
                  <div style={{fontSize:16,fontWeight:800,color:s.diasPendientes>0?C.yellow:C.green}}>{s.diasPendientes}</div>
                </div>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Valor/día</div>
                  <div style={{fontSize:16,fontWeight:800,color:carColor}}>{fmt(valDiario)}</div>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Mensualidad</div>
                  <div style={{fontSize:16,fontWeight:800,color:carColor}}>{fmt(valMensual)}</div>
                </div>
                <div style={{flex:2,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Estado mes actual</div>
                  <div style={{fontSize:15,fontWeight:800,color:s.pagado?C.green:C.yellow}}>{s.pagado?"✓ Pagado":"⏳ Pendiente"}</div>
                </div>
              </div>
            )}

            <div style={{height:6,borderRadius:3,background:C.border}}>
              <div style={{height:"100%",borderRadius:3,background:carro.color,width:`${pct}%`,transition:"width 1s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.textMuted}}>
              <span>{pct}% del mes cobrado</span>
              <span style={{color:carro.color}}>Ver detalle →</span>
            </div>
          </button>
        );
      })}

      {/* TIP FINANCIERO */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
        <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:6}}>💡 RESUMEN DEL MES</div>
        <div style={{display:"grid",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Ingreso esperado total</span>
            <span style={{fontWeight:700}}>{fmt(totalEsperado)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Ya cobrado</span>
            <span style={{fontWeight:700,color:C.green}}>{fmt(totalCobrado)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Por cobrar</span>
            <span style={{fontWeight:700,color:C.yellow}}>{fmt(totalPendiente)}</span>
          </div>
          <div style={{height:1,background:C.border,margin:"4px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Gastos de carros</span>
            <span style={{fontWeight:700,color:C.red}}>-{fmt(totalGastos)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
            <span style={{fontWeight:700}}>Ganancia neta</span>
            <span style={{fontWeight:900,color:totalNeto>=0?C.green:C.red}}>{fmt(totalNeto)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA POR CARRO ──────────────────────────────────────────────────────────
function CarroView({carro,stats,pagos,filterMonth,marcarPagado,eliminarPago,setModal}) {
  const pagosMes = pagos.filter(p=>p.fecha.startsWith(filterMonth));
  const pagosOrdenados = [...pagosMes].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">

      {/* HEADER CARRO */}
      <div style={{background:`linear-gradient(135deg,${carro.colorDim},${C.card})`,border:`1px solid ${carro.color}44`,borderRadius:20,padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:16,background:carro.color+"22",border:`1px solid ${carro.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{carro.icon}</div>
          <div>
            <div style={{fontSize:20,fontWeight:900}}>{carro.nombre}</div>
            <div style={{fontSize:12,color:C.textSub}}>{carro.modelo} · {carro.placa}</div>
            <div style={{fontSize:12,color:carro.color,fontWeight:600}}>Conductor: {carro.conductor}</div>
          </div>
        </div>

        {carro.tipo === "diario" ? (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {l:"Días pagados",  v:stats.diasPagados,    c:C.green},
                {l:"Días pendientes",v:stats.diasPendientes,c:stats.diasPendientes>0?C.yellow:C.green},
                {l:"Días laborales", v:stats.workDaysTotal,  c:C.textSub},
              ].map(i=>(
                <div key={i.l} style={{background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>{i.l.toUpperCase()}</div>
                  <div style={{fontSize:20,fontWeight:900,color:i.c}}>{i.v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:C.textSub}}>Cobrado este mes</span>
              <span style={{fontSize:14,fontWeight:800,color:carro.color}}>{fmt(stats.cobrado)} / {fmt(stats.esperadoMes)}</span>
            </div>
            <div style={{height:8,borderRadius:4,background:C.border}}>
              <div style={{height:"100%",borderRadius:4,background:carro.color,width:`${Math.min(100,Math.round((stats.cobrado/Math.max(stats.esperadoMes,1))*100))}%`,transition:"width 1s ease"}}/>
            </div>
          </>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {l:"Mensualidad",v:fmt(carro.valorMensual),c:carro.color},
              {l:"Estado",     v:stats.pagado?"✓ Pagado":"⏳ Pendiente",c:stats.pagado?C.green:C.yellow},
            ].map(i=>(
              <div key={i.l} style={{background:C.bg,borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>{i.l.toUpperCase()}</div>
                <div style={{fontSize:15,fontWeight:800,color:i.c}}>{i.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN AGREGAR */}
      {carro.tipo==="diario" && (
        <button onClick={()=>setModal({type:"dia",carroId:carro.id})} className="bp"
          style={{background:carro.color+"22",border:`1px solid ${carro.color}44`,borderRadius:12,padding:12,color:carro.color,fontWeight:700,fontSize:14,cursor:"pointer"}}>
          + Agregar día de trabajo
        </button>
      )}

      {/* LISTA DE PAGOS */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>
          {carro.tipo==="diario"?"REGISTRO DE DÍAS":"HISTORIAL DE PAGOS"} ({pagosOrdenados.length})
        </div>

        {pagosOrdenados.length===0 && (
          <div style={{textAlign:"center",padding:28,color:C.textMuted,fontSize:13,background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}>
            📭 Sin registros este mes
          </div>
        )}

        <div style={{display:"grid",gap:8}}>
          {pagosOrdenados.map(pago => {
            const fecha = new Date(pago.fecha+"T12:00");
            const diaSemana = DAYS_ES[fecha.getDay()];
            return (
              <div key={pago.id} style={{background:C.card,border:"1px solid "+(pago.pagado?carro.color+"33":C.yellow+"33"),borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                {/* DÍA / FECHA */}
                <div style={{width:46,height:46,borderRadius:12,background:pago.pagado?carro.color+"22":C.yellow+"15",border:"1px solid "+(pago.pagado?carro.color+"44":C.yellow+"33"),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{fontSize:8,fontWeight:700,color:pago.pagado?carro.color:C.yellow}}>{diaSemana.toUpperCase()}</div>
                  <div style={{fontSize:16,fontWeight:900,color:pago.pagado?carro.color:C.yellow}}>{fecha.getDate()}</div>
                </div>

                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fmt(pago.monto)}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{pago.fecha}{pago.nota?` · ${pago.nota}`:""}</div>
                </div>

                {/* TOGGLE PAGADO */}
                <button onClick={()=>marcarPagado(carro.id,pago.id)} className="bp"
                  style={{padding:"6px 14px",borderRadius:100,border:"1px solid "+(pago.pagado?carro.color:C.yellow),background:pago.pagado?carro.color+"22":C.yellow+"15",color:pago.pagado?carro.color:C.yellow,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {pago.pagado?"✓ Pagado":"⏳ Pendiente"}
                </button>
                {/* ELIMINAR */}
                <button onClick={()=>eliminarPago&&eliminarPago(carro.id,pago.id)} className="bp"
                  style={{background:C.redDim,border:"1px solid "+C.red+"33",color:C.red,borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12,flexShrink:0}}>
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* GASTOS DEL CARRO */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted}}>GASTOS DEL CARRO</div>
          <button onClick={()=>setModal({type:"gasto",carroId:carro.id})} style={{fontSize:11,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>+ Agregar</button>
        </div>
        {(carro.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).length===0 && (
          <div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>Sin gastos este mes</div>
        )}
        <div style={{display:"grid",gap:8}}>
          {(carro.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).map(g=>(
            <div key={g.id} style={{background:C.card,border:`1px solid ${C.red}22`,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔧</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{g.categoria}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{g.fecha}{g.nota?` · ${g.nota}`:""}</div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:C.red}}>-{fmt(g.monto)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GASTOS VIEW ──────────────────────────────────────────────────────────────
function GastosView({carros,filterMonth,setModal,totalGastos}) {
  const allGastos = carros.flatMap(c =>
    (c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).map(g=>({...g,carroNombre:c.nombre,carroColor:c.color,carroIcon:c.icon}))
  ).sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const totalPorCarro = carros.map(c=>({
    ...c,
    total:(c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).reduce((s,g)=>s+g.monto,0)
  }));

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">
      <div style={{background:`linear-gradient(135deg,${C.redDim},${C.card})`,border:`1px solid ${C.red}44`,borderRadius:18,padding:18}}>
        <div style={{fontSize:11,color:C.red,fontWeight:700,marginBottom:3}}>TOTAL GASTOS DEL MES</div>
        <div style={{fontSize:30,fontWeight:900}}>{fmt(totalGastos)}</div>
        <div style={{display:"flex",gap:12,marginTop:12}}>
          {totalPorCarro.map(c=>(
            <div key={c.id} style={{flex:1,background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}>
              <div style={{fontSize:16}}>{c.icon}</div>
              <div style={{fontSize:10,color:C.textMuted,margin:"2px 0"}}>{c.nombre}</div>
              <div style={{fontSize:13,fontWeight:800,color:C.red}}>{fmt(c.total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTONES AGREGAR */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {carros.map(c=>(
          <button key={c.id} onClick={()=>setModal({type:"gasto",carroId:c.id})} className="bp"
            style={{background:c.colorDim,border:`1px solid ${c.color}44`,borderRadius:12,padding:12,color:c.color,fontWeight:700,fontSize:13,cursor:"pointer"}}>
            + Gasto {c.nombre}
          </button>
        ))}
      </div>

      {allGastos.length===0 && <div style={{textAlign:"center",padding:28,color:C.textMuted,fontSize:13}}>📭 Sin gastos este mes</div>}

      <div style={{display:"grid",gap:8}}>
        {allGastos.map(g=>(
          <div key={g.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:g.carroColor+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.carroIcon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700}}>{g.categoria}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{g.carroNombre} · {g.fecha}{g.nota?` · ${g.nota}`:""}</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:C.red}}>-{fmt(g.monto)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function GastoModal({carroId,carros,onClose,onAdd}) {
  const carro = carros.find(c=>c.id===carroId);
  const [form,setForm] = useState({fecha:td(),categoria:"Gasolina",monto:"",nota:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const cats = ["Gasolina","Aceite","Llantas","SOAT","Revisión técnica","Lavado","Mantenimiento","Repuestos","Seguro","Parqueadero","Otro"];
  return (
    <ModalWrap title={"Gasto — "+(carro?.nombre)} onClose={onClose} color={C.red}>
      <div style={{background:C.redDim,border:`1px solid ${C.red}33`,borderRadius:12,padding:14}}>
        <div style={{fontSize:11,color:C.textMuted,marginBottom:3}}>MONTO</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:18,color:C.textMuted}}>$</span>
          <input type="number" value={form.monto} onChange={e=>set("monto",e.target.value)} placeholder="0"
            style={{flex:1,background:"transparent",border:"none",fontSize:24,fontWeight:900,color:C.red}}/>
        </div>
      </div>
      <MF label="Categoría">
        <select value={form.categoria} onChange={e=>set("categoria",e.target.value)} style={inp}>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
      </MF>
      <MF label="Fecha"><input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} style={inp}/></MF>
      <MF label="Nota (opcional)"><input value={form.nota} onChange={e=>set("nota",e.target.value)} placeholder="Detalles..." style={inp}/></MF>
      <button onClick={()=>form.monto&&onAdd(carroId,{...form,monto:parseFloat(form.monto)})}
        style={{...btn,background:form.monto?C.red:C.border,color:form.monto?"#fff":C.textMuted}}>
        Registrar Gasto
      </button>
    </ModalWrap>
  );
}

function DiaModal({carroId, onClose, onAdd, cars}) {
  const [fecha, setFecha] = useState(td());
  const carro = cars?.find(c=>c.id===carroId);
  const valor = carro?.valor_diario || CARRO1_DIARIO;
  return (
    <ModalWrap title="Agregar Día de Trabajo" onClose={onClose} color={C.car1}>
      <div style={{background:C.car1Dim,border:`1px solid ${C.car1}33`,borderRadius:12,padding:14,textAlign:"center"}}>
        <div style={{fontSize:11,color:C.textMuted,marginBottom:2}}>VALOR DEL DÍA</div>
        <div style={{fontSize:28,fontWeight:900,color:C.car1}}>{fmt(valor)}</div>
      </div>
      <MF label="Fecha del día trabajado">
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
      </MF>
      <button onClick={()=>onAdd(carroId,fecha)} style={{...btn,background:C.car1,color:"#fff"}}>
        Agregar Día
      </button>
    </ModalWrap>
  );
}

function CarroConfig({carro, onSave}) {
  const [form, setForm] = useState({
    nombre:       carro.nombre       || '',
    placa:        carro.placa        || '',
    modelo:       carro.modelo       || '',
    conductor:    carro.conductor    || '',
    tipo:         carro.tipo         || 'diario',
    valor_diario: carro.valor_diario || 70000,
    valor_mensual:carro.valor_mensual|| 500000,
  });
  const [open, setOpen] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={{background:C.card,border:`1px solid ${carro.color}44`,borderRadius:14,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:C.text}}>
        <span style={{fontSize:22}}>{carro.icon}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:700}}>{carro.nombre}</div>
          <div style={{fontSize:11,color:C.textMuted}}>{carro.placa} · {carro.modelo}</div>
        </div>
        <span style={{color:carro.color,fontSize:16}}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{padding:"0 14px 14px",display:"grid",gap:10,borderTop:`1px solid ${C.border}`}}>
          <div style={{height:10}}/>
          {[["Nombre",   "nombre",    "text",   "Ej: Mi Carro"],
            ["Placa",    "placa",     "text",   "Ej: ABC-123"],
            ["Modelo",   "modelo",    "text",   "Ej: Chevrolet Aveo 2019"],
            ["Conductor","conductor", "text",   "Nombre del conductor"],
          ].map(([label,key,type,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TIPO DE COBRO</div>
            <div style={{display:"flex",gap:8}}>
              {[["diario","Diario (por día)"],["mensual","Mensual (fijo)"]].map(([v,l])=>(
                <button key={v} onClick={()=>set("tipo",v)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.tipo===v?carro.color:C.border),background:form.tipo===v?carro.color+"22":"transparent",color:form.tipo===v?carro.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
              ))}
            </div>
          </div>
          {form.tipo==="diario" && (
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR POR DÍA (COP)</div>
              <input type="number" value={form.valor_diario} onChange={e=>set("valor_diario",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          )}
          {form.tipo==="mensual" && (
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR MENSUAL (COP)</div>
              <input type="number" value={form.valor_mensual} onChange={e=>set("valor_mensual",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          )}
          <button onClick={()=>{onSave(form);setOpen(false);}}
            style={{background:carro.color,color:"#fff",border:"none",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}

function ModalWrap({title,onClose,color,children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 32px",maxHeight:"88vh",overflowY:"auto",borderTop:`1px solid ${color}55`,animation:"su .3s ease"}}>
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

function MF({label,children}){return(<div><div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>{children}</div>);}
const inp={width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13};
const btn={width:"100%",marginTop:4,padding:13,borderRadius:12,border:"none",fontWeight:800,fontSize:15,cursor:"pointer"};
