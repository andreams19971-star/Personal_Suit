// finanz/Helpers.jsx
import { useState, useEffect, useRef } from "react";
import { C, fmtCOP, fmtShort, today, today, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";

export function TxRow({tx,onDelete,onEdit,showDivider=false,compact=false,categories=DEFAULT_CATEGORIES}){
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
export function Pill({color,label,value,icon}){return(<div style={{flex:"1 1 0",minWidth:0,overflow:"hidden"}}><div style={{fontSize:9,color,fontWeight:700,marginBottom:2,whiteSpace:"nowrap"}}>{icon} {label.toUpperCase()}</div><div style={{fontSize:13,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div></div>);}
export function SectionHeader({title,action,onAction}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,width:"100%",overflow:"hidden"}}><div style={{fontSize:14,fontWeight:700,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>{action&&<button onClick={onAction} style={{fontSize:12,color:C.accentText,background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0,marginLeft:8,whiteSpace:"nowrap"}}>{action} →</button>}</div>);}
export function StatCard({label,value,color,icon}){return(<div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:18,color,marginBottom:4}}>{icon}</div><div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{label}</div><div style={{fontSize:15,fontWeight:800,color}}>{value}</div></div>);}
export function MF({label,children}){return(<div><div style={{fontSize:11,color:C.textMuted,fontWeight:700,marginBottom:4,paddingLeft:2}}>{label.toUpperCase()}</div>{children}</div>);}
export function EmptyState({label}){return(<div style={{textAlign:"center",padding:"24px 16px",color:C.textMuted,fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📭</div>{label}</div>);}
