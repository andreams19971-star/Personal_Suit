// finanz/LoansView.jsx
import { useState, useEffect, useRef } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, MONTHS, fmtCOP, fmtShort, today } from "./shared.js";
import { TxRow, SectionHeader, EmptyState, Pill, StatCard, MF } from "./Helpers.jsx";

export function LoansView({loans,transactions,setShowLoanModal,setShowPayModal,accounts,showToast,categories=DEFAULT_CATEGORIES}){
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

export function LoanDetail({loan,transactions,onBack,setShowPayModal,accounts,categories=DEFAULT_CATEGORIES}){
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
