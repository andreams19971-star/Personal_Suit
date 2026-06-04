// finanz/MobileNav.jsx
import {{ useState, useEffect }} from "react";
import {{ C, fmtCOP, fmtShort, today, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES }} from "./shared.js";

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

