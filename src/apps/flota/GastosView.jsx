// flota/GastosView.jsx
import { useState, useEffect } from "react";
import { C, CAR1, CAR2, today, fmtCOP, fmtShort, ACCOUNTS, MONTHS } from "./shared.js";

export function GastosView({carros,filterMonth,setModal,totalGastos}) {
  const allGastos = carros.flatMap(c =>
    (c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).map(g=>({...g,carroNombre:c.nombre,carroColor:c.color,carroIcon:c.icon}))
  ).sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const totalPorCarro = carros.map(c=>({
    ...c,
    total:(c.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).reduce((s,g)=>s+g.monto,0)
  }));

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">
      <div style={{background:"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+(C.red)+"44",borderRadius:18,padding:18}}>
        <div style={{fontSize:11,color:C.red,fontWeight:700,marginBottom:3}}>TOTAL GASTOS DEL MES</div>
        <div style={{fontSize:30,fontWeight:900}}>{fmt(totalGastos)}</div>
        <div style={{display:"flex",gap:12,marginTop:12}}>
          {totalPorCarro.map(c=>(
            <div key={c.id} style={{flex:1,background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}>
              <div style={{fontSize:16}}>{c.icon}</div>
              <div style={{fontSize:10,color:C.textMuted,margin:"2px 0"}}>{c.nombre}</div>
              <div style={{fontSize:13,fontWeight:800,color:C.red}}>{fmt(c.total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTONES AGREGAR */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {carros.map(c=>(
          <button key={c.id} onClick={()=>setModal({type:"gasto",carroId:c.id})} className="bp"
            style={{background:c.colorDim,border:"1px solid "+(c.color)+"44",borderRadius:12,padding:12,color:c.color,fontWeight:700,fontSize:13,cursor:"pointer"}}>
            + Gasto {c.nombre}
          </button>
        ))}
      </div>

      {allGastos.length===0 && <div style={{textAlign:"center",padding:28,color:C.textMuted,fontSize:13}}>📭 Sin gastos este mes</div>}

      <div style={{display:"grid",gap:8}}>
        {allGastos.map(g=>(
          <div key={g.id} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:g.carroColor+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.carroIcon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700}}>{g.categoria}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{g.carroNombre} · {g.fecha}{g.nota?" · "+(g.nota):""}</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:C.red}}>-{fmt(g.monto)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
