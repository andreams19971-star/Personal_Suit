// flota/Dashboard.jsx
import { useState, useEffect } from "react";
import { C, CAR1, CAR2, today, fmtCOP, fmtShort, ACCOUNTS, MONTHS } from "./shared.js";

export function Dashboard({carros,getStats,totalEsperado,totalCobrado,totalPendiente,totalGastos,totalNeto,filterMonth,setView}) {
  const pctCobrado = totalEsperado > 0 ? Math.round((totalCobrado/totalEsperado)*100) : 0;

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,#0A1628,"+(C.card)+")",border:"1px solid "+(CAR1)+"44",borderRadius:20,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:(CAR1)+"0D"}}/>
        <div style={{fontSize:11,color:CAR1,fontWeight:700,letterSpacing:1,marginBottom:4}}>INGRESOS DEL MES</div>
        <div style={{fontSize:34,fontWeight:900,letterSpacing:-1,marginBottom:2}}>{fmt(totalCobrado)}</div>
        <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>de {fmt(totalEsperado)} esperados</div>

        {/* BARRA PROGRESO */}
        <div style={{height:8,borderRadius:4,background:C.border,marginBottom:6}}>
          <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,"+(CAR1)+","+(CAR2)+")",width:(pctCobrado)+"%",transition:"width 1s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:CAR1,fontWeight:700}}>{pctCobrado}% cobrado</span>
          <span style={{color:totalPendiente>0?C.yellow:C.green,fontWeight:700}}>{fmt(totalPendiente)} pendiente</span>
        </div>

        <div style={{display:"flex",gap:12,marginTop:16,paddingTop:14,borderTop:"1px solid "+(CAR1)+"22"}}>
          {[[C.green,"💰","Cobrado",fmt(totalCobrado)],[C.red,"🔧","Gastos",fmt(totalGastos)],[totalNeto>=0?C.green:C.red,"=","Neto",fmt(totalNeto)]].map(([color,icon,label,val])=>(
            <div key={label} style={{flex:1}}>
              <div style={{fontSize:9,color,fontWeight:700,marginBottom:2}}>{icon} {label.toUpperCase()}</div>
              <div style={{fontSize:14,fontWeight:900,color}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TARJETAS POR CARRO */}
      {carros.map(carro => {
        const s = getStats(carro);
        const pct = s.esperadoMes > 0 ? Math.min(100, Math.round((s.cobrado/s.esperadoMes)*100)) : 0;
        const carColor  = carro.color   || (carro.id==="C1"?CAR1:CAR2);
        const carDim    = carro.color_dim|| (carro.id==="C1"?CAR1_DIM:CAR2_DIM);
        const valDiario = carro.valor_diario  || CARRO1_DIARIO;
        const valMensual= carro.valor_mensual || CARRO2_MENSUAL;
        return (
          <button key={carro.id} onClick={()=>setView("carro_"+carro.id)} className="bp"
            style={{background:"linear-gradient(135deg,"+(carDim)+","+(C.card)+")",border:"1px solid "+(carColor)+"44",borderRadius:18,padding:18,textAlign:"left",cursor:"pointer",color:C.text,width:"100%",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:carColor+"22",border:"1px solid "+(carColor)+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{carro.icon||"🚗"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:800}}>{carro.nombre}</div>
                <div style={{fontSize:11,color:C.textSub}}>{carro.conductor} · {carro.placa}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:900,color:carColor}}>{fmt(s.cobrado)}</div>
                <div style={{fontSize:10,color:C.textMuted}}>cobrado</div>
              </div>
            </div>

            {carro.tipo === "diario" ? (
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Días pagados</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.green}}>{s.diasPagados}</div>
                </div>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Días pendientes</div>
                  <div style={{fontSize:16,fontWeight:800,color:s.diasPendientes>0?C.yellow:C.green}}>{s.diasPendientes}</div>
                </div>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Valor/día</div>
                  <div style={{fontSize:16,fontWeight:800,color:carColor}}>{fmt(valDiario)}</div>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Mensualidad</div>
                  <div style={{fontSize:16,fontWeight:800,color:carColor}}>{fmt(valMensual)}</div>
                </div>
                <div style={{flex:2,background:C.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Estado mes actual</div>
                  <div style={{fontSize:15,fontWeight:800,color:s.pagado?C.green:C.yellow}}>{s.pagado?"✓ Pagado":"⏳ Pendiente"}</div>
                </div>
              </div>
            )}

            <div style={{height:6,borderRadius:3,background:C.border}}>
              <div style={{height:"100%",borderRadius:3,background:carro.color,width:(pct)+"%",transition:"width 1s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.textMuted}}>
              <span>{pct}% del mes cobrado</span>
              <span style={{color:carro.color}}>Ver detalle →</span>
            </div>
          </button>
        );
      })}

      {/* TIP FINANCIERO */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
        <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:6}}>💡 RESUMEN DEL MES</div>
        <div style={{display:"grid",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Ingreso esperado total</span>
            <span style={{fontWeight:700}}>{fmt(totalEsperado)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Ya cobrado</span>
            <span style={{fontWeight:700,color:C.green}}>{fmt(totalCobrado)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Por cobrar</span>
            <span style={{fontWeight:700,color:C.yellow}}>{fmt(totalPendiente)}</span>
          </div>
          <div style={{height:1,background:C.border,margin:"4px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:C.textSub}}>Gastos de carros</span>
            <span style={{fontWeight:700,color:C.red}}>-{fmt(totalGastos)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
            <span style={{fontWeight:700}}>Ganancia neta</span>
            <span style={{fontWeight:900,color:totalNeto>=0?C.green:C.red}}>{fmt(totalNeto)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
