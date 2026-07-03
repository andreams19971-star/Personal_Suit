// finanz/TopBar.jsx
import { useState } from "react";
import { C, MONTHS, today } from "./shared.js";

export function TopBar({view,filterMonth,setFilterMonth,onMonthChange,setSidebarOpen,onBack,transactions=[]}){
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(parseInt((filterMonth||today().slice(0,7)).split("-")[0]));
  const titles={dashboard:"Dashboard",movements:"Movimientos",accounts:"Cuentas",loans:"Por cobrar",stats:"Estadísticas",cards:"Tarjetas"};

  const goMonth = (ym) => { setFilterMonth(ym); onMonthChange&&onMonthChange(ym); setShowPicker(false); };

  const [y, m] = (filterMonth||today().slice(0,7)).split("-");
  const label = MONTHS[parseInt(m)-1] + " " + y;

  const monthsWithData = new Set((transactions||[]).map(t=>t.date&&t.date.slice(0,7)).filter(Boolean));
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;
  const isFuture = (yr, mo) => yr > nowYear || (yr === nowYear && mo > nowMonth);

  return (
    <>
      <div style={{
        background:C.bg, borderBottom:"1px solid "+C.border,
        paddingTop:"max(14px, calc(env(safe-area-inset-top) + 8px))",
        paddingBottom:"12px", paddingLeft:"20px", paddingRight:"20px",
        display:"flex", alignItems:"center", gap:10, flexShrink:0,
      }}>
        {onBack&&<button onClick={onBack} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:500,flexShrink:0,padding:0}}>{"<- Suite"}</button>}
        <div style={{fontSize:17,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.3}}>{titles[view]||""}</div>

        <button onClick={()=>{ setPickerYear(parseInt(y)); setShowPicker(true); }} style={{
          display:"flex",alignItems:"center",gap:6,
          background:C.card,border:"1px solid "+C.border,borderRadius:20,
          padding:"5px 12px",color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,
        }}>
          {"📅 "+label+" ▾"}
        </button>

        <button onClick={()=>setSidebarOpen(true)} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16,padding:"4px",flexShrink:0}}>{"⚙"}</button>
      </div>

      {showPicker && (
        <div onClick={()=>setShowPicker(false)} style={{position:"fixed",inset:0,background:"#000000AA",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.surface,borderRadius:"20px 20px 0 0",
            width:"100%",maxWidth:480,padding:"20px 20px 36px",
            border:"1px solid "+C.border,
          }}>
            <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <button onClick={()=>setPickerYear(py=>py-1)} style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"6px 14px",color:C.text,cursor:"pointer",fontWeight:700,fontSize:16}}>{"<"}</button>
              <div style={{fontSize:18,fontWeight:800,color:C.text}}>{pickerYear}</div>
              <button onClick={()=>{ if(pickerYear<nowYear) setPickerYear(py=>py+1); }} style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"6px 14px",color:pickerYear>=nowYear?C.textMuted:C.text,cursor:pickerYear>=nowYear?"not-allowed":"pointer",fontWeight:700,fontSize:16}}>{">"}</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8}}>
              {MONTHS.map((mon, idx) => {
                const moNum   = idx + 1;
                const ym      = pickerYear + "-" + String(moNum).padStart(2,"0");
                const isActive   = ym === filterMonth;
                const hasData    = monthsWithData.has(ym);
                const future     = isFuture(pickerYear, moNum);
                return (
                  <button key={mon} onClick={()=>!future&&goMonth(ym)} disabled={future} style={{
                    padding:"12px 8px",borderRadius:12,border:"none",cursor:future?"not-allowed":"pointer",
                    background: isActive ? C.accent : hasData ? C.card : "transparent",
                    color: isActive ? "#000" : future ? C.textMuted : hasData ? C.text : C.textMuted,
                    fontWeight: isActive ? 800 : hasData ? 600 : 400,
                    fontSize: 14, opacity: future ? 0.4 : 1, position:"relative",
                  }}>
                    {mon}
                    {hasData && !isActive && (
                      <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:C.accent}}/>
                    )}
                  </button>
                );
              })}
            </div>

            <button onClick={()=>goMonth(today().slice(0,7))} style={{width:"100%",marginTop:16,padding:"10px",borderRadius:12,border:"1px solid "+C.border,background:"transparent",color:C.textSub,fontWeight:600,fontSize:13,cursor:"pointer"}}>
              {"📍 Ir al mes actual"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileNav({view,setView,loans}){
  const badge=loans.filter(l=>l.status==="active").length;
  const items=[
    {id:"dashboard",icon:"⌂", label:"Inicio"},
    {id:"movements",icon:"↕", label:"Movimientos"},
    {id:"cards",    icon:"▭", label:"Tarjetas"},
    {id:"loans",    icon:"⇌", label:"Cobrar",badge},
    {id:"stats",    icon:"▦", label:"Stats"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,background:C.bg,borderTop:"1px solid "+C.border,display:"flex",paddingBottom:"max(env(safe-area-inset-bottom), 6px)"}}>
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
