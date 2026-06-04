// finanz/TopBar.jsx
import { useState, useEffect, useRef } from "react";
import { C, fmtCOP, fmtShort, today, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";

export function TopBar({view,filterMonth,setFilterMonth,onMonthChange,setSidebarOpen,openAddModal,onBack}){
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

export function MobileNav({view,setView,openAddModal,loans}){
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
