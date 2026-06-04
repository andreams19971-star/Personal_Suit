// finanz/AccountsView.jsx
import { useState, useEffect } from "react";
import { C, fmtCOP, fmtShort, today, today, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";
import { TxRow, EmptyState, SectionHeader } from "./Helpers.jsx";

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

