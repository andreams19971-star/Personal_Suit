// apartamento/FinancesView.jsx
import { useState, useEffect } from "react";
import { C, today, fmtCOP } from "./shared.js";

export function FinancesView({reservations,expenses,totalExpenses,setModal,deleteExpense}) {
  const neto = -totalExpenses;

  return(
    <div style={{padding:"14px",display:"grid",gap:14,boxSizing:"border-box"}} className="ap-fu">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[[C.red,"🔧","Gastos del mes",fmt(totalExpenses)],[neto<=0?C.red:C.green,"=","Neto",fmt(neto)]].map(([color,icon,label,val])=>(
          <div key={label} style={{background:C.card,border:"1px solid "+((color)+"33"),borderRadius:14,padding:14}}>
            <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>{label.toUpperCase()}</div>
            <div style={{fontSize:15,fontWeight:800,color}}>{val}</div>
          </div>
        ))}
      </div>

      <button onClick={()=>setModal({type:"addExpense"})} style={{background:C.redDim,border:"1px solid "+((C.red)+"44"),color:C.red,borderRadius:12,padding:12,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Registrar gasto</button>

      {/* GASTOS */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>GASTOS ({expenses.length})</div>
        {expenses.length===0&&<div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:"1px solid "+(C.border)}}>Sin gastos registrados</div>}
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          {expenses.map((exp,i)=>(
            <div key={exp.id} className="hr" style={{padding:"10px 14px",borderBottom:i<expenses.length-1?"1px solid "+(C.border):"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🔧</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.note||exp.category}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{exp.category} · {exp.date}{exp.room?" · "+exp.room:""}</div>
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
