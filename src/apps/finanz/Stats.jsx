// finanz/Stats.jsx
import { useState, useEffect, useRef } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, MONTHS, fmtCOP, fmtShort, today } from "./shared.js";
import { TxRow, SectionHeader, EmptyState, Pill, StatCard, MF } from "./Helpers.jsx";

export function Stats({monthTxs,totalIncome,totalExpense,transactions,filterMonth,categories=DEFAULT_CATEGORIES}){
  const expByCat={},incByCat={};
  monthTxs.filter(t=>t.type==="expense").forEach(t=>{
    const cat=categories.expense.find(c=>c.id===t.category);
    const lbl=cat?(cat.icon)+" "+(cat.label):t.category;
    expByCat[lbl]=(expByCat[lbl]||0)+t.amount;
  });
  monthTxs.filter(t=>t.type==="income").forEach(t=>{
    const cat=categories.income.find(c=>c.id===t.category);
    const lbl=cat?(cat.icon)+" "+(cat.label):t.category;
    incByCat[lbl]=(incByCat[lbl]||0)+t.amount;
  });

  const savings   = totalIncome - totalExpense;
  const savRate   = totalIncome > 0 ? Math.round((savings/totalIncome)*100) : 0;
  const spendRate = totalIncome > 0 ? Math.round((totalExpense/totalIncome)*100) : 0;

  // Últimos 6 meses para comparativa
  const last6 = Array.from({length:6},(_,i)=>{
    const d = new Date(filterMonth+'-01');
    d.setMonth(d.getMonth() - (5-i));
    const key = d.toISOString().slice(0,7);
    const mo  = MONTHS[d.getMonth()]
    const txs = transactions.filter(t=>t.date.startsWith(key));
    const inc = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { mo, inc, exp, net:inc-exp };
  });
  const maxBar = Math.max(...last6.map(m=>Math.max(m.inc,m.exp)),1);

  // Día de mayor gasto del mes
  const byDay = {};
  monthTxs.filter(t=>t.type==='expense').forEach(t=>{
    byDay[t.date]=(byDay[t.date]||0)+t.amount;
  });
  const topDay = Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];

  const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return(
    <div style={{padding:"16px",display:"grid",gap:14,boxSizing:"border-box"}} className="fa-fade-up">

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:"linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")",border:"1px solid "+(C.accentText)+"33",borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.accentText,fontWeight:700}}>INGRESOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalIncome)}</div>
        </div>
        <div style={{background:"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+(C.red)+"33",borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.red,fontWeight:700}}>GASTOS</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4}}>{fmtCOP(totalExpense)}</div>
        </div>
        <div style={{background:savings>=0?"linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")":"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+((savings>=0?C.accentText:C.red)+"33"),borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:savings>=0?C.accentText:C.red,fontWeight:700}}>BALANCE</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savings>=0?C.accentText:C.red}}>{fmtCOP(savings)}</div>
        </div>
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:14}}>
          <div style={{fontSize:11,color:C.yellow,fontWeight:700}}>TASA AHORRO</div>
          <div style={{fontSize:22,fontWeight:900,marginTop:4,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red}}>{savRate}%</div>
        </div>
      </div>

      {/* BARRA PROGRESO AHORRO */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700}}>Salud Financiera</span>
          <span style={{fontSize:12,color:savRate>=20?C.accentText:savRate>=10?C.yellow:C.red,fontWeight:700}}>
            {savRate>=20?"🟢 Excelente":savRate>=10?"🟡 Regular":"🔴 Atención"}
          </span>
        </div>
        <div style={{display:"grid",gap:8}}>
          {[
            {label:"Ahorro",     pct:Math.min(100,savRate),   color:C.accentText, meta:"Meta: 20%"},
            {label:"Gasto",      pct:Math.min(100,spendRate), color:spendRate>80?C.red:C.yellow, meta:"del ingreso"},
          ].map(item=>(
            <div key={item.label}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.textSub}}>{item.label}</span>
                <span style={{color:item.color,fontWeight:700}}>{item.pct}% <span style={{color:C.textMuted,fontWeight:400}}>{item.meta}</span></span>
              </div>
              <div style={{height:8,borderRadius:4,background:C.border}}>
                <div style={{height:"100%",borderRadius:4,background:item.color,width:(item.pct)+"%",transition:"width 1s ease"}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:10,padding:"8px 12px",background:C.bg,borderRadius:8}}>
          {savRate>=20?"¡Excelente! Estás ahorrando más del 20% recomendado. Considera invertir el excedente.":
           savRate>=10?"Vas bien, pero puedes mejorar. Intenta llegar al 20% reduciendo gastos no esenciales.":
           savings<0?"⚠️ Estás gastando más de lo que ganas. Revisa tus gastos urgente.":
           "Tu tasa de ahorro es baja. Identifica gastos que puedas reducir."}
        </div>
      </div>

      {/* GRÁFICO 6 MESES */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Evolución últimos 6 meses</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:100,marginBottom:8}}>
          {last6.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:80}}>
                <div style={{flex:1,borderRadius:"3px 3px 0 0",background:C.accentText,height:m.inc?Math.max(4,(m.inc/maxBar)*76):2,transition:"height .8s ease"}}/>
                <div style={{flex:1,borderRadius:"3px 3px 0 0",background:C.red,height:m.exp?Math.max(4,(m.exp/maxBar)*76):2,transition:"height .8s ease"}}/>
              </div>
              <span style={{fontSize:9,color:C.textMuted}}>{m.mo}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:14,justifyContent:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textSub}}>
            <div style={{width:10,height:10,borderRadius:2,background:C.accentText}}/> Ingresos
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.textSub}}>
            <div style={{width:10,height:10,borderRadius:2,background:C.red}}/> Gastos
          </div>
        </div>
      </div>

      {/* COMPARATIVO MES ANTERIOR */}
      {last6.length>=2&&(()=>{
        const curr = last6[last6.length-1];
        const prev = last6[last6.length-2];
        const expDiff = curr.exp - prev.exp;
        const incDiff = curr.inc - prev.inc;
        return(
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:16,padding:16}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Vs. mes anterior</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"Gastos", diff:expDiff, prev:prev.exp, invert:true},
                {label:"Ingresos",diff:incDiff,prev:prev.inc, invert:false},
              ].map(item=>{
                const pct = item.prev>0?Math.round(Math.abs(item.diff/item.prev)*100):0;
                const up  = item.diff > 0;
                const good = item.invert ? !up : up;
                const color = item.diff===0 ? C.textMuted : good ? C.green : C.red;
                return(
                  <div key={item.label} style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:C.textMuted,fontWeight:600,marginBottom:4}}>{item.label.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:800,color}}>{item.diff===0?"=":(up?"▲":"▼")+" "+pct+"%"}</div>
                    <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{item.diff===0?"Sin cambio":(up?"+":" ")+fmtShort(item.diff)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TOP GASTO DEL DÍA */}
      {topDay && (
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Día de mayor gasto</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,color:C.textSub}}>{new Date(topDay[0]+'T12:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'short'})}</div>
            </div>
            <div style={{fontSize:18,fontWeight:900,color:C.red}}>{fmtCOP(topDay[1])}</div>
          </div>
        </div>
      )}

      {/* DESGLOSE GASTOS */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Gastos por categoría</div>
        {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amount])=>{
          const pct=totalExpense>0?Math.round((amount/totalExpense)*100):0;
          return(
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13}}>{cat}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.red}}>{fmtCOP(amount)} <span style={{color:C.textMuted,fontWeight:400}}>{pct}%</span></span>
              </div>
              <div style={{height:6,borderRadius:3,background:C.border}}>
                <div style={{height:"100%",borderRadius:3,background:"hsl("+(360-pct*3.6)+",70%,60%)",width:(pct)+"%",transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(expByCat).length===0&&<EmptyState label="Sin gastos este mes"/>}
      </div>

      {/* DESGLOSE INGRESOS */}
      <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,padding:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Ingresos por categoría</div>
        {Object.entries(incByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amount])=>{
          const pct=totalIncome>0?Math.round((amount/totalIncome)*100):0;
          return(
            <div key={cat} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13}}>{cat}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.accentText}}>{fmtCOP(amount)} <span style={{color:C.textMuted,fontWeight:400}}>{pct}%</span></span>
              </div>
              <div style={{height:6,borderRadius:3,background:C.border}}>
                <div style={{height:"100%",borderRadius:3,background:C.accentText,width:(pct)+"%",transition:"width .8s ease"}}/>
              </div>
            </div>
          );
        })}
        {Object.keys(incByCat).length===0&&<EmptyState label="Sin ingresos registrados"/>}
      </div>
    </div>
  );
}
