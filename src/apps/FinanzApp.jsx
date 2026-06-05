import { useState, useEffect, useContext } from "react";
import * as XLSX from "xlsx";
import { useFinanzData } from "../hooks/useFinanzData.js";
import { useCardsData }  from "../hooks/useCardsData.js";
import { checkFinanzAlerts, requestPermission, showLocalNotification } from "../hooks/useNotifications.js";
import { AuthContext } from '../hooks/useAuth.js';
import { loadSetting, saveSetting } from "../hooks/useSettings.js";
import { C, fmtCOP, fmtShort, today, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./finanz/shared.js";
import { TxRow, SectionHeader, EmptyState, Pill, StatCard, MF } from "./finanz/Helpers.jsx";
import { TopBar, MobileNav } from "./finanz/TopBar.jsx";
import { Dashboard }     from "./finanz/Dashboard.jsx";
import { Movements, AccountsView } from "./finanz/Movements.jsx";
import { LoansView, LoanDetail }   from "./finanz/LoansView.jsx";
import { CardsView, ChargeModal, EditChargeModal, CardEditModal } from "./finanz/CardsView.jsx";
import { Stats }         from "./finanz/Stats.jsx";
import { Sidebar }       from "./finanz/Sidebar.jsx";
import { AccountsManager } from "./finanz/AccountsManager.jsx";
import { CategoriesManager } from "./finanz/CategoriesManager.jsx";
import { AddModal, LoanModal, PayModal, EditTxModal, TransferModal } from "./finanz/Modals.jsx";

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
function _getUser() { try { const a=useContext(AuthContext); return a?.user?.id; } catch{} return null; }
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
    if (!tx.amount || tx.amount <= 0) { showToast("El monto debe ser mayor a 0","error"); return; }
    if (!tx.account)                  { showToast("Selecciona una cuenta","error"); return; }

    // Si se seleccionó una tarjeta, registrar como cargo de tarjeta
    if (tx.account.startsWith("card-")) {
      const cardId = tx.account.replace("card-","");
      const result = await addCharge(cardId, {
        date:     tx.date,
        amount:   tx.amount,
        category: tx.category,
        note:     tx.note||"",
        installments: 1,
      });
      if (result?.error) { showToast("Error al guardar: "+result.error,"error"); return; }
      showToast("Cargo a tarjeta registrado ✓");
      setShowAddModal(false); setAddModalOpts({});
      return;
    }

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
      {showAddModal      && <AddModal  onClose={()=>{ setShowAddModal(false); setAddModalOpts({}); }} onAdd={addTransaction} accounts={accounts} cards={cards} opts={addModalOpts} categories={categories}/>}
      {showLoanModal     && <LoanModal onClose={()=>setShowLoanModal(false)} onAdd={addLoan} accounts={accounts} cards={cards}/>}
      {showPayModal      && <PayModal  onClose={()=>setShowPayModal(null)} loan={showPayModal} onPay={addPayment} accounts={accounts}/>}
      {showTransferModal && <TransferModal onClose={()=>setShowTransferModal(false)} onTransfer={addTransfer} accounts={accounts}/>}
      {toast && <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?C.red:C.accent,color:toast.type==="error"?"#fff":"#000",padding:"10px 20px",borderRadius:100,fontWeight:700,fontSize:14,zIndex:9999,animation:"fa-toastIn .3s ease",whiteSpace:"nowrap",boxShadow:"0 8px 24px #0006"}}>{toast.msg}</div>}
    </div>
  );
}
