import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useFinanzData } from "../hooks/useFinanzData.js";
import { useCardsData } from "../hooks/useCardsData.js";
import { checkFinanzAlerts, requestPermission, showLocalNotification } from "../hooks/useNotifications.js";
import { loadSetting, saveSetting } from "../hooks/useSettings.js";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#09090B",surface:"#111113",card:"#18181B",card2:"#1C1C1F",
  border:"#27272A",borderSub:"#1C1C1F",
  text:"#FAFAFA",textSub:"#A1A1AA",textMuted:"#52525B",
  accent:"#22C55E",accentDim:"#052010",accentText:"#4ADE80",
  green:"#22C55E",greenDim:"#052010",
  red:"#EF4444",redDim:"#1F0808",
  yellow:"#EAB308",yellowDim:"#1C1500",
  orange:"#F97316",orangeDim:"#1C0A02",
  blue:"#3B82F6",blueDim:"#071228",
  purple:"#A855F7",purpleDim:"#180A28",
  textSub:"#A1A1AA",
};

const DEFAULT_CATEGORIES = {
  income:[
    {id:"salary",    label:"Sueldo",        icon:"💼",subs:["Empresa","Freelance","Bonificación","Horas extra"]},
    {id:"business",  label:"Negocio",        icon:"🏪",subs:["Ventas","Servicios","Comisiones"]},
    {id:"investment",label:"Inversión",      icon:"📈",subs:["Dividendos","Intereses","Cripto","CDT"]},
    {id:"loan_pay",  label:"Cobro Préstamo", icon:"🤝",subs:["Abono","Pago total"]},
    {id:"flota_inc", label:"Ingresos Flota", icon:"🚗",subs:["Carro 1","Carro 2"]},
    {id:"other_in",  label:"Otros Ingresos", icon:"💰",subs:["Regalo","Reembolso","Varios"]},
    {id:"transfer",  label:"Transferencia",  icon:"↔️",subs:[]},
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
    {id:"transfer",  label:"Transferencia",   icon:"↔️",subs:[]},
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

const fmtCOP   = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
// Formato compacto para espacios pequeños: $2.7M, $484k, $22.6M
const fmtShort = v => {
  const n = Math.abs(v||0);
  const s = v < 0 ? "-" : "";
  if (n >= 1000000) return s+"$"+(n/1000000).toFixed(1).replace(".0","")+"M";
  if (n >= 1000)    return s+"$"+(n/1000).toFixed(0)+"k";
  return s+"$"+n;
};
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
    addTransaction:    dbAddTx,
    deleteTransaction: dbDelTx,
    updateTransaction: dbUpdateTx,
    addLoan:           dbAddLoan,
    addPayment:        dbAddPayment,
    updateAccountBalance, loadMonth,
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
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [toast,setToast]=useState(null);

  // ── Cards hook PRIMERO — antes de cualquier useEffect que use 'cards' ──
  const {
    cards, addCharge, deleteCharge, updateCharge, markPaid, saveCard, addCard,
  } = useCardsData();

  const saveCategories = async (cats) => {
    setCategories(cats);
    await saveSetting('fa_categories', cats);
  };

  // Cargar categorías desde Supabase
  useEffect(() => {
    loadSetting('fa_categories', DEFAULT_CATEGORIES).then(cats => {
      if (cats) setCategories(cats);
    });
    // Pedir permiso de notificaciones
    requestPermission();
  }, []);

  // Revisar alertas cuando los datos estén listos
  useEffect(() => {
    if (loans.length > 0 || cards.length > 0) {
      checkFinanzAlerts({ loans, cards });
    }
  }, [loans.length, cards.length]);

  const [showPayModal,setShowPayModal]=useState(null);
  const [showLoanModal,setShowLoanModal]=useState(false);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500);};

  const computedAccounts=accounts.map(acc=>{
    const txs=transactions.filter(t=>t.account===acc.id);
    const totalIn=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const totalOut=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    return {...acc,balance:acc.initialBalance+totalIn-totalOut};
  });

  const monthTxs     = transactions.filter(t=>t.date.startsWith(filterMonth));
  // Card charges del mes sumados a los gastos
  const monthChargesAll = cards.flatMap(c=>(c.charges||[]).filter(ch=>ch.date?.startsWith(filterMonth)));
  const cardExpenseMonth = monthChargesAll.reduce((s,ch)=>s+ch.amount,0);
  const totalIncome  = monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense = monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0) + cardExpenseMonth;
  const netBalance   = totalIncome - totalExpense;

  const addTransaction=async tx=>{
    const result = await dbAddTx(tx);  // sin id — lo genera Supabase
    if (result?.error) {
      showToast("Error al guardar: "+result.error,"error");
    } else {
      showToast("Movimiento registrado ✓");
      setShowAddModal(false);
      setAddModalOpts({});
    }
  };
  const deleteTransaction=async id=>{
    await dbDelTx(id);
    showToast("Eliminado","error");
  };
  const updateTransaction=async(id,updates)=>{
    await dbUpdateTx(id,updates);
    showToast("Movimiento actualizado ✓");
    setEditTx(null);
  };
  const [editTx, setEditTx]=useState(null);

  const addTransfer = async (from, to, amount, date, note) => {
    const r1 = await dbAddTx({ date, type:"expense", category:"transfer", subcategory:"Transferencia", account:from, amount, note:"Transferencia → "+(ACCOUNTS_DEF.find(a=>a.id===to)?.label||to)+(note?" · "+note:""), loan_id:null });
    const r2 = await dbAddTx({ date, type:"income",  category:"transfer", subcategory:"Transferencia", account:to,   amount, note:"Transferencia ← "+(ACCOUNTS_DEF.find(a=>a.id===from)?.label||from)+(note?" · "+note:""), loan_id:null });
    if (r1?.error || r2?.error) {
      showToast("Error en transferencia","error");
    } else {
      showToast("Transferencia realizada ✓");
      setShowTransferModal(false);
    }
  };
  const [showTransferModal, setShowTransferModal] = useState(false);

  const addLoan=async data=>{
    await dbAddLoan(data);
    showToast("Préstamo registrado a "+(data.debtor)+" ✓");
    setShowLoanModal(false);
  };

  const addPayment=async(loan,payData)=>{
    await dbAddPayment(loan,payData);
    showToast(loan.balance-parseFloat(payData.amount)<=0?"¡Préstamo de "+(loan.debtor)+" saldado! 🎉":"Abono registrado ✓");
    setShowPayModal(null);
  };

  const openAddModal=opts=>{setAddModalOpts(opts||{});setShowAddModal(true);};

  return(
    <div style={{
      fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
      background:C.bg,
      position:"absolute",
      top:0,left:0,right:0,bottom:0,
      overflow:"hidden",
      color:C.text,
      display:"flex",
      flexDirection:"column",
      maxWidth:"100vw",
    }}>
      {loading && (
        <div style={{position:"absolute",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:14}}>
          <div style={{width:36,height:36,border:"3px solid "+(C.border),borderTop:"3px solid "+(C.accent),borderRadius:"50%",animation:"fa-spin .8s linear infinite"}}/>
          <div style={{fontSize:14,color:C.textMuted}}>Cargando datos...</div>
        </div>
      )}
      <TopBar view={view} filterMonth={filterMonth} setFilterMonth={setFilterMonth} onMonthChange={loadMonth} setSidebarOpen={setSidebarOpen} openAddModal={openAddModal} onBack={onBack}/>
      <div className="fa-scroll" style={{paddingBottom:80}}>
        {view==="dashboard" && <Dashboard transactions={transactions} accounts={computedAccounts} loans={loans} totalIncome={totalIncome} totalExpense={totalExpense} netBalance={netBalance} filterMonth={filterMonth} setView={setView} setSelAccount={setSelAccount} monthTxs={monthTxs} categories={categories} settings={settings}/>}
        {view==="movements" && <Movements transactions={transactions} filterMonth={filterMonth} deleteTransaction={deleteTransaction} openAddModal={openAddModal} loans={loans} categories={categories} setEditTx={setEditTx}/>}
        {view==="accounts"  && <AccountsView accounts={computedAccounts} transactions={transactions} selAccount={selAccount} setSelAccount={setSelAccount} filterMonth={filterMonth} showToast={showToast} categories={categories} deleteTransaction={deleteTransaction} setEditTx={setEditTx}/>}
        {view==="cards"     && <CardsView cards={cards} addCharge={addCharge} deleteCharge={deleteCharge} updateCharge={updateCharge} markPaid={markPaid} saveCard={saveCard} addCard={addCard} filterMonth={filterMonth} showToast={showToast}/>}
        {view==="loans"     && <LoansView loans={loans} transactions={transactions} setShowLoanModal={setShowLoanModal} setShowPayModal={setShowPayModal} accounts={computedAccounts} showToast={showToast} categories={categories}/>}
        {view==="stats"     && <Stats monthTxs={monthTxs} totalIncome={totalIncome} totalExpense={totalExpense} transactions={transactions} filterMonth={filterMonth} categories={categories}/>}
      </div>
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} accounts={computedAccounts} updateAccountBalance={updateAccountBalance} settings={settings} setSettings={setSettings} showToast={showToast} categories={categories} saveCategories={saveCategories}/>
      <MobileNav view={view} setView={setView} openAddModal={openAddModal} loans={loans}/>
      <button onClick={()=>openAddModal()} style={{position:"fixed",bottom:82,right:20,width:54,height:54,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:24,boxShadow:"0 8px 24px "+(C.accent)+"66",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      <button onClick={()=>setShowTransferModal(true)} style={{position:"fixed",bottom:82,right:82,width:44,height:44,borderRadius:"50%",background:C.card,border:"1px solid "+C.border,cursor:"pointer",fontSize:18,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} title="Transferir">↔️</button>
      {editTx            && <EditTxModal tx={editTx} onClose={()=>setEditTx(null)} onSave={updateTransaction} accounts={accounts} categories={categories}/>}
      {showAddModal      && <AddModal  onClose={()=>{ setShowAddModal(false); setAddModalOpts({}); }} onAdd={addTransaction} accounts={accounts} opts={addModalOpts} categories={categories}/>}
      {showLoanModal     && <LoanModal onClose={()=>setShowLoanModal(false)} onAdd={addLoan} accounts={accounts} cards={cards}/>}
      {showPayModal      && <PayModal  onClose={()=>setShowPayModal(null)} loan={showPayModal} onPay={addPayment} accounts={accounts}/>}
      {showTransferModal && <TransferModal onClose={()=>setShowTransferModal(false)} onTransfer={addTransfer} accounts={accounts}/>}
      {toast && <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?C.red:C.accent,color:toast.type==="error"?"#fff":"#000",padding:"10px 20px",borderRadius:100,fontWeight:700,fontSize:14,zIndex:9999,animation:"fa-toastIn .3s ease",whiteSpace:"nowrap",boxShadow:"0 8px 24px #0006"}}>{toast.msg}</div>}
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({view,filterMonth,setFilterMonth,onMonthChange,setSidebarOpen,openAddModal,onBack}){
  const titles={dashboard:"Dashboard",movements:"Movimientos",accounts:"Cuentas",loans:"Por cobrar",stats:"Estadísticas"};
  const goMonth=(ym)=>{ setFilterMonth(ym); onMonthChange&&onMonthChange(ym); };
  const prev=()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()-1);goMonth(d.toISOString().slice(0,7));};
  const next=()=>{const d=new Date(filterMonth+"-01");d.setMonth(d.getMonth()+1);if(d<=new Date())goMonth(d.toISOString().slice(0,7));};
  const [y,m]=filterMonth.split("-");
  return(
    <div style={{
      background:C.bg,
      borderBottom:"1px solid "+C.border,
      paddingTop:"max(14px, calc(env(safe-area-inset-top) + 8px))",
      paddingBottom:"12px", paddingLeft:"20px", paddingRight:"20px",
      display:"flex", alignItems:"center", gap:10, flexShrink:0,
    }}>
      {onBack&&<button onClick={onBack} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:500,flexShrink:0,padding:0}}>← Suite</button>}
      <div style={{fontSize:17,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.3}}>{titles[view]||""}</div>
      <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        <button onClick={prev} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}}>‹</button>
        <span style={{fontSize:12,fontWeight:500,color:C.textSub,minWidth:58,textAlign:"center"}}>{MONTHS[parseInt(m)-1]} {y}</span>
        <button onClick={next} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}}>›</button>
      </div>
      <button onClick={()=>setSidebarOpen(true)} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16,padding:"4px",flexShrink:0}}>⚙</button>
    </div>
  );
}

// ─── MOBILE NAV ───────────────────────────────────────────────────────────────
function MobileNav({view,setView,openAddModal,loans}){
  const badge=loans.filter(l=>l.status==="active").length;
  const items=[
    {id:"dashboard",icon:"⌂", label:"Inicio"},
    {id:"movements",icon:"↕", label:"Movimientos"},
    {id:"cards",    icon:"▭", label:"Tarjetas"},
    {id:"loans",    icon:"⇌", label:"Cobrar",badge},
    {id:"stats",    icon:"▦", label:"Stats"},
  ];
  return(
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:90,
      background:C.bg,borderTop:"1px solid "+C.border,
      display:"flex",
      paddingBottom:"max(env(safe-area-inset-bottom), 6px)",
    }}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>setView(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 0",border:"none",background:"transparent",color:view===item.id?C.text:C.textMuted,cursor:"pointer",fontSize:9,fontWeight:view===item.id?600:400,position:"relative",transition:"color .15s"}}>
          <span style={{fontSize:18,lineHeight:1}}>{item.icon}</span>
          {item.label}
          {view===item.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:20,height:2,borderRadius:1,background:C.accent}}/>}
          {item.badge>0&&<span style={{position:"absolute",top:5,right:"calc(50% - 18px)",background:C.red,color:"#fff",borderRadius:100,fontSize:7,fontWeight:800,padding:"1px 4px"}}>{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({transactions,accounts,loans,totalIncome,totalExpense,netBalance,filterMonth,setView,setSelAccount,monthTxs,categories=DEFAULT_CATEGORIES,settings={}}){
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
    <div className="fa-dash fa-fade-up">
      {/* PATRIMONIO */}
      <div className="fa-pad" style={{paddingTop:20,paddingBottom:20,borderBottom:"1px solid "+C.border}}>
        <div style={{fontSize:11,color:C.textMuted,fontWeight:500,letterSpacing:0.5,marginBottom:8}}>PATRIMONIO TOTAL</div>
        <div style={{fontSize:34,fontWeight:700,letterSpacing:-1.5,color:C.text,marginBottom:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtCOP(totalAssets)}</div>
        <div className="metrics-row">
          {[
            {label:"Ingresos",val:fmtShort(totalIncome), color:C.green, icon:"↑"},
            {label:"Egresos", val:fmtShort(totalExpense),color:C.red,   icon:"↓"},
            {label:"Balance", val:fmtShort(netBalance),  color:netBalance>=0?C.green:C.red,icon:"="},
            ...(totalPending>0?[{label:"Cobrar",val:fmtShort(totalPending),color:C.yellow,icon:"·"}]:[]),
          ].map((item,i,arr)=>(
            <div key={item.label} style={{flex:1,minWidth:0,paddingRight:i<arr.length-1?8:0,borderRight:i<arr.length-1?"1px solid "+C.border:"none",marginRight:i<arr.length-1?8:0,overflow:"hidden"}}>
              <div style={{fontSize:8,color:C.textMuted,fontWeight:600,marginBottom:3,whiteSpace:"nowrap"}}>{item.icon} {item.label.toUpperCase()}</div>
              <div style={{fontSize:13,fontWeight:700,color:item.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CUENTAS */}
      <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
        <SectionHeader title="Mis cuentas" action="Ver todas" onAction={()=>setView("accounts")}/>
        <div className="hscroll-edge" style={{gap:10,paddingTop:10}}>
          {accounts.map(acc=>(
            <button key={acc.id} onClick={()=>{setSelAccount(acc.id);setView("accounts");}} className="fa-btn"
              style={{background:"transparent",border:"1px solid "+C.border,borderRadius:12,padding:"12px 14px",width:108,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:18,marginBottom:6}}>{acc.icon}</div>
              <div style={{fontSize:9,color:C.textMuted,fontWeight:500,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acc.label.toUpperCase()}</div>
              <div style={{fontSize:13,fontWeight:700,color:acc.balance>0?C.text:acc.balance<0?C.red:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtCOP(acc.balance)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PRÉSTAMOS */}
      {loans.filter(l=>l.status==="active").length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Por cobrar" action="Ver todos" onAction={()=>setView("loans")}/>
          {loans.filter(l=>l.status==="active").slice(0,3).map((loan,i,arr)=>(
            <div key={loan.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<arr.length-1?"1px solid "+C.borderSub:"none"}}>
              <div style={{width:30,height:30,borderRadius:8,background:C.card,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>👤</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loan.debtor}</div>
                <div style={{height:2,borderRadius:1,background:C.border,marginTop:5}}>
                  <div style={{height:"100%",borderRadius:1,background:C.yellow,width:(Math.min(100,Math.round((1-loan.balance/loan.amount)*100)))+"%"}}/>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:700,color:C.yellow}}>{fmtCOP(loan.balance)}</div>
                <div style={{fontSize:9,color:C.textMuted}}>pendiente</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GRÁFICA */}
      <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
        <SectionHeader title="Gastos últimos 7 días"/>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:56,marginTop:14,overflow:"hidden"}}>
          {last7.map((d,i)=>{
            const barH=maxDay>0&&d.total>0?Math.max(4,Math.min(40,(d.total/maxDay)*40)):3;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,justifyContent:"flex-end",height:"100%"}}>
                {d.total>0&&<div style={{fontSize:7,color:C.textMuted}}>{(d.total/1000).toFixed(0)}k</div>}
                <div style={{width:"100%",borderRadius:3,background:d.total?C.red:C.border,height:barH,flexShrink:0}}/>
                <span style={{fontSize:8,color:C.textMuted}}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP CATEGORÍAS */}
      {topCats.length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Top gastos" action="Stats" onAction={()=>setView("stats")}/>
          <div style={{display:"grid",gap:10,marginTop:12}}>
            {topCats.map(([catId,amount])=>{
              const cat=categories.expense.find(c=>c.id===catId)||{label:catId,icon:"📦"};
              return(
                <div key={catId}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{cat.icon} {cat.label}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text,flexShrink:0}}>{fmtCOP(amount)}</span>
                  </div>
                  <div style={{height:2,borderRadius:1,background:C.border}}>
                    <div style={{height:"100%",borderRadius:1,background:C.red,width:Math.min(100,Math.round((amount/totalExpense)*100))+"%"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRESUPUESTOS */}
      {settings.budgets && Object.keys(settings.budgets).filter(k=>settings.budgets[k]>0).length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Presupuestos" action="Configurar" onAction={()=>setView("stats")}/>
          <div style={{display:"grid",gap:10,marginTop:12}}>
            {Object.entries(settings.budgets).filter(([,v])=>v>0).map(([catId,budget])=>{
              const cat = categories.expense.find(c=>c.id===catId)||{label:catId,icon:"📦"};
              const spent = monthTxs.filter(t=>t.type==="expense"&&t.category===catId).reduce((s,t)=>s+t.amount,0);
              const pct   = Math.min(100, Math.round((spent/budget)*100));
              const over  = spent > budget;
              const color = over ? C.red : pct > 80 ? C.yellow : C.green;
              return(
                <div key={catId}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                    <span style={{fontSize:13,color:C.textSub}}>{cat.icon} {cat.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color}}>
                      {fmtShort(spent)} / {fmtShort(budget)}
                      {over && <span style={{fontSize:10,marginLeft:4,color:C.red}}>▲ {pct-100}%</span>}
                    </span>
                  </div>
                  <div style={{height:4,borderRadius:2,background:C.border}}>
                    <div style={{height:"100%",borderRadius:2,background:color,width:pct+"%",transition:"width .4s ease"}}/>
                  </div>
                  {over&&<div style={{fontSize:10,color:C.red,marginTop:3}}>Excedido en {fmtCOP(spent-budget)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECIENTES */}
      <div className="fa-pad" style={{paddingTop:16,paddingBottom:16}}>
        <SectionHeader title="Movimientos recientes" action="Ver todos" onAction={()=>setView("movements")}/>
        <div style={{marginTop:10}}>
          {monthTxs.slice(0,5).map((tx,i)=><TxRow key={tx.id} tx={tx} compact categories={categories} showDivider={i<Math.min(4,monthTxs.length-1)}/>)}
          {monthTxs.length===0&&<EmptyState label="Sin movimientos este mes"/>}
        </div>
      </div>
    </div>
  );
}
// ─── MOVEMENTS ────────────────────────────────────────────────────────────────
function Movements({transactions,filterMonth,deleteTransaction,openAddModal,loans,categories=DEFAULT_CATEGORIES,setEditTx}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=transactions
    .filter(t=>t.date.startsWith(filterMonth))
    .filter(t=>filter==="all"||t.type===filter)
    .filter(t=>!search||[t.note,t.category,t.subcategory].join(" ").toLowerCase().includes(search.toLowerCase()));
  const grouped={};
  filtered.forEach(t=>{(grouped[t.date]=grouped[t.date]||[]).push(t);});
  const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  function exportXLSX() {
    const wb = XLSX.utils.book_new();
    // Hoja 1: Movimientos del mes
    const txRows = [["Fecha","Tipo","Categoría","Subcategoría","Cuenta","Monto","Descripción"]];
    filtered.forEach(t=>txRows.push([t.date,t.type==="income"?"Ingreso":"Gasto",t.category||"",t.subcategory||"",t.account||"",t.amount,t.note||""]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), "Movimientos");
    // Hoja 2: Resumen por categoría
    const catMap = {};
    filtered.filter(t=>t.type==="expense").forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
    const catRows = [["Categoría","Total"]];
    Object.entries(catMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>catRows.push([k,v]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), "Por Categoría");
    // Descargar
    XLSX.writeFile(wb, "FinanzApp-"+filterMonth+".xlsx");
  }

  function exportPDF() {
    const win=window.open("","_blank");
    win.document.write('<html><head><title>Movimientos '+filterMonth+'</title><style>body{font-family:Arial;font-size:11px;margin:20px}h2{color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px}th{background:#18181b;color:#fff}.i{color:green;font-weight:700}.e{color:red;font-weight:700}tfoot td{font-weight:700;background:#f5f5f5}</style></head><body>');
    win.document.write('<h2>Movimientos · '+filterMonth+'</h2>');
    win.document.write('<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Cuenta</th><th>Monto</th><th>Descripción</th></tr></thead><tbody>');
    filtered.forEach(t=>{const c=t.type==="income"?"i":"e";win.document.write('<tr><td>'+t.date+'</td><td class="'+c+'">'+(t.type==="income"?"↑ Ingreso":"↓ Gasto")+'</td><td>'+(t.category||"")+'</td><td>'+(t.account||"")+'</td><td class="'+c+'">$'+t.amount.toLocaleString("es-CO")+'</td><td>'+(t.note||"")+'</td></tr>');});
    const tot=filtered.reduce((s,t)=>s+(t.type==="income"?t.amount:-t.amount),0);
    win.document.write('<tr><td colspan="4"><strong>BALANCE</strong></td><td colspan="2" class="'+(tot>=0?"i":"e")+'">'+(tot>=0?"+":"")+tot.toLocaleString("es-CO")+'</td></tr>');
    win.document.write('</tbody></table></body></html>');
    win.document.close(); win.print();
  }

  return(
    <div style={{padding:"16px",display:"grid",gap:12,boxSizing:"border-box"}} className="fa-fade-up">
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
          style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:12,padding:"10px 12px 10px 36px",color:C.text,fontSize:14}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6}}>
          {[["all","Todos"],["income","Ingresos"],["expense","Gastos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 12px",borderRadius:100,border:filter!==v?"1px solid "+(C.border):"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.accent:C.card,color:filter===v?"#000":C.textSub}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={exportXLSX} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.card,color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>📊 Excel</button>
          <button onClick={exportPDF} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.card,color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>🖨 PDF</button>
        </div>
      </div>
      {sortedDates.length===0&&<EmptyState label="Sin movimientos"/>}
      {sortedDates.map(date=>(
        <div key={date}>
          <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:6,paddingLeft:4}}>
            {new Date(date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </div>
          <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
            {grouped[date].map((tx,i)=>(
              <TxRow key={tx.id} tx={tx} onDelete={()=>deleteTransaction(tx.id)} onEdit={setEditTx?()=>setEditTx(tx):null} showDivider={i<grouped[date].length-1} categories={categories}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
function AccountsView({accounts,transactions,selAccount,setSelAccount,filterMonth,showToast,categories=DEFAULT_CATEGORIES,deleteTransaction,setEditTx}){
  const active=selAccount||accounts[0]?.id;
  const acc=accounts.find(a=>a.id===active)||accounts[0];
  const accTxs=transactions.filter(t=>t.account===active&&t.date.startsWith(filterMonth));
  const totalIn=accTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalOut=accTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  return(
    <div style={{padding:"16px",display:"grid",gap:16,boxSizing:"border-box"}} className="fa-fade-up">
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
        {accounts.map(a=>(
          <button key={a.id} onClick={()=>setSelAccount(a.id)} style={{padding:"10px 14px",borderRadius:14,border:active!==a.id?"1px solid "+(C.border):"none",cursor:"pointer",background:active===a.id?C.accent:C.card,color:active===a.id?"#000":C.textSub,fontWeight:700,fontSize:13,flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>
      {acc&&(
        <div style={{background:"linear-gradient(135deg,"+(C.card)+","+(C.cardHover)+")",border:"1px solid "+(acc.color)+"44",borderRadius:20,padding:20}}>
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
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
          {accTxs.sort((a,b)=>b.date.localeCompare(a.date)).map((tx,i)=>(
            <TxRow key={tx.id} tx={tx} showDivider={i<accTxs.length-1} categories={categories}
              onDelete={deleteTransaction ? ()=>deleteTransaction(tx.id) : null}
              onEdit={setEditTx ? ()=>setEditTx(tx) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOANS VIEW ───────────────────────────────────────────────────────────────
function LoansView({loans,transactions,setShowLoanModal,setShowPayModal,accounts,showToast,categories=DEFAULT_CATEGORIES}){
  const [filter,setFilter]=useState("active");
  const [selLoan,setSelLoan]=useState(null);
  const filtered=loans.filter(l=>filter==="all"||l.status===filter);
  const totalActive=loans.filter(l=>l.status==="active").reduce((s,l)=>s+l.balance,0);
  const totalLent=loans.reduce((s,l)=>s+l.amount,0);
  const totalRecov=loans.reduce((s,l)=>s+(l.amount-l.balance),0);
  const detail=selLoan?loans.find(l=>l.id===selLoan):null;

  if(detail)return(
    <LoanDetail loan={detail} transactions={transactions} onBack={()=>setSelLoan(null)} setShowPayModal={setShowPayModal} accounts={accounts} categories={categories}/>
  );

  return(
    <div style={{padding:"16px",display:"grid",gap:16,boxSizing:"border-box"}} className="fa-fade-up">
      <div style={{background:"linear-gradient(135deg,"+(C.orangeDim)+","+(C.card)+")",border:"1px solid "+(C.orange)+"44",borderRadius:20,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:(C.orange)+"11"}}/>
        <div style={{fontSize:12,color:C.orange,fontWeight:700,marginBottom:4}}>TOTAL POR COBRAR</div>
        <div style={{fontSize:32,fontWeight:900,letterSpacing:-2}}>{fmtCOP(totalActive)}</div>
        <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
          <Pill color={C.orange}     label="Prestado" value={fmtCOP(totalLent)}  icon="📤"/>
          <Pill color={C.accentText} label="Cobrado"  value={fmtCOP(totalRecov)} icon="✓"/>
          <Pill color={C.textSub}    label="Activos"  value={(loans.filter(l=>l.status==="active").length)} icon="#"/>
        </div>
      </div>

      <button onClick={()=>setShowLoanModal(true)} className="fa-btn" style={{background:C.orange,color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        🤝 Registrar Nuevo Préstamo
      </button>

      <div style={{display:"flex",gap:8}}>
        {[["active","Activos"],["paid","Saldados"],["all","Todos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:100,border:filter!==v?"1px solid "+(C.border):"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.orange:C.card,color:filter===v?"#fff":C.textSub}}>{l}</button>
        ))}
      </div>

      {filtered.length===0&&<EmptyState label="No hay préstamos en esta categoría"/>}
      <div style={{display:"grid",gap:12}}>
        {filtered.map(loan=>{
          const pct=Math.round(((loan.amount-loan.balance)/loan.amount)*100);
          const acc=accounts.find(a=>a.id===loan.account);
          return(
            <button key={loan.id} onClick={()=>setSelLoan(loan.id)} className="fa-btn" style={{background:C.card,border:"1px solid "+(loan.status==="paid"?C.accentText+"44":C.orange+"44"),borderRadius:18,padding:16,cursor:"pointer",textAlign:"left",width:"100%"}}>
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
                      <div style={{height:"100%",borderRadius:3,background:loan.status==="paid"?C.accent:C.orange,width:(pct)+"%",transition:"width .8s ease"}}/>
                    </div>
                  </div>
                  {loan.status==="active"&&(
                    <button onClick={e=>{e.stopPropagation();setShowPayModal(loan);}} className="fa-btn" style={{marginTop:10,padding:"6px 14px",borderRadius:100,border:"1px solid "+(C.orange),background:C.orangeDim,color:C.orange,fontSize:12,fontWeight:700,cursor:"pointer"}}>
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
function LoanDetail({loan,transactions,onBack,setShowPayModal,accounts,categories=DEFAULT_CATEGORIES}){
  const acc=accounts.find(a=>a.id===loan.account);
  const pct=Math.round(((loan.amount-loan.balance)/loan.amount)*100);
  const loanTx=transactions.filter(t=>t.loanId===loan.id);
  return(
    <div style={{padding:"16px",display:"grid",gap:16,boxSizing:"border-box"}} className="fa-fade-up">
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.orange,cursor:"pointer",fontWeight:600,fontSize:14,padding:0}}>← Volver a Préstamos</button>
      <div style={{background:"linear-gradient(135deg,"+(C.orangeDim)+","+(C.card)+")",border:"1px solid "+(C.orange)+"44",borderRadius:20,padding:20}}>
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
          <div style={{height:"100%",borderRadius:5,background:loan.status==="paid"?C.accent:C.orange,width:(pct)+"%",transition:"width 1s ease"}}/>
        </div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:6}}>Cuenta: {acc?.icon} {acc?.label}</div>
      </div>
      {loan.status==="active"&&(
        <button onClick={()=>setShowPayModal(loan)} className="fa-btn" style={{background:C.orange,color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:15,cursor:"pointer"}}>+ Registrar Abono / Pago</button>
      )}
      <div>
        <div style={{fontSize:13,fontWeight:700,color:C.textMuted,marginBottom:10}}>HISTORIAL DE PAGOS ({loan.payments.length})</div>
        {loan.payments.length===0&&<EmptyState label="Sin pagos registrados aún"/>}
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
          {[...loan.payments].reverse().map((p,i)=>(
            <div key={p.id} className="fa-tx-row" style={{padding:"12px 16px",borderBottom:i<loan.payments.length-1?"1px solid "+(C.border):"none",display:"flex",alignItems:"center",gap:12}}>
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
          <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
            {loanTx.map((tx,i)=><TxRow key={tx.id} tx={tx} showDivider={i<loanTx.length-1} categories={categories}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TARJETAS DE CRÉDITO ──────────────────────────────────────────────────────
function CardsView({ cards, addCharge, deleteCharge, updateCharge, markPaid, saveCard, addCard, filterMonth, showToast }) {
  const [selCard, setSelCard] = useState(cards[0]?.id || null);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showEditCard, setShowEditCard] = useState(null);
  const [editCharge, setEditCharge] = useState(null); // {cardId, charge}

  const card = cards.find(c => c.id === selCard) || cards[0];

  const handleAddCharge    = async (charge) => { await addCharge(selCard, charge); showToast("Gasto registrado ✓"); setShowAddCharge(false); };
  const handleDeleteCharge = async (cardId, chargeId) => { await deleteCharge(cardId, chargeId); showToast("Gasto eliminado", "error"); };
  const handleUpdateCharge = async (cardId, chargeId, updates) => { await updateCharge(cardId, chargeId, updates); showToast("Gasto actualizado ✓"); setEditCharge(null); };
  const handleMarkPaid     = async (cardId) => { await markPaid(cardId); showToast("Tarjeta pagada ✓"); };
  const handleSaveCard     = async (cardId, updates) => { await saveCard(cardId, updates); showToast("Tarjeta actualizada ✓"); setShowEditCard(null); };
  const handleAddCard      = async (data) => { await addCard(data); showToast("Tarjeta agregada ✓"); setShowEditCard(null); };

  const totalDebt = cards.reduce((s, c) => s + (c.balance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (c.limit || 0), 0);

  const CHARGE_CATS = ["Supermercado","Restaurante","Gasolina","Ropa","Entretenimiento","Salud","Viajes","Tecnología","Servicios","Otro"];

  const monthCharges = (card?.charges || []).filter(ch => ch.date?.startsWith(filterMonth));

  return (
    <div style={{padding:"16px",display:"grid",gap:14,boxSizing:"border-box"}} className="fa-fade-up">

      {/* RESUMEN GLOBAL */}
      <div style={{background:"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+(C.red)+"44",borderRadius:18,padding:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:90,height:90,borderRadius:"50%",background:(C.red)+"0D",pointerEvents:"none"}}/>
        <div style={{fontSize:11,color:C.red,fontWeight:700,marginBottom:3}}>DEUDA TOTAL TARJETAS</div>
        <div style={{fontSize:28,fontWeight:900}}>{fmtCOP(totalDebt)}</div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:4}}>Límite total disponible: {fmtCOP(totalLimit - totalDebt)}</div>
        <div style={{height:6,borderRadius:3,background:C.border,marginTop:10}}>
          <div style={{height:"100%",borderRadius:3,background:C.red,width:(Math.min(100,Math.round((totalDebt/Math.max(totalLimit,1))*100)))+"%",transition:"width 1s ease"}}/>
        </div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{Math.round((totalDebt/Math.max(totalLimit,1))*100)}% del límite usado</div>
      </div>

      {/* SELECTOR DE TARJETA */}
      <div className="overflow-guard">
        <div className="hscroll-edge" style={{gap:10,paddingBottom:2}}>
          {cards.map(c => (
            <button key={c.id} onClick={()=>setSelCard(c.id)} style={{
              padding:"10px 14px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:12,
              background:selCard===c.id?c.color+"33":C.card,
              border:"1px solid "+(selCard===c.id?c.color:C.border),
              color:selCard===c.id?c.color:C.textSub,
              display:"flex",alignItems:"center",gap:6,
            }}>
              <span>💳</span>{c.name}
            </button>
          ))}
          <button onClick={()=>setShowEditCard("new")} style={{padding:"10px 14px",borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:700,background:C.card,border:"1px solid "+(C.border),color:C.textMuted}}>+ Nueva</button>
        </div>
      </div>

      {/* TARJETA ACTIVA */}
      {card && (
        <div style={{background:"linear-gradient(135deg, "+(card.color)+"22, "+(C.card)+")",border:"1px solid "+(card.color)+"44",borderRadius:20,padding:18}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>{card.name}</div>
              <div style={{fontSize:12,color:C.textMuted}}>{card.bank} •••• {card.last4}</div>
            </div>
            <button onClick={()=>setShowEditCard(card.id)} style={{background:card.color+"22",border:"1px solid "+(card.color)+"44",color:card.color,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏️ Editar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {l:"Saldo actual",    v:fmtCOP(card.balance||0),   c:card.color},
              {l:"Límite",          v:fmtCOP(card.limit||0),     c:C.textSub},
              {l:"Disponible",      v:fmtCOP((card.limit||0)-(card.balance||0)), c:(card.limit||0)-(card.balance||0)>0?C.green:C.red},
              {l:"Día de corte",    v:"Día "+(card.cutDay||"-"),  c:C.yellow},
            ].map(item=>(
              <div key={item.l} style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>{item.l.toUpperCase()}</div>
                <div style={{fontSize:14,fontWeight:800,color:item.c}}>{item.v}</div>
              </div>
            ))}
          </div>
          {/* PAGO MÍNIMO */}
          {(card.balance||0) > 0 && (() => {
            const saldo   = card.balance || 0;
            const minPct  = Math.max(saldo * 0.05, 20000); // 5% del saldo, mínimo $20.000
            const minFijo = saldo <= 500000 ? saldo : minPct;
            const totalSug = minFijo * 1.15; // incluye intereses aprox 3% mensual
            return (
              <div style={{background:C.yellowDim,border:"1px solid "+C.yellow+"44",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:10,color:C.yellow,fontWeight:700,marginBottom:6}}>⚡ PAGO MÍNIMO ESTIMADO</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:900,color:C.yellow}}>{fmtCOP(Math.round(totalSug/1000)*1000)}</div>
                    <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Base {fmtCOP(Math.round(minFijo/1000)*1000)} + intereses aprox.</div>
                  </div>
                  <div style={{fontSize:10,color:C.textMuted,textAlign:"right"}}>
                    <div>Tasa ~3% mensual</div>
                    <div style={{color:C.red,fontWeight:600}}>Pagar antes día {card.payDay||"?"}</div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div style={{height:8,borderRadius:4,background:C.border,marginBottom:8}}>
            <div style={{height:"100%",borderRadius:4,background:card.color,width:(Math.min(100,Math.round(((card.balance||0)/Math.max(card.limit||1,1))*100)))+"%",transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAddCharge(true)} style={{flex:1,background:card.color,color:"#000",border:"none",borderRadius:10,padding:"10px",fontWeight:800,fontSize:13,cursor:"pointer"}}>+ Registrar gasto</button>
            <button onClick={()=>handleMarkPaid(card.id)} style={{background:C.greenDim,border:"1px solid "+(C.green)+"44",color:C.green,borderRadius:10,padding:"10px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pagar</button>
          </div>
        </div>
      )}

      {/* GASTOS DEL MES */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>
          GASTOS DEL MES ({monthCharges.length}) · {fmtCOP(monthCharges.reduce((s,c)=>s+c.amount,0))}
        </div>
        {monthCharges.length === 0 && (
          <div style={{textAlign:"center",padding:20,color:C.textMuted,fontSize:13,background:C.card,borderRadius:14,border:"1px solid "+(C.border)}}>
            📭 Sin gastos este mes
          </div>
        )}
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          {monthCharges.map((ch,i)=>(
            <div key={ch.id} className="fa-tx-row" style={{padding:"11px 14px",borderBottom:i<monthCharges.length-1?"1px solid "+(C.border):"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>💳</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.note||ch.category}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{ch.category} · {ch.date}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:800,color:C.red}}>-{fmtCOP(ch.amount)}</div>
              </div>
              <button onClick={()=>setEditCharge({cardId:card.id,charge:ch})} style={{background:"none",border:"none",color:C.accentText,cursor:"pointer",fontSize:12,opacity:.7,flexShrink:0}}>✏️</button>
              <button onClick={()=>handleDeleteCharge(card.id, ch.id)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,opacity:.5,flexShrink:0}}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL NUEVO GASTO */}
      {showAddCharge && (
        <ChargeModal card={card} onClose={()=>setShowAddCharge(false)} onAdd={handleAddCharge} cats={CHARGE_CATS}/>
      )}
      {/* MODAL EDITAR GASTO */}
      {editCharge && (
        <EditChargeModal
          charge={editCharge.charge}
          card={cards.find(c=>c.id===editCharge.cardId)}
          cats={CHARGE_CATS}
          onClose={()=>setEditCharge(null)}
          onSave={(chargeId, updates)=>handleUpdateCharge(editCharge.cardId, chargeId, updates)}
        />
      )}

      {/* MODAL EDITAR/NUEVA TARJETA */}
      {showEditCard && (
        <CardEditModal
          card={showEditCard==="new" ? null : cards.find(c=>c.id===showEditCard)}
          onClose={()=>setShowEditCard(null)}
          onSave={showEditCard==="new" ? handleAddCard : (updates)=>handleSaveCard(showEditCard, updates)}
        />
      )}
    </div>
  );
}

function ChargeModal({ card, onClose, onAdd, cats }) {
  const [form, setForm] = useState({ date:today(), amount:"", category:"Supermercado", note:"", installments:1 });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(card.color)+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>💳 Gasto en {card.name}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:C.redDim,border:"1px solid "+(C.red)+"33",borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:3}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:20,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
              style={{flex:1,background:"transparent",border:"none",fontSize:24,fontWeight:900,color:C.red}}/>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          {[["Categoría","select"],["Fecha","date"],["Descripción","text"]].map(([label,type])=>{
            const key = label==="Categoría"?"category":label==="Fecha"?"date":"note";
            return (
              <div key={key}>
                <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
                {type==="select"
                  ? <select value={form[key]} onChange={e=>set(key,e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
                      {cats.map(c=><option key={c}>{c}</option>)}
                    </select>
                  : <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={label==="Descripción"?"Ej: Mercado Éxito":""}
                      style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
                }
              </div>
            );
          })}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CUOTAS</div>
            <div style={{display:"flex",gap:6}}>
              {[1,3,6,12,24,36].map(n=>(
                <button key={n} onClick={()=>set("installments",n)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"1px solid "+(form.installments===n?card.color:C.border),background:form.installments===n?card.color+"22":"transparent",color:form.installments===n?card.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {n===1?"Cont.":n+"x"}
                </button>
              ))}
            </div>
          </div>
          {form.installments > 1 && form.amount && (
            <div style={{background:C.card,borderRadius:9,padding:"8px 12px",fontSize:12,color:C.textSub}}>
              Cuota mensual: <strong style={{color:card.color}}>{fmtCOP(parseFloat(form.amount)/form.installments)}</strong> × {form.installments} meses
            </div>
          )}
        </div>
        <button onClick={()=>form.amount&&onAdd({...form,amount:parseFloat(form.amount)})}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:form.amount?card.color:C.border,color:form.amount?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Registrar Gasto
        </button>
      </div>
    </div>
  );
}

function EditChargeModal({ charge, card, cats, onClose, onSave }) {
  const [form, setForm] = useState({
    date:         charge.date,
    amount:       charge.amount,
    category:     charge.category,
    note:         charge.note || "",
    installments: charge.installments || 1,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+((card?.color)||C.accent)+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar gasto</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:12}}>
          <MF label="Monto">
            <div style={{background:C.redDim,border:"1px solid "+C.red+"33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:C.textMuted,fontSize:16}}>$</span>
              <input type="number" value={form.amount} onChange={e=>set("amount",parseFloat(e.target.value)||0)}
                style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color:C.red}}/>
            </div>
          </MF>
          <MF label="Categoría">
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </MF>
          <MF label="Fecha">
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
          <MF label="Descripción">
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
        </div>
        <button onClick={()=>onSave(charge.id, form)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:C.red,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function CardEditModal({ card, onClose, onSave }) {
  const [form, setForm] = useState({
    name:    card?.name    || "",
    bank:    card?.bank    || "",
    last4:   card?.last4   || "",
    limit:   card?.limit   || 5000000,
    cutDay:  card?.cutDay  || 25,
    payDay:  card?.payDay  || 10,
    color:   card?.color   || "#60A5FA",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const COLORS = ["#60A5FA","#FFD166","#FB923C","#A78BFA","#F472B6","#34D399","#F87171","#00D97E"];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.border),animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>{card?"Editar tarjeta":"Nueva tarjeta"}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          {[["Nombre",form.name,"name","Ej: Visa Bancolombia"],["Banco",form.bank,"bank","Ej: Bancolombia"],["Últimos 4 dígitos",form.last4,"last4","0000"]].map(([label,val,key,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
              <input value={val} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>LÍMITE DE CRÉDITO</div>
            <input type="number" value={form.limit} onChange={e=>set("limit",parseFloat(e.target.value)||0)}
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DÍA DE CORTE</div>
              <input type="number" value={form.cutDay} onChange={e=>set("cutDay",parseInt(e.target.value)||1)} min="1" max="31"
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DÍA DE PAGO</div>
              <input type="number" value={form.payDay} onChange={e=>set("payDay",parseInt(e.target.value)||1)} min="1" max="31"
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:8}}>COLOR DE TARJETA</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(col=>(
                <button key={col} onClick={()=>set("color",col)}
                  style={{width:32,height:32,borderRadius:"50%",background:col,border:form.color===col?"3px solid #fff":"2px solid transparent",cursor:"pointer"}}/>
              ))}
            </div>
          </div>
        </div>
        <button onClick={()=>form.name&&onSave(form)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:form.name?form.color:C.border,color:form.name?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          {card?"Guardar cambios":"Agregar tarjeta"}
        </button>
      </div>
    </div>
  );
}

// ─── STATS MENSUALES ──────────────────────────────────────────────────────────
function Stats({monthTxs,totalIncome,totalExpense,transactions,filterMonth,categories=DEFAULT_CATEGORIES}){
  const expByCat={},incByCat={};
  monthTxs.filter(t=>t.type==="expense").forEach(t=>{
    const cat=categories.expense.find(c=>c.id===t.category);
    const lbl=cat?(cat.icon)+" "+(cat.label):t.category;
    expByCat[lbl]=(expByCat[lbl]||0)+t.amount;
  });
  monthTxs.filter(t=>t.type==="income").forEach(t=>{
    const cat=categories.income.find(c=>c.id===t.category);
    const lbl=cat?(cat.icon)+" "+(cat.label):t.category;
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
    <div style={{padding:"16px",display:"grid",gap:14,boxSizing:"border-box"}} className="fa-fade-up">

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:"linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")",border:"1px solid "+(C.accentText)+"33",borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.accentText,fontWeight:700}}>INGRESOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalIncome)}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+(C.red)+"33",borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.red,fontWeight:700}}>GASTOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalExpense)}</div>
        </div>
        <div style={{background:savings>=0?"linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")":"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+((savings>=0?C.accentText:C.red)+"33"),borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:savings>=0?C.accentText:C.red,fontWeight:700}}>BALANCE</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savings>=0?C.accentText:C.red}}>{fmtCOP(savings)}</div>
        </div>
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.yellow,fontWeight:700}}>TASA AHORRO</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red}}>{savRate}%</div>
        </div>
      </div>

      {/* BARRA PROGRESO AHORRO */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700}}>Salud Financiera</span>
          <span style={{fontSize:12,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red,fontWeight:700}}>
            {savRate>=20?"🟢 Excelente":savRate>=10?"🟡 Regular":"🔴 Atención"}
          </span>
        </div>
        <div style={{display:"grid",gap:8}}>
          {[
            {label:"Ahorro",     pct:Math.min(100,savRate),   color:C.accentText, meta:"Meta: 20%"},
            {label:"Gasto",      pct:Math.min(100,spendRate), color:spendRate>80?C.red:C.yellow, meta:"del ingreso"},
          ].map(item=>(
            <div key={item.label}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.textSub}}>{item.label}</span>
                <span style={{color:item.color,fontWeight:700}}>{item.pct}% <span style={{color:C.textMuted,fontWeight:400}}>{item.meta}</span></span>
              </div>
              <div style={{height:8,borderRadius:4,background:C.border}}>
                <div style={{height:"100%",borderRadius:4,background:item.color,width:(item.pct)+"%",transition:"width 1s ease"}}/>
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
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
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

      {/* COMPARATIVO MES ANTERIOR */}
      {last6.length>=2&&(()=>{
        const curr = last6[last6.length-1];
        const prev = last6[last6.length-2];
        const expDiff = curr.exp - prev.exp;
        const incDiff = curr.inc - prev.inc;
        return(
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:16}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Vs. mes anterior</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"Gastos", diff:expDiff, prev:prev.exp, invert:true},
                {label:"Ingresos",diff:incDiff,prev:prev.inc, invert:false},
              ].map(item=>{
                const pct = item.prev>0?Math.round(Math.abs(item.diff/item.prev)*100):0;
                const up  = item.diff > 0;
                const good = item.invert ? !up : up;
                const color = item.diff===0 ? C.textMuted : good ? C.green : C.red;
                return(
                  <div key={item.label} style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:C.textMuted,fontWeight:600,marginBottom:4}}>{item.label.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:800,color}}>{item.diff===0?"=":(up?"▲":"▼")+" "+pct+"%"}</div>
                    <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{item.diff===0?"Sin cambio":(up?"+":" ")+fmtShort(item.diff)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TOP GASTO DEL DÍA */}
      {topDay && (
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
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
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
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
                <div style={{height:"100%",borderRadius:3,background:"hsl("+(360-pct*3.6)+",70%,60%)",width:(pct)+"%",transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(expByCat).length===0&&<EmptyState label="Sin gastos este mes"/>}
      </div>

      {/* DESGLOSE INGRESOS */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
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
                <div style={{height:"100%",borderRadius:3,background:C.accentText,width:(pct)+"%",transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(incByCat).length===0&&<EmptyState label="Sin ingresos registrados"/>}
      </div>
    </div>
  );
}

// ─── ACCOUNTS MANAGER ────────────────────────────────────────────────────────
const ACCOUNT_ICONS = ["💵","💳","🏦","💜","🔵","🟡","🔴","🟢","⚫","🟠","💰","🏧"];
const ACCOUNT_COLORS = ["#00D97E","#A78BFA","#4D9EFF","#FFD166","#FF4D6A","#FB923C","#34D399","#F472B6","#60A5FA","#FBBF24"];

function AccountsManager({accounts, updateAccountBalance, showToast}) {
  const [editId, setEditId] = useState(null);
  const [newAcc, setNewAcc] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (acc) => {
    setEditId(acc.id);
    setEditForm({ label: acc.label, icon: acc.icon, initialBalance: acc.initialBalance });
  };

  const saveEdit = async () => {
    if (!editForm.label) return;
    await updateAccountBalance(editId, parseFloat(editForm.initialBalance) || 0, editForm);
    showToast("Cuenta actualizada ✓");
    setEditId(null);
  };

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>MIS CUENTAS</div>
        <button onClick={()=>setNewAcc({label:"",icon:"💵",color:C.accentText,initialBalance:0})}
          style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          + Nueva cuenta
        </button>
      </div>
      <div style={{fontSize:11,color:C.textMuted,marginTop:-6}}>Configura nombre, ícono y saldo inicial de cada cuenta</div>

      {/* Nueva cuenta form */}
      {newAcc && (
        <div style={{background:C.card,border:"1px solid "+(C.accentText)+"44",borderRadius:14,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.accentText,marginBottom:10}}>+ NUEVA CUENTA</div>
          <div style={{display:"grid",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>NOMBRE</div>
              <input value={newAcc.label} onChange={e=>setNewAcc(a=>({...a,label:e.target.value}))} placeholder="Ej: Efectivo, Nequi..."
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>ÍCONO</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ACCOUNT_ICONS.map(ic=>(
                  <button key={ic} onClick={()=>setNewAcc(a=>({...a,icon:ic}))}
                    style={{width:34,height:34,borderRadius:8,border:"1px solid "+(newAcc.icon===ic?C.accent:C.border),background:newAcc.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:16}}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>COLOR</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ACCOUNT_COLORS.map(col=>(
                  <button key={col} onClick={()=>setNewAcc(a=>({...a,color:col}))}
                    style={{width:28,height:28,borderRadius:"50%",background:col,border:newAcc.color===col?"3px solid #fff":"2px solid transparent",cursor:"pointer"}}>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>SALDO INICIAL</div>
              <input type="number" value={newAcc.initialBalance} onChange={e=>setNewAcc(a=>({...a,initialBalance:parseFloat(e.target.value)||0}))} placeholder="0"
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={async()=>{
                if(!newAcc.label)return;
                const id=newAcc.label.toLowerCase().replace(/\s+/g,"-")+"-"+Date.now();
                await updateAccountBalance(id, newAcc.initialBalance, {label:newAcc.label,icon:newAcc.icon,color:newAcc.color,isNew:true});
                showToast((newAcc.label)+" creada ✓");
                setNewAcc(null);
              }} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"9px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Crear cuenta
              </button>
              <button onClick={()=>setNewAcc(null)}
                style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"9px 12px",color:C.textSub,cursor:"pointer",fontSize:13}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cuentas existentes */}
      {accounts.map(acc=>(
        <div key={acc.id} style={{background:C.card,border:"1px solid "+(editId===acc.id?acc.color+"66":C.border),borderRadius:14,overflow:"hidden"}}>
          {editId===acc.id ? (
            <div style={{padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:acc.color,marginBottom:10}}>EDITANDO: {acc.label}</div>
              <div style={{display:"grid",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>NOMBRE</div>
                  <input value={editForm.label} onChange={e=>setEditForm(f=>({...f,label:e.target.value}))}
                    style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>ÍCONO</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {ACCOUNT_ICONS.map(ic=>(
                      <button key={ic} onClick={()=>setEditForm(f=>({...f,icon:ic}))}
                        style={{width:32,height:32,borderRadius:8,border:"1px solid "+(editForm.icon===ic?C.accent:C.border),background:editForm.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:15}}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>SALDO INICIAL</div>
                  <input type="number" value={editForm.initialBalance} onChange={e=>setEditForm(f=>({...f,initialBalance:e.target.value}))}
                    style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveEdit} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"9px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>Guardar</button>
                  <button onClick={()=>setEditId(null)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"9px 12px",color:C.textSub,cursor:"pointer",fontSize:13}}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20,flexShrink:0}}>{acc.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>{acc.label}</div>
                <div style={{fontSize:11,color:C.accentText}}>Saldo actual: {fmtCOP(acc.balance)}</div>
                <div style={{fontSize:11,color:C.textMuted}}>Inicial: {fmtCOP(acc.initialBalance)}</div>
              </div>
              <button onClick={()=>startEdit(acc)}
                style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"33",color:C.accentText,borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                ✏️ Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── CATEGORIES MANAGER ───────────────────────────────────────────────────────
const CAT_ICONS = ["💼","🏪","📈","🤝","💰","🏠","🍽️","🚗","🏥","📚","🎮","👗","🏦","💳","📦","✈️","🐾","🎵","🌿","⚡"];

function CategoriesManager({ categories, saveCategories, showToast }) {
  const [type, setType]   = useState("income");
  const [editCat, setEditCat] = useState(null); // {idx, ...cat} or "new"
  const [editSub, setEditSub] = useState(null); // {catIdx, subIdx} or null

  const cats = categories[type];

  const addCategory = (cat) => {
    const updated = { ...categories, [type]: [...cats, { ...cat, id: "cat_"+Date.now(), subs: [] }] };
    saveCategories(updated);
    setEditCat(null);
    showToast("Categoría creada ✓");
  };

  const updateCategory = (idx, updates) => {
    const list = cats.map((c,i) => i===idx ? {...c,...updates} : c);
    saveCategories({ ...categories, [type]: list });
    setEditCat(null);
    showToast("Categoría actualizada ✓");
  };

  const deleteCategory = (idx) => {
    saveCategories({ ...categories, [type]: cats.filter((_,i)=>i!==idx) });
    showToast("Categoría eliminada","err");
  };

  const addSub = (catIdx, sub) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:[...(c.subs||[]), sub]});
    saveCategories({ ...categories, [type]: list });
    setEditSub(null);
  };

  const deleteSub = (catIdx, subIdx) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:c.subs.filter((_,j)=>j!==subIdx)});
    saveCategories({ ...categories, [type]: list });
  };

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",gap:6}}>
        {[["income","Ingresos"],["expense","Gastos"]].map(([t,l])=>(
          <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(type===t?C.accent:C.border),background:type===t?C.accentDim:"transparent",color:type===t?C.accent:C.textSub,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      <button onClick={()=>setEditCat("new")} style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:9,padding:"9px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Nueva categoría</button>

      {editCat==="new" && (
        <CatForm onSave={addCategory} onCancel={()=>setEditCat(null)}/>
      )}

      {cats.map((cat,idx)=>(
        <div key={cat.id||idx} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700}}>{cat.label}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{(cat.subs||[]).length} subcategorías</div>
            </div>
            <button onClick={()=>setEditCat(editCat===idx?null:idx)} style={{background:C.accentDim,color:C.accentText,border:"1px solid "+(C.accentText)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️</button>
            <button onClick={()=>deleteCategory(idx)} style={{background:C.redDim,color:C.red,border:"1px solid "+(C.red)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>🗑</button>
          </div>
          {editCat===idx && (
            <div style={{padding:"0 12px 12px",borderTop:"1px solid "+(C.border)}}>
              <CatForm initial={cat} onSave={(u)=>updateCategory(idx,u)} onCancel={()=>setEditCat(null)}/>
            </div>
          )}
          {/* Subcategorías */}
          <div style={{padding:"0 12px 10px"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
              {(cat.subs||[]).map((sub,si)=>(
                <div key={si} style={{display:"flex",alignItems:"center",gap:3,background:C.bg,border:"1px solid "+(C.border),borderRadius:100,padding:"3px 8px"}}>
                  <span style={{fontSize:11,color:C.textSub}}>{sub}</span>
                  <button onClick={()=>deleteSub(idx,si)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,lineHeight:1,padding:"0 1px"}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setEditSub(editSub?.catIdx===idx?null:{catIdx:idx,val:""})}
                style={{background:"transparent",border:"1px dashed "+(C.border),borderRadius:100,padding:"3px 8px",fontSize:11,color:C.textMuted,cursor:"pointer"}}>+ sub</button>
            </div>
            {editSub?.catIdx===idx && (
              <div style={{display:"flex",gap:6}}>
                <input value={editSub.val} onChange={e=>setEditSub(s=>({...s,val:e.target.value}))} placeholder="Nueva subcategoría..."
                  onKeyDown={e=>{if(e.key==="Enter"&&editSub.val){addSub(idx,editSub.val);setEditSub(null);}}}
                  style={{flex:1,background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"5px 8px",color:C.text,fontSize:12}}/>
                <button onClick={()=>{if(editSub.val)addSub(idx,editSub.val);setEditSub(null);}}
                  style={{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"5px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ label: initial?.label||"", icon: initial?.icon||"📦" });
  return (
    <div style={{display:"grid",gap:8,paddingTop:10}}>
      <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Nombre de la categoría"
        style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {CAT_ICONS.map(ic=>(
          <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))}
            style={{width:32,height:32,borderRadius:7,border:"1px solid "+(form.icon===ic?C.accent:C.border),background:form.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:16}}>
            {ic}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>form.label&&onSave(form)} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"8px",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          {initial?"Guardar":"Crear"}
        </button>
        <button onClick={onCancel} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.textSub,cursor:"pointer",fontSize:12}}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({open,onClose,accounts,updateAccountBalance,settings,setSettings,showToast,categories=DEFAULT_CATEGORIES,saveCategories}){
  const [tab,setTab]=useState("accounts");
  const [notifPerm, setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"default");

  const handleRequestNotif = async () => {
    const result = await requestPermission();
    setNotifPerm(result);
    if (result==="granted") showToast("Notificaciones activadas ✓");
  };

  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"#00000088",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:Math.min(340,window.innerWidth-40),background:C.surface,borderLeft:"1px solid "+(C.border),transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid "+(C.border),display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:18,fontWeight:800}}>⚙ Configuración</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid "+(C.border),flexShrink:0,overflowX:"auto"}}>
          {[["accounts","Cuentas"],["cats","Categorías"],["notif","Notif"],["prefs","Prefs"]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:"0 0 auto",padding:"10px 10px",border:"none",background:"transparent",borderBottom:tab===id?"2px solid "+(C.accent):"2px solid transparent",color:tab===id?C.accent:C.textSub,fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="accounts"&&(
            <AccountsManager accounts={accounts} updateAccountBalance={updateAccountBalance} showToast={showToast}/>
          )}
          {tab==="cats"&&saveCategories&&(
            <CategoriesManager categories={categories} saveCategories={saveCategories} showToast={showToast}/>
          )}
          {tab==="notif"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>NOTIFICACIONES</div>
              <div style={{background:C.card,border:"1px solid "+(notifPerm==="granted"?C.accentText+"44":C.border),borderRadius:14,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:notifPerm==="granted"?C.accentText:notifPerm==="denied"?C.red:C.yellow,flexShrink:0}}/>
                  <div style={{fontSize:13,fontWeight:700}}>
                    {notifPerm==="granted"?"Notificaciones activas":notifPerm==="denied"?"Notificaciones bloqueadas":"Sin configurar"}
                  </div>
                </div>
                {notifPerm!=="granted"&&(
                  <button onClick={handleRequestNotif}
                    style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Activar Notificaciones
                  </button>
                )}
                {notifPerm==="granted"&&(
                  <button onClick={()=>{if(typeof showLocalNotification==="function")showLocalNotification("Mi Suite Personal","¡Las notificaciones funcionan! 🎉");else showToast("Notificaciones OK ✓");}}
                    style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Probar notificación
                  </button>
                )}
              </div>
              {/* Instrucciones iOS */}
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
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
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
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
              {categories.expense.map(cat=>(
                <div key={cat.id} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{cat.label}</div>
                    <input type="number" placeholder="0" defaultValue={settings.budgets?.[cat.id]||""} onChange={e=>setSettings(s=>({...s,budgets:{...s.budgets,[cat.id]:parseFloat(e.target.value)||0}}))} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,fontSize:13}}/>
                  </div>
                </div>
              ))}
              <button onClick={()=>showToast("Presupuestos guardados ✓")} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:12,fontWeight:800,fontSize:14,cursor:"pointer"}}>Guardar</button>
            </div>
          )}
          {tab==="prefs"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Moneda</div>
                <select value={settings.currency} onChange={e=>setSettings(s=>({...s,currency:e.target.value}))} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}>
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
function AddModal({onClose,onAdd,accounts,opts,categories=DEFAULT_CATEGORIES}){
  const [type,setType]=useState(opts.type||"expense");
  const [form,setForm]=useState({date:today(),category:opts.category||"",subcategory:"",account:accounts[0]?.id||"",amount:"",note:opts.note||""});
  const cats=categories[type];
  const selCat=cats.find(c=>c.id===form.category);
  const set=(k,v)=>setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const submit=()=>{
    if(!form.amount||!form.category||!form.account)return;
    onAdd({...form,type,amount:parseFloat(form.amount)});
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"92vh",overflowY:"auto",borderTop:"1px solid "+(C.border)}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800}}>Nuevo Movimiento</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",background:C.card,borderRadius:14,padding:4,marginBottom:16,border:"1px solid "+(C.border)}}>
          {[["income","↑ Ingreso"],["expense","↓ Gasto"]].map(([t,l])=>(
            <button key={t} onClick={()=>{ setType(t); setForm(f=>({...f,category:"",subcategory:""})); }} style={{flex:1,padding:10,borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,background:type===t?(t==="income"?C.accentDim:C.redDim):"transparent",color:type===t?(t==="income"?C.accentText:C.red):C.textSub}}>{l}</button>
          ))}
        </div>
        <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:14,border:"1px solid "+(C.border)}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:24,color:C.textMuted,fontWeight:300}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:28,fontWeight:900,color:type==="income"?C.accentText:C.red}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Categoría">
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:form.category?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar categoría</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </MF>
          {selCat&&<MF label="Subcategoría">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:form.subcategory?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar subcategoría</option>
              {selCat.subs.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </MF>}
          <MF label="Cuenta">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Descripción (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Pago mensual Netflix" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={submit} disabled={!form.amount||!form.category||!form.account} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:(!form.amount||!form.category||!form.account)?C.border:C.accent,color:(!form.amount||!form.category||!form.account)?C.textMuted:"#000",fontWeight:800,fontSize:16,cursor:(!form.amount||!form.category||!form.account)?"not-allowed":"pointer"}}>Registrar Movimiento</button>
      </div>
    </div>
  );
}

// ─── LOAN MODAL ───────────────────────────────────────────────────────────────
function LoanModal({onClose,onAdd,accounts,cards=[]}){
  const [sourceType,setSourceType]=useState("account"); // account | card
  const [form,setForm]=useState({debtor:"",amount:"",date:today(),account:accounts[0]?.id||"",cardId:"",subcategory:"Préstamo personal",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const ok=form.debtor&&form.amount&&(sourceType==="account"?form.account:form.cardId);
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.orange)+"66"}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>🤝 Registrar Préstamo</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Aparecerá en <span style={{color:C.orange,fontWeight:700}}>Por Cobrar</span></div>
        <div style={{background:C.orangeDim,border:"1px solid "+(C.orange)+"44",borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.orange}}/>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Nombre del deudor"><input type="text" value={form.debtor} onChange={e=>set("debtor",e.target.value)} placeholder="Ej: Carlos Rodríguez" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Fecha"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Tipo">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              <option>Préstamo personal</option><option>Préstamo familiar</option><option>Préstamo laboral</option><option>Auxilio de emergencia</option>
            </select>
          </MF>
          {/* FUENTE DEL PRÉSTAMO */}
          <MF label="Fuente del dinero">
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {[["account","💰 Cuenta"],["card","💳 Tarjeta"]].map(([t,l])=>(
                <button key={t} onClick={()=>setSourceType(t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(sourceType===t?C.accent:C.border),background:sourceType===t?C.accentDim:"transparent",color:sourceType===t?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {l}
                </button>
              ))}
            </div>
            {sourceType==="account"&&(
              <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
              </select>
            )}
            {sourceType==="card"&&(
              <select value={form.cardId} onChange={e=>set("cardId",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
                <option value="">Seleccionar tarjeta...</option>
                {cards.map(c=><option key={c.id} value={c.id}>{c.name} ···{c.last4}</option>)}
              </select>
            )}
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Para auxilio médico" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={()=>ok&&onAdd({...form,amount:parseFloat(form.amount),sourceType})} disabled={!ok} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:ok?C.orange:C.border,color:ok?"#fff":C.textMuted,fontWeight:800,fontSize:16,cursor:ok?"pointer":"not-allowed"}}>Registrar Préstamo</button>
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
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accentText)+"66"}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>💸 Registrar Cobro</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:C.card,border:"1px solid "+(C.orange)+"44",borderRadius:14,padding:14,marginBottom:16}}>
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
              return <button key={i} onClick={()=>set("amount",v.toString())} style={{padding:"6px 12px",borderRadius:100,border:"1px solid "+(C.border),background:amt===v?C.accentDim:C.card,color:amt===v?C.accentText:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{["25%","50%","75%","Total"][i]}</button>;
            })}
          </div>
        </div>
        <div style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",borderRadius:16,padding:16,marginBottom:14}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO A COBRAR{isTotal&&<span style={{color:C.accentText,fontWeight:700}}> · ¡Pago total!</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.accentText}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha del cobro"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Cuenta destino (¿dónde entra el dinero?)">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Segundo abono acordado" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        {ok&&<div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:12,padding:"10px 14px",marginTop:14,fontSize:13,color:C.textSub}}>
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
function TxRow({tx,onDelete,onEdit,showDivider=false,compact=false,categories=DEFAULT_CATEGORIES}){
  const allCats=[...categories.income,...categories.expense];
  const cat=allCats.find(c=>c.id===tx.category)||{icon:"·",label:tx.category};
  const acc=ACCOUNTS_DEF.find(a=>a.id===tx.account)||{icon:"·",label:tx.account};
  const isIncome=tx.type==="income";
  const isTransfer=tx.category==="transfer";
  const color=isIncome?C.green:isTransfer?C.blue:C.red;
  return(
    <div className="fa-tx-row" style={{padding:compact?"10px 0":"12px 0",borderBottom:showDivider?"1px solid "+C.borderSub:"none",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:34,height:34,borderRadius:9,background:C.card,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{cat.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text}}>{tx.note||cat.label}</div>
        {!compact&&<div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{cat.label} · {acc.icon} {acc.label} · {tx.date}</div>}
        {compact&&<div style={{fontSize:11,color:C.textMuted,marginTop:1}}>{tx.date}</div>}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:600,color}}>{isIncome||isTransfer?"+":"-"}{fmtCOP(tx.amount)}</div>
      </div>
      {onEdit&&<button onClick={onEdit} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,padding:"2px",flexShrink:0,opacity:.6}}>✏️</button>}
      {onDelete&&<button onClick={onDelete} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,padding:"2px",flexShrink:0,opacity:.4}}>✕</button>}
    </div>
  );
}

function EditTxModal({tx,onClose,onSave,accounts,categories=DEFAULT_CATEGORIES}){
  const [form,setForm]=useState({
    date:tx.date, type:tx.type, category:tx.category,
    subcategory:tx.subcategory||"", account:tx.account,
    amount:tx.amount, note:tx.note||""
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cats=categories[form.type]||[];
  const cat=cats.find(c=>c.id===form.category);
  return(
    <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar movimiento</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TIPO</div>
            <div style={{display:"flex",gap:8}}>
              {["income","expense"].map(t=>(
                <button key={t} onClick={()=>set("type",t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(form.type===t?C.accent:C.border),background:form.type===t?C.accentDim:"transparent",color:form.type===t?C.accent:C.textSub,cursor:"pointer",fontWeight:700,fontSize:12}}>
                  {t==="income"?"💰 Ingreso":"💸 Gasto"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>MONTO</div>
            <input type="number" value={form.amount} onChange={e=>set("amount",parseFloat(e.target.value)||0)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:16,fontWeight:800}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CATEGORÍA</div>
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>SUBCATEGORÍA</div>
              <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
                <option value="">Sin subcategoría</option>
                {cat.subs.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CUENTA</div>
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>FECHA</div>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DESCRIPCIÓN</div>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <button onClick={()=>onSave(tx.id,form)}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:C.accent,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Pill({color,label,value,icon}){return(<div style={{flex:"1 1 0",minWidth:0,overflow:"hidden"}}><div style={{fontSize:9,color,fontWeight:700,marginBottom:2,whiteSpace:"nowrap"}}>{icon} {label.toUpperCase()}</div><div style={{fontSize:13,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div></div>);}
function SectionHeader({title,action,onAction}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,width:"100%",overflow:"hidden"}}><div style={{fontSize:14,fontWeight:700,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>{action&&<button onClick={onAction} style={{fontSize:12,color:C.accentText,background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0,marginLeft:8,whiteSpace:"nowrap"}}>{action} →</button>}</div>);}
function StatCard({label,value,color,icon}){return(<div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:18,color,marginBottom:4}}>{icon}</div><div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{label}</div><div style={{fontSize:15,fontWeight:800,color}}>{value}</div></div>);}
function MF({label,children}){return(<div><div style={{fontSize:11,color:C.textMuted,fontWeight:700,marginBottom:4,paddingLeft:2}}>{label.toUpperCase()}</div>{children}</div>);}
function EmptyState({label}){return(<div style={{textAlign:"center",padding:"24px 16px",color:C.textMuted,fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📭</div>{label}</div>);}

function TransferModal({onClose, onTransfer, accounts}) {
  const [form, setForm] = useState({ from:"cash", to:"nequi", amount:"", date:today(), note:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const ok = form.from && form.to && form.from !== form.to && parseFloat(form.amount) > 0;
  const fromAcc = accounts.find(a=>a.id===form.from);
  const toAcc   = accounts.find(a=>a.id===form.to);
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>↔️ Transferencia entre cuentas</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>

        {/* Preview visual */}
        {ok && (
          <div style={{background:C.accentDim,border:"1px solid "+C.accent+"44",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:8,textAlign:"center",justifyContent:"center"}}>
            <div>
              <div style={{fontSize:18}}>{fromAcc?.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:C.red}}>{fromAcc?.label}</div>
              <div style={{fontSize:12,color:C.red}}>-{fmtCOP(parseFloat(form.amount))}</div>
            </div>
            <div style={{fontSize:20,color:C.accent}}>→</div>
            <div>
              <div style={{fontSize:18}}>{toAcc?.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:C.green}}>{toAcc?.label}</div>
              <div style={{fontSize:12,color:C.green}}>+{fmtCOP(parseFloat(form.amount))}</div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gap:12}}>
          <MF label="Monto">
            <div style={{background:C.accentDim,border:"1px solid "+C.accent+"33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:C.textMuted,fontSize:16}}>$</span>
              <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
                style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color:C.accent}}/>
            </div>
          </MF>
          <MF label="Desde">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {accounts.map(a=>(
                <button key={a.id} onClick={()=>set("from",a.id)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:9,
                  border:"1px solid "+(form.from===a.id?C.red:C.border),
                  background:form.from===a.id?C.redDim:"transparent",
                  color:form.from===a.id?C.red:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center",
                  opacity:form.to===a.id?0.3:1}}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </MF>
          <MF label="Hacia">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {accounts.map(a=>(
                <button key={a.id} onClick={()=>set("to",a.id)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:9,
                  border:"1px solid "+(form.to===a.id?C.green:C.border),
                  background:form.to===a.id?C.greenDim:"transparent",
                  color:form.to===a.id?C.green:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center",
                  opacity:form.from===a.id?0.3:1}}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </MF>
          {form.from === form.to && form.from && (
            <div style={{fontSize:12,color:C.red,textAlign:"center"}}>⚠️ La cuenta origen y destino deben ser diferentes</div>
          )}
          <MF label="Fecha">
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
          <MF label="Nota (opcional)">
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Descripción..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
        </div>
        <button onClick={()=>ok&&onTransfer(form.from,form.to,parseFloat(form.amount),form.date,form.note)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",
            background:ok?C.accent:C.border,color:ok?"#000":C.textMuted,
            fontWeight:800,fontSize:15,cursor:ok?"pointer":"default"}}>
          Transferir
        </button>
      </div>
    </div>
  );
}
