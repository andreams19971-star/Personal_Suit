// finanz/Helpers.jsx
import {{ useState, useEffect }} from "react";
import * as XLSX from "xlsx";
import {{ C, fmtCOP, fmtShort, today, td, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES }} from "./shared.js";

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

function SectionHeader({title,action,onAction}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,width:"100%",overflow:"hidden"}}><div style={{fontSize:14,fontWeight:700,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>{action&&<button onClick={onAction} style={{fontSize:12,color:C.accentText,background:"none",border:"none",cursor:"pointer",fontWeight:600,flexShrink:0,marginLeft:8,whiteSpace:"nowrap"}}>{action} →</button>}</div>);}

function EmptyState({label}){return(<div style={{textAlign:"center",padding:"24px 16px",color:C.textMuted,fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📭</div>{label}</div>);}

