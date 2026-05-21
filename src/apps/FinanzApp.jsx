import { useState } from "react";
import { useFinanzData } from "../hooks/useFinanzData.js";
import { useNotifications } from "../hooks/useNotifications.js";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#0A0E1A",surface:"#111827",card:"#1A2235",cardHover:"#1F2A40",
  border:"#2A3550",accent:"#4FFFB0",accentDim:"#1A4A35",accentText:"#00D97E",
  red:"#FF4D6A",redDim:"#3A1525",blue:"#4D9EFF",blueDim:"#1A2E4A",
  yellow:"#FFD166",purple:"#A78BFA",orange:"#FB923C",orangeDim:"#2A1A0A",
  text:"#F0F4FF",textSub:"#8899BB",textMuted:"#4A5A75",
};

const CATEGORIES = {
  income:[
    {id:"salary",    label:"Sueldo",        icon:"💼",subs:["Empresa","Freelance","Bonificación","Horas extra"]},
    {id:"business",  label:"Negocio",        icon:"🏪",subs:["Ventas","Servicios","Comisiones"]},
    {id:"investment",label:"Inversión",      icon:"📈",subs:["Dividendos","Intereses","Cripto","CDT"]},
    {id:"loan_pay",  label:"Cobro Préstamo", icon:"🤝",subs:["Abono","Pago total","Intereses cobrados"]},
    {id:"other_in",  label:"Otros Ingresos", icon:"💰",subs:["Regalo","Reembolso","Varios"]},
  ],
  expense:[
    {id:"housing",   label:"Vivienda",        icon:"🏠",subs:["Arriendo","Hipoteca","Servicios","Administración","Internet"]},
    {id:"food",      label:"Alimentación",    icon:"🍽️",subs:["Mercado","Restaurante","Domicilios","Cafetería"]},
    {id:"transport", label:"Transporte",      icon:"🚗",subs:["Gasolina","SITP/Metro","Taxi/Uber","Parqueadero","Mantenimiento"]},
    {id:"health",    label:"Salud",           icon:"🏥",subs:["Medicina","Gimnasio","Farmacia","Médico","EPS"]},
    {id:"education", label:"Educación",       icon:"📚",subs:["Universidad","Cursos","Libros","Útiles"]},
    {id:"entertain", label:"Entretenimiento", icon:"🎮",subs:["Streaming","Salidas","Viajes","Hobbies"]},
    {id:"clothing",  label:"Ropa",            icon:"👗",subs:["Ropa","Calzado","Accesorios"]},
    {id:"savings",   label:"Ahorros",         icon:"🏦",subs:["Fondo emergencia","Meta viaje","Pensión voluntaria"]},
    {id:"debt",      label:"Deudas",          icon:"💳",subs:["Tarjeta crédito","Préstamo personal","Cuota vehículo"]},
    {id:"loans_out", label:"Préstamos",       icon:"🤝",subs:["Préstamo personal","Préstamo familiar","Préstamo laboral"]},
    {id:"other",     label:"Otros",           icon:"📦",subs:["Varios","Impuestos","Donaciones"]},
  ],
};

const ACCOUNTS_DEF = [
  {id:"cash",        label:"Efectivo",    icon:"💵",color:C.accentText},
  {id:"nequi",       label:"Nequi",       icon:"💜",color:C.purple},
  {id:"bbva",        label:"BBVA",        icon:"🔵",color:C.blue},
  {id:"daviplata",   label:"Daviplata",   icon:"🔴",color:C.red},
  {id:"bancolombia", label:"Bancolombia", icon:"🟡",color:C.yellow},
  {id:"savings_acc", label:"Ahorros",     icon:"🏦",color:"#34D399"},
];

const fmtCOP = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
const today  = () => new Date().toISOString().slice(0,10);
const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── SEED ─────────────────────────────────────────────────────────────────────
function seedTx(){
  const now=new Date(); let id=1; const tx=[];
  const add=(days,type,cat,sub,acc,amount,note,loanId=null)=>{
    const d=new Date(now); d.setDate(d.getDate()-days);
    tx.push({id:id++,date:d.toISOString().slice(0,10),type,category:cat,subcategory:sub,account:acc,amount,note,loanId});
  };
  add(0,"income","salary","Empresa","bancolombia",4200000,"Sueldo mensual");
  add(1,"expense","food","Mercado","nequi",320000,"Éxito");
  add(2,"expense","transport","Gasolina","cash",85000,"Full tanque");
  add(3,"expense","housing","Arriendo","bbva",950000,"Arriendo mes");
  add(4,"expense","entertain","Streaming","nequi",52900,"Netflix+Spotify");
  add(5,"income","business","Ventas","nequi",800000,"Proyecto web");
  add(6,"expense","food","Restaurante","cash",45000,"Almuerzo");
  add(7,"expense","health","Gimnasio","nequi",120000,"Mes gym");
  add(9,"income","salary","Bonificación","bancolombia",500000,"Bonificación Q3");
  add(14,"expense","savings","Fondo emergencia","savings_acc",400000,"Ahorro mensual");
  add(16,"expense","debt","Tarjeta crédito","bbva",650000,"Pago tarjeta");
  add(18,"income","investment","Intereses","savings_acc",95000,"Rendimientos CDT");
  add(25,"expense","health","Farmacia","cash",55000,"Medicamentos");
  return tx;
}

function seedLoans(){
  const now=new Date();
  const d=days=>{const x=new Date(now);x.setDate(x.getDate()-days);return x.toISOString().slice(0,10);};
  return [
    {id:"L1",debtor:"Carlos Rodríguez", amount:500000,  balance:500000, date:d(45),account:"cash",       note:"Préstamo personal",status:"active",payments:[]},
    {id:"L2",debtor:"María González",   amount:1200000, balance:800000, date:d(60),account:"nequi",      note:"Auxilio médico",   status:"active",payments:[
      {id:"P1",date:d(30),amount:200000,note:"Primer abono"},
      {id:"P2",date:d(10),amount:200000,note:"Segundo abono"},
    ]},
    {id:"L3",debtor:"Andrés Martínez",  amount:300000,  balance:0,      date:d(90),account:"bancolombia",note:"Préstamo trabajo", status:"paid",  payments:[
      {id:"P3",date:d(60),amount:150000,note:"Primer pago"},
      {id:"P4",date:d(20),amount:150000,note:"Pago final"},
    ]},
    {id:"L4",debtor:"Luisa Fernández",  amount:750000,  balance:750000, date:d(5), account:"nequi",      note:"Para viaje",       status:"active",payments:[]},
  ];
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function FinanzApp({ onBack }){
  // ── Supabase hook ──────────────────────────────────────────────────────────
  const {
    transactions, loans, accountBalances, loading, online,
    addTransaction: dbAddTx,
    deleteTransaction: dbDelTx,
    addLoan: dbAddLoan,
    addPayment: dbAddPayment,
    updateAccountBalance,
  } = useFinanzData();

  // Cuentas: definición base + saldos iniciales desde Supabase
  const accounts = ACCOUNTS_DEF.map(a => ({
    ...a,
    initialBalance: accountBalances[a.id] ?? 0
  }));
  const [view,setView]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [showAddModal,setShowAddModal]=useState(false);
  const [addModalOpts,setAddModalOpts]=useState({});
  const [selAccount,setSelAccount]=useState(null);
  const [filterMonth,setFilterMonth]=useState(today().slice(0,7));
  const [settings,setSettings]=useState({currency:"COP",budgets:{}});
  const [toast,setToast]=useState(null);
  const [showLoanModal,setShowLoanModal]=useState(false);
  const [showPayModal,setShowPayModal]=useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500);};

  const computedAccounts=accounts.map(acc=>{
    const txs=transactions.filter(t=>t.account===acc.id);
    const totalIn=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const totalOut=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    return {...acc,balance:acc.initialBalance+totalIn-totalOut};
  });

  const monthTxs=transactions.filter(t=>t.date.startsWith(filterMonth));
  const totalIncome=monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const netBalance=totalIncome-totalExpense;

  const addTransaction=async tx=>{
    await dbAddTx({...tx,id:"tx-"+Date.now()});
    showToast("Movimiento registrado ✓");
    setShowAddModal(false);
    setAddModalOpts({});
  };
  const deleteTransaction=async id=>{
    await dbDelTx(id);
    showToast("Eliminado","error");
  };

  const addLoan=async data=>{
    await dbAddLoan(data);
    showToast(`Préstamo registrado a ${data.debtor} ✓`);
    setShowLoanModal(false);
  };

  const addPayment=async(loan,payData)=>{
    await dbAddPayment(loan,payData);
    showToast(loan.balance-parseFloat(payData.amount)<=0?`¡Préstamo de ${loan.debtor} saldado! 🎉`:"Abono registrado ✓");
    setShowPayModal(null);
  };

  const openAddModal=opts=>{setAddModalOpts(opts||{});setShowAddModal(true);};

  return(
    <div style={{fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg,height:"100%",color:C.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        .fa-scroll::-webkit-scrollbar{width:4px}
        .fa-scroll::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes fa-slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fa-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fa-toastIn{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fa-spin{to{transform:rotate(360deg)}}
        .fa-fade-up{animation:fa-fadeUp .35s ease both}
        .fa-tx-row:hover{background:${C.cardHover}!important}
        .fa-btn:active{transform:scale(.96)}
        @media(max-width:640px){.fa-desktop{display:none!important}}
        @media(min-width:641px){.fa-mobile{display:none!important}}
      `}</style>
      {loading && (
        <div style={{position:"absolute",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:14}}>
          <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"fa-spin .8s linear infinite"}}/>
          <div style={{fontSize:14,color:C.textMuted}}>Cargando datos...</div>
        </div>
      )}
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
        <DesktopNav view={view} setView={setView} setSidebarOpen={setSidebarOpen} loans={loans}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <TopBar view={view} filterMonth={filterMonth} setFilterMonth={setFilterMonth} setSidebarOpen={setSidebarOpen} openAddModal={openAddModal} onBack={onBack}/>
          <div className="fa-scroll" style={{flex:1,overflowY:"auto",paddingBottom:80,minHeight:0}}>
            {view==="dashboard" && <Dashboard transactions={transactions} accounts={computedAccounts} loans={loans} totalIncome={totalIncome} totalExpense={totalExpense} netBalance={netBalance} filterMonth={filterMonth} setView={setView} setSelAccount={setSelAccount} monthTxs={monthTxs}/>}
            {view==="movements" && <Movements transactions={transactions} filterMonth={filterMonth} deleteTransaction={deleteTransaction} openAddModal={openAddModal} loans={loans}/>}
            {view==="accounts"  && <AccountsView accounts={computedAccounts} transactions={transactions} selAccount={selAccount} setSelAccount={setSelAccount} filterMonth={filterMonth} showToast={showToast}/>}
            {view==="loans"     && <LoansView loans={loans} transactions={transactions} setShowLoanModal={setShowLoanModal} setShowPayModal={setShowPayModal} accounts={computedAccounts} showToast={showToast}/>}
            {view==="stats"     && <Stats monthTxs={monthTxs} totalIncome={totalIncome} totalExpense={totalExpense} transactions={transactions} filterMonth={filterMonth}/>}
          </div>
        </div>
        <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} accounts={computedAccounts} updateAccountBalance={updateAccountBalance} settings={settings} setSettings={setSettings} showToast={showToast}/>
      </div>
      <MobileNav view={view} setView={setView} openAddModal={openAddModal} loans={loans}/>
      <button onClick={()=>openAddModal()} className="fa-btn fa-mobile" style={{position:"fixed",bottom:82,right:20,width:54,height:54,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:24,boxShadow:`0 8px 24px ${C.accent}66`,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      {showAddModal  && <AddModal  onClose={()=>{ setShowAddModal(false); setAddModalOpts({}); }} onAdd={addTransaction} accounts={accounts} opts={addModalOpts}/>}
      {showLoanModal && <LoanModal onClose={()=>setShowLoanModal(false)} onAdd={addLoan} accounts={accounts}/>}
      {showPayModal  && <PayModal  onClose={()=>setShowPayModal(null)} loan={showPayModal} onPay={addPayment} accounts={accounts}/>}
      {toast && <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?C.red:C.accent,color:toast.type==="error"?"#fff":"#000",padding:"10px 20px",borderRadius:100,fontWeight:700,fontSize:14,zIndex:9999,animation:"fa-toastIn .3s ease",whiteSpace:"nowrap",boxShadow:"0 8px 24px #0006"}}>{toast.msg}</div>}
    </div>
  );
}

// ─── DESKTOP NAV ──────────────────────────────────────────────────────────────
function DesktopNav({view,setView,setSidebarOpen,loans}){
  const badge=loans.filter(l=>l.status==="active").length;
  const items=[
    {id:"dashboard",icon:"⬡",label:"Inicio"},
    {id:"movements",icon:"↕",label:"Movimientos"},
    {id:"accounts", icon:"◈",label:"Cuentas"},
    {id:"loans",    icon:"🤝",label:"Por Cobrar",badge},
    {id:"stats",    icon:"◉",label:"Estadísticas"},
  ];
  return(
    <div className="fa-desktop" style={{width:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 16px",flexShrink:0}}>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:20,fontWeight:800,color:C.accent,letterSpacing:-1}}>💰 FinanzApp</div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>Control financiero total</div>
      </div>
      {items.map(item=>(
        <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:4,background:view===item.id?C.accentDim:"transparent",color:view===item.id?C.accent:C.textSub,fontWeight:view===item.id?700:500,fontSize:14,transition:"all .2s",textAlign:"left",position:"relative"}}>
          <span style={{fontSize:18}}>{item.icon}</span>{item.label}
          {item.badge>0&&<span style={{marginLeft:"auto",background:C.orange,color:"#fff",borderRadius:100,fontSize:10,fontWeight:700,padding:"1px 7px"}}>{item.badge}</span>}
        </button>
      ))}
      <div style={{flex:1}}/>
      <button onClick={()=>setSidebarOpen(true)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.textSub,fontSize:14,fontWeight:500}}>⚙ Configuración</button>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({view,filterMonth,setFilterMonth,setSidebarOpen,openAddModal,onBack}){
  const titles={dashboard:"Dashboard",movements:"Movimientos",accounts:"Cuentas",loans:"Por Cobrar",stats:"Estadísticas"};
  const prev=()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()-1);setFilterMonth(d.toISOString().slice(0,7));};
  const next=()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()+1);if(d<=new Date())setFilterMonth(d.toISOString().slice(0,7));};
  const [y,m]=filterMonth.split("-");
  return(
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
      {onBack&&<button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.textSub,cursor:"pointer",fontSize:13,fontWeight:600}}>← Suite</button>}
      <div style={{fontSize:18,fontWeight:800,flex:1}}>{titles[view]||""}</div>
      <div style={{display:"flex",alignItems:"center",gap:4,background:C.card,borderRadius:10,padding:"6px 12px",border:`1px solid ${C.border}`}}>
        <button onClick={prev} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:16,padding:"0 4px"}}>‹</button>
        <span style={{fontSize:13,fontWeight:600,minWidth:70,textAlign:"center"}}>{MONTHS[parseInt(m)-1]} {y}</span>
        <button onClick={next} style={{background:"none",border:"none",color:C.textSub,cursor:"pointer",fontSize:16,padding:"0 4px"}}>›</button>
      </div>
      <button onClick={()=>openAddModal()} className="fa-btn fa-desktop" style={{background:C.accent,color:"#000",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Agregar</button>
      <button onClick={()=>setSidebarOpen(true)} className="fa-btn" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.textSub,cursor:"pointer",fontSize:16}}>⚙</button>
    </div>
  );
}

// ─── MOBILE NAV ───────────────────────────────────────────────────────────────
function MobileNav({view,setView,openAddModal,loans}){
  const badge=loans.filter(l=>l.status==="active").length;
  const items=[
    {id:"dashboard",icon:"⬡",label:"Inicio"},
    {id:"movements",icon:"↕",label:"Movimientos"},
    {id:"accounts", icon:"◈",label:"Cuentas"},
    {id:"loans",    icon:"🤝",label:"Cobrar",badge},
    {id:"stats",    icon:"◉",label:"Stats"},
  ];
  return(
    <div className="fa-mobile" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom,6px)"}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>setView(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0",border:"none",background:"transparent",color:view===item.id?C.accent:C.textMuted,cursor:"pointer",fontSize:10,fontWeight:600,position:"relative"}}>
          <span style={{fontSize:19}}>{item.icon}</span>{item.label}
          {item.badge>0&&<span style={{position:"absolute",top:6,right:"calc(50% - 16px)",background:C.orange,color:"#fff",borderRadius:100,fontSize:8,fontWeight:800,padding:"1px 5px"}}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({transactions,accounts,loans,totalIncome,totalExpense,netBalance,filterMonth,setView,setSelAccount,monthTxs}){
  const totalAssets=accounts.reduce((s,a)=>s+a.balance,0);
  const totalPending=loans.filter(l=>l.status==="active").reduce((s,l)=>s+l.balance,0);
  const expByCat={};
  monthTxs.filter(t=>t.type==="expense").forEach(t=>{expByCat[t.category]=(expByCat[t.category]||0)+t.amount;});
  const topCats=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i));
    const key=d.toISOString().slice(0,10);
    return{label:["Do","Lu","Ma","Mi","Ju","Vi","Sá"][d.getDay()],total:monthTxs.filter(t=>t.date===key&&t.type==="expense").reduce((s,t)=>s+t.amount,0)};
  });
  const maxDay=Math.max(...last7.map(d=>d.total),1);
  return(
    <div style={{padding:"20px 16px",display:"grid",gap:16}} className="fa-fade-up">
      <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.card})`,border:`1px solid ${C.accentText}33`,borderRadius:20,padding:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${C.accent}11`}}/>
        <div style={{fontSize:12,color:C.accentText,fontWeight:700,marginBottom:4}}>PATRIMONIO TOTAL</div>
        <div style={{fontSize:32,fontWeight:900,letterSpacing:-2}}>{fmtCOP(totalAssets)}</div>
        <div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
          <Pill color={C.accentText} label="Ingresos"   value={fmtCOP(totalIncome)}  icon="↑"/>
          <Pill color={C.red}        label="Egresos"    value={fmtCOP(totalExpense)} icon="↓"/>
          <Pill color={netBalance>=0?C.accentText:C.red} label="Balance" value={fmtCOP(netBalance)} icon="="/>
          {totalPending>0&&<Pill color={C.orange} label="Por cobrar" value={fmtCOP(totalPending)} icon="🤝"/>}
        </div>
      </div>
      <div>
        <SectionHeader title="Mis Cuentas" action="Ver todas" onAction={()=>setView("accounts")}/>
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4}}>
          {accounts.map(acc=>(
            <button key={acc.id} onClick={()=>{setSelAccount(acc.id);setView("accounts");}} className="fa-btn"
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",minWidth:130,flexShrink:0,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:22,marginBottom:6}}>{acc.icon}</div>
              <div style={{fontSize:11,color:C.textSub,fontWeight:600}}>{acc.label}</div>
              <div style={{fontSize:16,fontWeight:800,color:acc.balance>=0?C.text:C.red,marginTop:2}}>{fmtCOP(acc.balance)}</div>
            </button>
          ))}
        </div>
      </div>
      {loans.filter(l=>l.status==="active").length>0&&(
        <div style={{background:C.card,border:`1px solid ${C.orange}44`,borderRadius:16,padding:16}}>
          <SectionHeader title="🤝 Préstamos Pendientes" action="Ver todos" onAction={()=>setView("loans")}/>
          <div style={{display:"grid",gap:10,marginTop:8}}>
            {loans.filter(l=>l.status==="active").slice(0,3).map(loan=>(
              <div key={loan.id} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:C.orangeDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700}}>{loan.debtor}</div>
                  <div style={{height:4,borderRadius:2,background:C.border,marginTop:4}}>
                    <div style={{height:"100%",borderRadius:2,background:C.orange,width:`${Math.round((1-loan.balance/loan.amount)*100)}%`,transition:"width .8s ease"}}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.orange}}>{fmtCOP(loan.balance)}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>pendiente</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <SectionHeader title="Gastos últimos 7 días"/>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:70,marginTop:12}}>
          {last7.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",borderRadius:6,background:d.total?C.red:C.border,height:d.total?Math.max(6,(d.total/maxDay)*54):4,transition:"height .5s ease",position:"relative"}}>
                {d.total>0&&<div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",fontSize:8,color:C.textMuted,marginBottom:2,whiteSpace:"nowrap"}}>{(d.total/1000).toFixed(0)}k</div>}
              </div>
              <span style={{fontSize:10,color:C.textMuted}}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <SectionHeader title="Top Gastos por Categoría" action="Ver stats" onAction={()=>setView("stats")}/>
        <div style={{display:"grid",gap:10,marginTop:12}}>
          {topCats.map(([catId,amount])=>{
            const cat=CATEGORIES.expense.find(c=>c.id===catId)||{label:catId,icon:"📦"};
            const pct=Math.min(100,Math.round((amount/totalExpense)*100));
            return(
              <div key={catId}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13}}>{cat.icon} {cat.label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:C.red}}>{fmtCOP(amount)}</span>
                </div>
                <div style={{height:5,borderRadius:3,background:C.border}}>
                  <div style={{height:"100%",borderRadius:3,background:C.red,width:`${pct}%`,transition:"width .8s ease"}}/>
                </div>
              </div>
            );
          })}
          {topCats.length===0&&<EmptyState label="Sin gastos este mes"/>}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <SectionHeader title="Movimientos Recientes" action="Ver todos" onAction={()=>setView("movements")}/>
        <div style={{marginTop:8}}>
          {monthTxs.slice(0,5).map(tx=><TxRow key={tx.id} tx={tx} compact/>)}
          {monthTxs.length===0&&<EmptyState label="Sin movimientos este mes"/>}
        </div>
      </div>
    </div>
  );
}

// ─── MOVEMENTS ────────────────────────────────────────────────────────────────
function Movements({transactions,filterMonth,deleteTransaction,openAddModal,loans}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=transactions
    .filter(t=>t.date.startsWith(filterMonth))
    .filter(t=>filter==="all"||t.type===filter)
    .filter(t=>!search||[t.note,t.category,t.subcategory].join(" ").toLowerCase().includes(search.toLowerCase()));
  const grouped={};
  filtered.forEach(t=>{(grouped[t.date]=grouped[t.date]||[]).push(t);});
  const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
  return(
    <div style={{padding:"16px",display:"grid",gap:12}} className="fa-fade-up">
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
          style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 12px 10px 36px",color:C.text,fontSize:14}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[["all","Todos"],["income","Ingresos"],["expense","Gastos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:100,border:filter!==v?`1px solid ${C.border}`:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.accent:C.card,color:filter===v?"#000":C.textSub}}>{l}</button>
        ))}
      </div>
      {sortedDates.length===0&&<EmptyState label="Sin movimientos"/>}
      {sortedDates.map(date=>(
        <div key={date}>
          <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:6,paddingLeft:4}}>
            {new Date(date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
            {grouped[date].map((tx,i)=>(
              <TxRow key={tx.id} tx={tx} onDelete={()=>deleteTransaction(tx.id)} showDivider={i<grouped[date].length-1}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
function AccountsView({accounts,transactions,selAccount,setSelAccount,filterMonth,showToast}){
  const active=selAccount||accounts[0]?.id;
  const acc=accounts.find(a=>a.id===active)||accounts[0];
  const accTxs=transactions.filter(t=>t.account===active&&t.date.startsWith(filterMonth));
  const totalIn=accTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalOut=accTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  return(
    <div style={{padding:"16px",display:"grid",gap:16}} className="fa-fade-up">
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
        {accounts.map(a=>(
          <button key={a.id} onClick={()=>setSelAccount(a.id)} style={{padding:"10px 14px",borderRadius:14,border:active!==a.id?`1px solid ${C.border}`:"none",cursor:"pointer",background:active===a.id?C.accent:C.card,color:active===a.id?"#000":C.textSub,fontWeight:700,fontSize:13,flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>
      {acc&&(
        <div style={{background:`linear-gradient(135deg,${C.card},${C.cardHover})`,border:`1px solid ${acc.color}44`,borderRadius:20,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{fontSize:32}}>{acc.icon}</div>
            <div><div style={{fontSize:20,fontWeight:800}}>{acc.label}</div><div style={{fontSize:12,color:C.textMuted}}>Cuenta activa</div></div>
          </div>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>SALDO ACTUAL</div>
          <div style={{fontSize:36,fontWeight:900,color:acc.balance>=0?C.text:C.red,letterSpacing:-2}}>{fmtCOP(acc.balance)}</div>
          <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap"}}>
            <div><div style={{fontSize:11,color:C.accentText}}>↑ INGRESOS</div><div style={{fontSize:16,fontWeight:700}}>{fmtCOP(totalIn)}</div></div>
            <div><div style={{fontSize:11,color:C.red}}>↓ EGRESOS</div><div style={{fontSize:16,fontWeight:700}}>{fmtCOP(totalOut)}</div></div>
            <div><div style={{fontSize:11,color:C.yellow}}>= NETO</div><div style={{fontSize:16,fontWeight:700,color:(totalIn-totalOut)>=0?C.accentText:C.red}}>{fmtCOP(totalIn-totalOut)}</div></div>
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:13,fontWeight:700,color:C.textMuted,marginBottom:10}}>MOVIMIENTOS DEL MES ({accTxs.length})</div>
        {accTxs.length===0&&<EmptyState label="Sin movimientos en esta cuenta"/>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
          {accTxs.sort((a,b)=>b.date.localeCompare(a.date)).map((tx,i)=>(
            <TxRow key={tx.id} tx={tx} showDivider={i<accTxs.length-1}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOANS VIEW ───────────────────────────────────────────────────────────────
function LoansView({loans,transactions,setShowLoanModal,setShowPayModal,accounts,showToast}){
  const [filter,setFilter]=useState("active");
  const [selLoan,setSelLoan]=useState(null);
  const filtered=loans.filter(l=>filter==="all"||l.status===filter);
  const totalActive=loans.filter(l=>l.status==="active").reduce((s,l)=>s+l.balance,0);
  const totalLent=loans.reduce((s,l)=>s+l.amount,0);
  const totalRecov=loans.reduce((s,l)=>s+(l.amount-l.balance),0);
  const detail=selLoan?loans.find(l=>l.id===selLoan):null;

  if(detail)return(
    <LoanDetail loan={detail} transactions={transactions} onBack={()=>setSelLoan(null)} setShowPayModal={setShowPayModal} accounts={accounts}/>
  );

  return(
    <div style={{padding:"16px",display:"grid",gap:16}} className="fa-fade-up">
      <div style={{background:`linear-gradient(135deg,${C.orangeDim},${C.card})`,border:`1px solid ${C.orange}44`,borderRadius:20,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:`${C.orange}11`}}/>
        <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:4}}>TOTAL POR COBRAR</div>
        <div style={{fontSize:32,fontWeight:900,letterSpacing:-2}}>{fmtCOP(totalActive)}</div>
        <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
          <Pill color={C.orange}     label="Prestado" value={fmtCOP(totalLent)}  icon="📤"/>
          <Pill color={C.accentText} label="Cobrado"  value={fmtCOP(totalRecov)} icon="✓"/>
          <Pill color={C.textSub}    label="Activos"  value={`${loans.filter(l=>l.status==="active").length}`} icon="#"/>
        </div>
      </div>

      <button onClick={()=>setShowLoanModal(true)} className="fa-btn" style={{background:C.orange,color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        🤝 Registrar Nuevo Préstamo
      </button>

      <div style={{display:"flex",gap:8}}>
        {[["active","Activos"],["paid","Saldados"],["all","Todos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:100,border:filter!==v?`1px solid ${C.border}`:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.orange:C.card,color:filter===v?"#fff":C.textSub}}>{l}</button>
        ))}
      </div>

      {filtered.length===0&&<EmptyState label="No hay préstamos en esta categoría"/>}
      <div style={{display:"grid",gap:12}}>
        {filtered.map(loan=>{
          const pct=Math.round(((loan.amount-loan.balance)/loan.amount)*100);
          const acc=accounts.find(a=>a.id===loan.account);
          return(
            <button key={loan.id} onClick={()=>setSelLoan(loan.id)} className="fa-btn" style={{background:C.card,border:`1px solid ${loan.status==="paid"?C.accentText+"44":C.orange+"44"}`,borderRadius:18,padding:16,cursor:"pointer",textAlign:"left",width:"100%"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:loan.status==="paid"?C.accentDim:C.orangeDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {loan.status==="paid"?"✅":"👤"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800}}>{loan.debtor}</div>
                      <div style={{fontSize:11,color:C.textMuted}}>{loan.note} · {acc?.icon} {acc?.label}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,paddingLeft:8}}>
                      <div style={{fontSize:16,fontWeight:900,color:loan.status==="paid"?C.accentText:C.orange}}>{fmtCOP(loan.balance)}</div>
                      <div style={{fontSize:10,color:C.textMuted}}>de {fmtCOP(loan.amount)}</div>
                    </div>
                  </div>
                  <div style={{marginTop:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:C.textMuted}}>{loan.payments.length} pago{loan.payments.length!==1?"s":""} · {loan.date}</span>
                      <span style={{fontSize:11,fontWeight:700,color:loan.status==="paid"?C.accentText:C.orange}}>{pct}% cobrado</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:C.border}}>
                      <div style={{height:"100%",borderRadius:3,background:loan.status==="paid"?C.accent:C.orange,width:`${pct}%`,transition:"width .8s ease"}}/>
                    </div>
                  </div>
                  {loan.status==="active"&&(
                    <button onClick={e=>{e.stopPropagation();setShowPayModal(loan);}} className="fa-btn" style={{marginTop:10,padding:"6px 14px",borderRadius:100,border:`1px solid ${C.orange}`,background:C.orangeDim,color:C.orange,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      + Registrar Abono
                    </button>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOAN DETAIL ──────────────────────────────────────────────────────────────
function LoanDetail({loan,transactions,onBack,setShowPayModal,accounts}){
  const acc=accounts.find(a=>a.id===loan.account);
  const pct=Math.round(((loan.amount-loan.balance)/loan.amount)*100);
  const loanTx=transactions.filter(t=>t.loanId===loan.id);
  return(
    <div style={{padding:"16px",display:"grid",gap:16}} className="fa-fade-up">
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.orange,cursor:"pointer",fontWeight:600,fontSize:14,padding:0}}>← Volver a Préstamos</button>
      <div style={{background:`linear-gradient(135deg,${C.orangeDim},${C.card})`,border:`1px solid ${C.orange}44`,borderRadius:20,padding:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:C.orangeDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{loan.status==="paid"?"✅":"👤"}</div>
          <div>
            <div style={{fontSize:20,fontWeight:800}}>{loan.debtor}</div>
            <div style={{fontSize:12,color:C.textMuted}}>{loan.note} · desde {loan.date}</div>
          </div>
          {loan.status==="paid"&&<span style={{marginLeft:"auto",background:C.accentDim,color:C.accentText,borderRadius:100,fontSize:11,fontWeight:700,padding:"4px 10px"}}>✓ Saldado</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:2}}>PRESTADO</div>
            <div style={{fontSize:15,fontWeight:800}}>{fmtCOP(loan.amount)}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.accentText,marginBottom:2}}>COBRADO</div>
            <div style={{fontSize:15,fontWeight:800,color:C.accentText}}>{fmtCOP(loan.amount-loan.balance)}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.orange,marginBottom:2}}>PENDIENTE</div>
            <div style={{fontSize:15,fontWeight:800,color:C.orange}}>{fmtCOP(loan.balance)}</div>
          </div>
        </div>
        <div style={{marginBottom:6,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:C.textMuted}}>Progreso de cobro</span>
          <span style={{fontSize:12,fontWeight:700,color:loan.status==="paid"?C.accentText:C.orange}}>{pct}%</span>
        </div>
        <div style={{height:10,borderRadius:5,background:C.border}}>
          <div style={{height:"100%",borderRadius:5,background:loan.status==="paid"?C.accent:C.orange,width:`${pct}%`,transition:"width 1s ease"}}/>
        </div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:6}}>Cuenta: {acc?.icon} {acc?.label}</div>
      </div>
      {loan.status==="active"&&(
        <button onClick={()=>setShowPayModal(loan)} className="fa-btn" style={{background:C.orange,color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:15,cursor:"pointer"}}>+ Registrar Abono / Pago</button>
      )}
      <div>
        <div style={{fontSize:13,fontWeight:700,color:C.textMuted,marginBottom:10}}>HISTORIAL DE PAGOS ({loan.payments.length})</div>
        {loan.payments.length===0&&<EmptyState label="Sin pagos registrados aún"/>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
          {[...loan.payments].reverse().map((p,i)=>(
            <div key={p.id} className="fa-tx-row" style={{padding:"12px 16px",borderBottom:i<loan.payments.length-1?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>💸</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{p.note||"Abono"}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{p.date}</div>
              </div>
              <div style={{fontSize:15,fontWeight:800,color:C.accentText}}>+{fmtCOP(p.amount)}</div>
            </div>
          ))}
        </div>
      </div>
      {loanTx.length>0&&(
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.textMuted,marginBottom:10}}>MOVIMIENTOS VINCULADOS</div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
            {loanTx.map((tx,i)=><TxRow key={tx.id} tx={tx} showDivider={i<loanTx.length-1}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATS MENSUALES ──────────────────────────────────────────────────────────
function Stats({monthTxs,totalIncome,totalExpense,transactions,filterMonth}){
  const expByCat={},incByCat={};
  monthTxs.filter(t=>t.type==="expense").forEach(t=>{
    const cat=CATEGORIES.expense.find(c=>c.id===t.category);
    const lbl=cat?`${cat.icon} ${cat.label}`:t.category;
    expByCat[lbl]=(expByCat[lbl]||0)+t.amount;
  });
  monthTxs.filter(t=>t.type==="income").forEach(t=>{
    const cat=CATEGORIES.income.find(c=>c.id===t.category);
    const lbl=cat?`${cat.icon} ${cat.label}`:t.category;
    incByCat[lbl]=(incByCat[lbl]||0)+t.amount;
  });

  const savings   = totalIncome - totalExpense;
  const savRate   = totalIncome > 0 ? Math.round((savings/totalIncome)*100) : 0;
  const spendRate = totalIncome > 0 ? Math.round((totalExpense/totalIncome)*100) : 0;

  // Últimos 6 meses para comparativa
  const last6 = Array.from({length:6},(_,i)=>{
    const d = new Date(filterMonth+'-01');
    d.setMonth(d.getMonth() - (5-i));
    const key = d.toISOString().slice(0,7);
    const mo  = MONTHS[d.getMonth()]
    const txs = transactions.filter(t=>t.date.startsWith(key));
    const inc = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { mo, inc, exp, net:inc-exp };
  });
  const maxBar = Math.max(...last6.map(m=>Math.max(m.inc,m.exp)),1);

  // Día de mayor gasto del mes
  const byDay = {};
  monthTxs.filter(t=>t.type==='expense').forEach(t=>{
    byDay[t.date]=(byDay[t.date]||0)+t.amount;
  });
  const topDay = Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];

  const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return(
    <div style={{padding:"16px",display:"grid",gap:14}} className="fa-fade-up">

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:`linear-gradient(135deg,${C.accentDim},${C.card})`,border:`1px solid ${C.accentText}33`,borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.accentText,fontWeight:700}}>INGRESOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalIncome)}</div>
        </div>
        <div style={{background:`linear-gradient(135deg,${C.redDim},${C.card})`,border:`1px solid ${C.red}33`,borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.red,fontWeight:700}}>GASTOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalExpense)}</div>
        </div>
        <div style={{background:savings>=0?`linear-gradient(135deg,${C.accentDim},${C.card})`:`linear-gradient(135deg,${C.redDim},${C.card})`,border:`1px solid ${savings>=0?C.accentText:C.red}33`,borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:savings>=0?C.accentText:C.red,fontWeight:700}}>BALANCE</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savings>=0?C.accentText:C.red}}>{fmtCOP(savings)}</div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.yellow,fontWeight:700}}>TASA AHORRO</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red}}>{savRate}%</div>
        </div>
      </div>

      {/* BARRA PROGRESO AHORRO */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700}}>Salud Financiera</span>
          <span style={{fontSize:12,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red,fontWeight:700}}>
            {savRate>=20?"🟢 Excelente":savRate>=10?"🟡 Regular":"🔴 Atención"}
          </span>
        </div>
        <div style={{display:"grid",gap:8}}>
          {[
            {label:"Ahorro",     pct:Math.min(100,savRate),   color:C.accentText, meta:"Meta: 20%"},
            {label:"Gasto",      pct:Math.min(100,spendRate), color:spendRate>80?C.red:C.yellow, meta:`del ingreso`},
          ].map(item=>(
            <div key={item.label}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.textSub}}>{item.label}</span>
                <span style={{color:item.color,fontWeight:700}}>{item.pct}% <span style={{color:C.textMuted,fontWeight:400}}>{item.meta}</span></span>
              </div>
              <div style={{height:8,borderRadius:4,background:C.border}}>
                <div style={{height:"100%",borderRadius:4,background:item.color,width:`${item.pct}%`,transition:"width 1s ease"}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:10,padding:"8px 12px",background:C.bg,borderRadius:8}}>
          {savRate>=20?"¡Excelente! Estás ahorrando más del 20% recomendado. Considera invertir el excedente.":
           savRate>=10?"Vas bien, pero puedes mejorar. Intenta llegar al 20% reduciendo gastos no esenciales.":
           savings<0?"⚠️ Estás gastando más de lo que ganas. Revisa tus gastos urgente.":
           "Tu tasa de ahorro es baja. Identifica gastos que puedas reducir."}
        </div>
      </div>

      {/* GRÁFICO 6 MESES */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Evolución últimos 6 meses</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:100,marginBottom:8}}>
          {last6.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:80}}>
                <div style={{flex:1,borderRadius:"3px 3px 0 0",background:C.accentText,height:m.inc?Math.max(4,(m.inc/maxBar)*76):2,transition:"height .8s ease"}}/>
                <div style={{flex:1,borderRadius:"3px 3px 0 0",background:C.red,height:m.exp?Math.max(4,(m.exp/maxBar)*76):2,transition:"height .8s ease"}}/>
              </div>
              <span style={{fontSize:9,color:C.textMuted}}>{m.mo}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:14,justifyContent:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textSub}}>
            <div style={{width:10,height:10,borderRadius:2,background:C.accentText}}/> Ingresos
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textSub}}>
            <div style={{width:10,height:10,borderRadius:2,background:C.red}}/> Gastos
          </div>
        </div>
      </div>

      {/* TOP GASTO DEL DÍA */}
      {topDay && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Día de mayor gasto</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,color:C.textSub}}>{new Date(topDay[0]+'T12:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'short'})}</div>
            </div>
            <div style={{fontSize:18,fontWeight:900,color:C.red}}>{fmtCOP(topDay[1])}</div>
          </div>
        </div>
      )}

      {/* DESGLOSE GASTOS */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Gastos por categoría</div>
        {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amount])=>{
          const pct=totalExpense>0?Math.round((amount/totalExpense)*100):0;
          return(
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13}}>{cat}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.red}}>{fmtCOP(amount)} <span style={{color:C.textMuted,fontWeight:400}}>{pct}%</span></span>
              </div>
              <div style={{height:6,borderRadius:3,background:C.border}}>
                <div style={{height:"100%",borderRadius:3,background:`hsl(${360-pct*3.6},70%,60%)`,width:`${pct}%`,transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(expByCat).length===0&&<EmptyState label="Sin gastos este mes"/>}
      </div>

      {/* DESGLOSE INGRESOS */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Ingresos por categoría</div>
        {Object.entries(incByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amount])=>{
          const pct=totalIncome>0?Math.round((amount/totalIncome)*100):0;
          return(
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13}}>{cat}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.accentText}}>{fmtCOP(amount)} <span style={{color:C.textMuted,fontWeight:400}}>{pct}%</span></span>
              </div>
              <div style={{height:6,borderRadius:3,background:C.border}}>
                <div style={{height:"100%",borderRadius:3,background:C.accentText,width:`${pct}%`,transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(incByCat).length===0&&<EmptyState label="Sin ingresos registrados"/>}
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({open,onClose,accounts,updateAccountBalance,settings,setSettings,showToast}){
  const [tab,setTab]=useState("accounts");
  const { isSupported, permission, requestPermission, sendLocal } = useNotifications();

  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"#00000088",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:Math.min(340,window.innerWidth-40),background:C.surface,borderLeft:`1px solid ${C.border}`,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:18,fontWeight:800}}>⚙ Configuración</div>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {[["accounts","Cuentas"],["budgets","Presupuestos"],["notif","Notif"],["prefs","Prefs"]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 2px",border:"none",background:"transparent",borderBottom:tab===id?`2px solid ${C.accent}`:"2px solid transparent",color:tab===id?C.accent:C.textSub,fontWeight:600,fontSize:11,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="accounts"&&(
            <div style={{display:"grid",gap:12}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>SALDOS INICIALES</div>
              <div style={{fontSize:11,color:C.textMuted,marginTop:-6}}>El dinero que tenías antes de empezar a registrar</div>
              {accounts.map(acc=>(
                <div key={acc.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:18}}>{acc.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{acc.label}</div>
                      <div style={{fontSize:12,color:C.accentText}}>Saldo actual: {fmtCOP(acc.balance)}</div>
                      <div style={{fontSize:11,color:C.textMuted}}>Saldo inicial: {fmtCOP(acc.initialBalance)}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input type="number" defaultValue={acc.initialBalance} id={`bal-${acc.id}`} placeholder="0"
                      style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                    <button onClick={async()=>{
                      const v=parseFloat(document.getElementById(`bal-${acc.id}`).value)||0;
                      await updateAccountBalance(acc.id,v);
                      showToast(`${acc.label} actualizado ✓`);
                    }} style={{background:C.accentDim,border:`1px solid ${C.accentText}44`,color:C.accentText,borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                      Guardar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="notif"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>NOTIFICACIONES</div>
              {/* Estado actual */}
              <div style={{background:C.card,border:`1px solid ${permission==="granted"?C.accentText+"44":C.border}`,borderRadius:14,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:permission==="granted"?C.accentText:permission==="denied"?C.red:C.yellow,flexShrink:0}}/>
                  <div style={{fontSize:13,fontWeight:700}}>
                    {permission==="granted"?"Notificaciones activas":permission==="denied"?"Notificaciones bloqueadas":"Sin configurar"}
                  </div>
                </div>
                {!isSupported&&<div style={{fontSize:12,color:C.textMuted}}>Tu navegador no soporta notificaciones. Instala la app en tu pantalla de inicio.</div>}
                {isSupported&&permission!=="granted"&&(
                  <button onClick={async()=>{const r=await requestPermission();showToast(r==="granted"?"Notificaciones activadas ✓":"No se pudo activar","err");}}
                    style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentText}44`,color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Activar Notificaciones
                  </button>
                )}
                {permission==="granted"&&(
                  <button onClick={()=>sendLocal("Mi Suite Personal","¡Las notificaciones funcionan correctamente! 🎉")}
                    style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentText}44`,color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Probar notificación
                  </button>
                )}
              </div>
              {/* Instrucciones iOS */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📱 Para iOS (iPhone/iPad)</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>
                  1. Abre la app en <b>Safari</b><br/>
                  2. Toca el botón compartir <b>⎙</b><br/>
                  3. Selecciona <b>"Agregar a pantalla de inicio"</b><br/>
                  4. Abre la app desde el ícono instalado<br/>
                  5. Vuelve aquí y activa notificaciones<br/>
                  <span style={{color:C.textMuted,fontSize:11}}>Requiere iOS 16.4 o superior</span>
                </div>
              </div>
              {/* Instrucciones Android */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🤖 Para Android</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>
                  1. Abre en <b>Chrome</b><br/>
                  2. Toca los 3 puntos <b>⋮</b><br/>
                  3. Selecciona <b>"Instalar app"</b> o <b>"Agregar a inicio"</b><br/>
                  4. Abre desde el ícono y activa notificaciones
                </div>
              </div>
            </div>
          )}
          {tab==="budgets"&&(
            <div style={{display:"grid",gap:12}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>PRESUPUESTO MENSUAL</div>
              {CATEGORIES.expense.map(cat=>(
                <div key={cat.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{cat.label}</div>
                    <input type="number" placeholder="0" defaultValue={settings.budgets?.[cat.id]||""} onChange={e=>setSettings(s=>({...s,budgets:{...s.budgets,[cat.id]:parseFloat(e.target.value)||0}}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.text,fontSize:13}}/>
                  </div>
                </div>
              ))}
              <button onClick={()=>showToast("Presupuestos guardados ✓")} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:12,fontWeight:800,fontSize:14,cursor:"pointer"}}>Guardar</button>
            </div>
          )}
          {tab==="prefs"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Moneda</div>
                <select value={settings.currency} onChange={e=>setSettings(s=>({...s,currency:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}>
                  <option value="COP">🇨🇴 COP - Peso colombiano</option>
                  <option value="USD">🇺🇸 USD - Dólar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="MXN">🇲🇽 MXN - Peso mexicano</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────
function AddModal({onClose,onAdd,accounts,opts}){
  const [type,setType]=useState(opts.type||"expense");
  const [form,setForm]=useState({date:today(),category:opts.category||"",subcategory:"",account:accounts[0]?.id||"",amount:"",note:opts.note||""});
  const cats=CATEGORIES[type];
  const selCat=cats.find(c=>c.id===form.category);
  const set=(k,v)=>setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const submit=()=>{
    if(!form.amount||!form.category||!form.account)return;
    onAdd({...form,type,amount:parseFloat(form.amount)});
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"92vh",overflowY:"auto",borderTop:`1px solid ${C.border}`}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800}}>Nuevo Movimiento</div>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",background:C.card,borderRadius:14,padding:4,marginBottom:16,border:`1px solid ${C.border}`}}>
          {[["income","↑ Ingreso"],["expense","↓ Gasto"]].map(([t,l])=>(
            <button key={t} onClick={()=>{ setType(t); setForm(f=>({...f,category:"",subcategory:""})); }} style={{flex:1,padding:10,borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,background:type===t?(t==="income"?C.accentDim:C.redDim):"transparent",color:type===t?(t==="income"?C.accentText:C.red):C.textSub}}>{l}</button>
          ))}
        </div>
        <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:24,color:C.textMuted,fontWeight:300}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:28,fontWeight:900,color:type==="income"?C.accentText:C.red}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Categoría">
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:form.category?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar categoría</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </MF>
          {selCat&&<MF label="Subcategoría">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:form.subcategory?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar subcategoría</option>
              {selCat.subs.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </MF>}
          <MF label="Cuenta">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Descripción (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Pago mensual Netflix" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={submit} disabled={!form.amount||!form.category||!form.account} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:(!form.amount||!form.category||!form.account)?C.border:C.accent,color:(!form.amount||!form.category||!form.account)?C.textMuted:"#000",fontWeight:800,fontSize:16,cursor:(!form.amount||!form.category||!form.account)?"not-allowed":"pointer"}}>Registrar Movimiento</button>
      </div>
    </div>
  );
}

// ─── LOAN MODAL ───────────────────────────────────────────────────────────────
function LoanModal({onClose,onAdd,accounts}){
  const [form,setForm]=useState({debtor:"",amount:"",date:today(),account:accounts[0]?.id||"",subcategory:"Préstamo personal",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const ok=form.debtor&&form.amount&&form.account;
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:`1px solid ${C.orange}66`}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>🤝 Registrar Préstamo</div>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:20}}>Se registrará como gasto en <span style={{color:C.orange,fontWeight:700}}>Préstamos</span> y aparecerá en Cuentas por Cobrar</div>
        <div style={{background:C.orangeDim,border:`1px solid ${C.orange}44`,borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO DEL PRÉSTAMO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.orange}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Nombre del deudor"><input type="text" value={form.debtor} onChange={e=>set("debtor",e.target.value)} placeholder="Ej: Carlos Rodríguez" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Fecha del préstamo"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Tipo">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              <option>Préstamo personal</option><option>Préstamo familiar</option><option>Préstamo laboral</option><option>Auxilio de emergencia</option>
            </select>
          </MF>
          <MF label="Cuenta origen">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Para auxilio médico" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={()=>ok&&onAdd({...form,amount:parseFloat(form.amount)})} disabled={!ok} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:ok?C.orange:C.border,color:ok?"#fff":C.textMuted,fontWeight:800,fontSize:16,cursor:ok?"pointer":"not-allowed"}}>Registrar Préstamo</button>
      </div>
    </div>
  );
}

// ─── PAY MODAL ────────────────────────────────────────────────────────────────
function PayModal({onClose,loan,onPay,accounts}){
  const [form,setForm]=useState({date:today(),amount:"",account:accounts[0]?.id||"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const amt=parseFloat(form.amount)||0;
  const isTotal=amt>=loan.balance;
  const remaining=Math.max(0,loan.balance-amt);
  const ok=form.amount&&amt>0;
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:`1px solid ${C.accentText}66`}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>💸 Registrar Cobro</div>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.orange}44`,borderRadius:14,padding:14,marginBottom:16}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:2}}>PRÉSTAMO A</div>
          <div style={{fontSize:16,fontWeight:800}}>{loan.debtor}</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            <div><div style={{fontSize:11,color:C.textMuted}}>Prestado</div><div style={{fontWeight:700}}>{fmtCOP(loan.amount)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.orange}}>Pendiente</div><div style={{fontWeight:900,color:C.orange,fontSize:18}}>{fmtCOP(loan.balance)}</div></div>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:700,marginBottom:8}}>COBRO RÁPIDO</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[.25,.5,.75,1].map((f,i)=>{
              const v=Math.round(loan.balance*f);
              return <button key={i} onClick={()=>set("amount",v.toString())} style={{padding:"6px 12px",borderRadius:100,border:`1px solid ${C.border}`,background:amt===v?C.accentDim:C.card,color:amt===v?C.accentText:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{["25%","50%","75%","Total"][i]}</button>;
            })}
          </div>
        </div>
        <div style={{background:C.accentDim,border:`1px solid ${C.accentText}44`,borderRadius:16,padding:16,marginBottom:14}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO A COBRAR{isTotal&&<span style={{color:C.accentText,fontWeight:700}}> · ¡Pago total!</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.accentText}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha del cobro"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Cuenta destino (¿dónde entra el dinero?)">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Segundo abono acordado" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        {ok&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginTop:14,fontSize:13,color:C.textSub}}>
          Saldo restante: <span style={{fontWeight:800,color:remaining===0?C.accentText:C.orange}}>{fmtCOP(remaining)}</span>
        </div>}
        <button onClick={()=>ok&&onPay(loan,form)} disabled={!ok} style={{width:"100%",marginTop:16,padding:14,borderRadius:14,border:"none",background:ok?C.accentText:C.border,color:ok?"#000":C.textMuted,fontWeight:800,fontSize:16,cursor:ok?"pointer":"not-allowed"}}>
          {isTotal?"✓ Registrar Pago Total":"💸 Registrar Abono"}
        </button>
      </div>
    </div>
  );
}

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
function TxRow({tx,onDelete,showDivider=false,compact=false}){
  const allCats=[...CATEGORIES.income,...CATEGORIES.expense];
  const cat=allCats.find(c=>c.id===tx.category)||{icon:"📦",label:tx.category};
  const acc=ACCOUNTS_DEF.find(a=>a.id===tx.account)||{icon:"💰",label:tx.account};
  const isLoan=tx.category==="loans_out"||tx.category==="loan_pay";
  return(
    <div className="fa-tx-row" style={{padding:compact?"10px 14px":"12px 14px",borderBottom:showDivider?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:12,transition:"background .15s"}}>
      <div style={{width:36,height:36,borderRadius:10,background:tx.type==="income"?C.accentDim:(isLoan?C.orangeDim:C.redDim),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{cat.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
          {tx.note||cat.label}
          {isLoan&&<span style={{fontSize:9,background:C.orangeDim,color:C.orange,borderRadius:100,padding:"1px 6px",fontWeight:700,flexShrink:0}}>PRÉSTAMO</span>}
        </div>
        <div style={{fontSize:11,color:C.textMuted}}>{cat.label}{tx.subcategory?` · ${tx.subcategory}`:""} · {acc.icon} {acc.label}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:800,color:tx.type==="income"?C.accentText:(isLoan?C.orange:C.red)}}>{tx.type==="income"?"+":"-"}{fmtCOP(tx.amount)}</div>
        {!compact&&<div style={{fontSize:11,color:C.textMuted}}>{tx.date}</div>}
      </div>
      {onDelete&&<button onClick={onDelete} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16,padding:"4px",opacity:.5,flexShrink:0}}>🗑</button>}
    </div>
  );
}

function Pill({color,label,value,icon}){return(<div style={{flex:1}}><div style={{fontSize:10,color,fontWeight:700,marginBottom:2}}>{icon} {label.toUpperCase()}</div><div style={{fontSize:14,fontWeight:800}}>{value}</div></div>);}
function SectionHeader({title,action,onAction}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:14,fontWeight:700}}>{title}</div>{action&&<button onClick={onAction} style={{fontSize:12,color:C.accentText,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>{action} →</button>}</div>);}
function StatCard({label,value,color,icon}){return(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:18,color,marginBottom:4}}>{icon}</div><div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{label}</div><div style={{fontSize:15,fontWeight:800,color}}>{value}</div></div>);}
function MF({label,children}){return(<div><div style={{fontSize:11,color:C.textMuted,fontWeight:700,marginBottom:4,paddingLeft:2}}>{label.toUpperCase()}</div>{children}</div>);}
function EmptyState({label}){return(<div style={{textAlign:"center",padding:"24px 16px",color:C.textMuted,fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📭</div>{label}</div>);}
