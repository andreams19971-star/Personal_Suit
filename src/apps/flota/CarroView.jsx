// flota/CarroView.jsx
import { useState, useEffect } from "react";
import { C, CAR1, CAR2, today, fmtCOP, fmtShort, ACCOUNTS, MONTHS } from "./shared.js";

export function CarroView({carro,stats,pagos,filterMonth,marcarPagado,eliminarPago,editarPago,setModal}) {
  const pagosMes = pagos.filter(p=>p.fecha.startsWith(filterMonth));
  const pagosOrdenados = [...pagosMes].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  return (
    <div style={{padding:14,display:"grid",gap:14}} className="fu">

      {/* HEADER CARRO */}
      <div style={{background:"linear-gradient(135deg,"+(carro.colorDim)+","+(C.card)+")",border:"1px solid "+(carro.color)+"44",borderRadius:20,padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:16,background:carro.color+"22",border:"1px solid "+(carro.color)+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{carro.icon}</div>
          <div>
            <div style={{fontSize:20,fontWeight:900}}>{carro.nombre}</div>
            <div style={{fontSize:12,color:C.textSub}}>{carro.modelo} · {carro.placa}</div>
            <div style={{fontSize:12,color:carro.color,fontWeight:600}}>Conductor: {carro.conductor}</div>
          </div>
        </div>

        {carro.tipo === "diario" ? (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {l:"Días pagados",  v:stats.diasPagados,    c:C.green},
                {l:"Días pendientes",v:stats.diasPendientes,c:stats.diasPendientes>0?C.yellow:C.green},
                {l:"Días laborales", v:stats.workDaysTotal,  c:C.textSub},
              ].map(i=>(
                <div key={i.l} style={{background:C.bg,borderRadius:10,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.textMuted,marginBottom:3}}>{i.l.toUpperCase()}</div>
                  <div style={{fontSize:20,fontWeight:900,color:i.c}}>{i.v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:C.textSub}}>Cobrado este mes</span>
              <span style={{fontSize:14,fontWeight:800,color:carro.color}}>{fmt(stats.cobrado)} / {fmt(stats.esperadoMes)}</span>
            </div>
            <div style={{height:8,borderRadius:4,background:C.border}}>
              <div style={{height:"100%",borderRadius:4,background:carro.color,width:(Math.min(100,Math.round((stats.cobrado/Math.max(stats.esperadoMes,1))*100)))+"%",transition:"width 1s ease"}}/>
            </div>
          </>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {l:"Mensualidad",v:fmt(carro.valorMensual),c:carro.color},
              {l:"Estado",     v:stats.pagado?"✓ Pagado":"⏳ Pendiente",c:stats.pagado?C.green:C.yellow},
            ].map(i=>(
              <div key={i.l} style={{background:C.bg,borderRadius:10,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>{i.l.toUpperCase()}</div>
                <div style={{fontSize:15,fontWeight:800,color:i.c}}>{i.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN AGREGAR */}
      {carro.tipo==="diario" && (
        <button onClick={()=>setModal({type:"dia",carroId:carro.id})} className="bp"
          style={{background:carro.color+"22",border:"1px solid "+(carro.color)+"44",borderRadius:12,padding:12,color:carro.color,fontWeight:700,fontSize:14,cursor:"pointer"}}>
          + Agregar día de trabajo
        </button>
      )}

      {/* LISTA DE PAGOS */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>
          {carro.tipo==="diario"?"REGISTRO DE DÍAS":"HISTORIAL DE PAGOS"} ({pagosOrdenados.length})
        </div>

        {pagosOrdenados.length===0 && (
          <div style={{textAlign:"center",padding:28,color:C.textMuted,fontSize:13,background:C.card,borderRadius:14,border:"1px solid "+(C.border)}}>
            📭 Sin registros este mes
          </div>
        )}

        <div style={{display:"grid",gap:8}}>
          {pagosOrdenados.map(pago => {
            const fecha = new Date(pago.fecha+"T12:00");
            const diaSemana = DAYS_ES[fecha.getDay()];
            return (
              <div key={pago.id} style={{background:C.card,border:"1px solid "+(pago.pagado?carro.color+"33":C.yellow+"33"),borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                {/* DÍA / FECHA */}
                <div style={{width:46,height:46,borderRadius:12,background:pago.pagado?carro.color+"22":C.yellow+"15",border:"1px solid "+(pago.pagado?carro.color+"44":C.yellow+"33"),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{fontSize:8,fontWeight:700,color:pago.pagado?carro.color:C.yellow}}>{diaSemana.toUpperCase()}</div>
                  <div style={{fontSize:16,fontWeight:900,color:pago.pagado?carro.color:C.yellow}}>{fecha.getDate()}</div>
                </div>

                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fmt(pago.monto)}</div>
                  <div style={{fontSize:10,color:C.textMuted}}>{pago.fecha}{pago.nota?" · "+(pago.nota):""}</div>
                </div>

                {/* TOGGLE PAGADO */}
                <button onClick={()=>marcarPagado(carro.id,pago.id)} className="bp"
                  style={{padding:"6px 14px",borderRadius:100,border:"1px solid "+(pago.pagado?carro.color:C.yellow),background:pago.pagado?carro.color+"22":C.yellow+"15",color:pago.pagado?carro.color:C.yellow,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {pago.pagado?"✓ Pagado":"⏳ Pendiente"}
                </button>
                {/* EDITAR */}
                <button onClick={()=>editarPago&&editarPago(carro.id,pago)} className="bp"
                  style={{background:"transparent",border:"1px solid "+C.border,color:C.accentText,borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12,flexShrink:0}}>
                  ✏️
                </button>
                {/* ELIMINAR */}
                <button onClick={()=>eliminarPago&&eliminarPago(carro.id,pago.id)} className="bp"
                  style={{background:C.redDim,border:"1px solid "+C.red+"33",color:C.red,borderRadius:8,padding:"6px 8px",cursor:"pointer",fontSize:12,flexShrink:0}}>
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* GASTOS DEL CARRO */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:C.textMuted}}>GASTOS DEL CARRO</div>
          <button onClick={()=>setModal({type:"gasto",carroId:carro.id})} style={{fontSize:11,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>+ Agregar</button>
        </div>
        {(carro.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).length===0 && (
          <div style={{textAlign:"center",padding:16,color:C.textMuted,fontSize:12,background:C.card,borderRadius:12,border:"1px solid "+(C.border)}}>Sin gastos este mes</div>
        )}
        <div style={{display:"grid",gap:8}}>
          {(carro.gastos||[]).filter(g=>g.fecha.startsWith(filterMonth)).map(g=>(
            <div key={g.id} style={{background:C.card,border:"1px solid "+(C.red)+"22",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔧</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{g.categoria}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{g.fecha}{g.nota?" · "+(g.nota):""}</div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:C.red}}>-{fmt(g.monto)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
