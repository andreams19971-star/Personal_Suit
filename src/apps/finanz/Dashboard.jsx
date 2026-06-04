// finanz/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, MONTHS, fmtCOP, fmtShort, today } from "./shared.js";
import { TxRow, SectionHeader, EmptyState, Pill, StatCard, MF } from "./Helpers.jsx";

export function Dashboard({transactions,accounts,loans,totalIncome,totalExpense,netBalance,filterMonth,setView,setSelAccount,monthTxs,categories=DEFAULT_CATEGORIES,settings={}}){
  const totalAssets=accounts.reduce((s,a)=>s+a.balance,0);
  const totalPending=loans.filter(l=>l.status==="active").reduce((s,l)=>s+l.balance,0);
  const expByCat={};
  monthTxs.filter(t=>t.type==="expense").forEach(t=>{expByCat[t.category]=(expByCat[t.category]||0)+t.amount;});
  const topCats=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i));
    const key=d.toISOString().slice(0,10);
    return{label:["Do","Lu","Ma","Mi","Ju","Vi","Sá"][d.getDay()],total:monthTxs.filter(t=>t.date===key&&t.type==="expense").reduce((s,t)=>s+t.amount,0)};
  });
  const maxDay=Math.max(...last7.map(d=>d.total),1);
  return(
    <div className="fa-dash fa-fade-up">
      {/* PATRIMONIO */}
      <div className="fa-pad" style={{paddingTop:20,paddingBottom:20,borderBottom:"1px solid "+C.border}}>
        <div style={{fontSize:11,color:C.textMuted,fontWeight:500,letterSpacing:0.5,marginBottom:8}}>PATRIMONIO TOTAL</div>
        <div style={{fontSize:34,fontWeight:700,letterSpacing:-1.5,color:C.text,marginBottom:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtCOP(totalAssets)}</div>
        <div className="metrics-row">
          {[
            {label:"Ingresos",val:fmtShort(totalIncome), color:C.green, icon:"↑"},
            {label:"Egresos", val:fmtShort(totalExpense),color:C.red,   icon:"↓"},
            {label:"Balance", val:fmtShort(netBalance),  color:netBalance>=0?C.green:C.red,icon:"="},
            ...(totalPending>0?[{label:"Cobrar",val:fmtShort(totalPending),color:C.yellow,icon:"·"}]:[]),
          ].map((item,i,arr)=>(
            <div key={item.label} style={{flex:1,minWidth:0,paddingRight:i<arr.length-1?8:0,borderRight:i<arr.length-1?"1px solid "+C.border:"none",marginRight:i<arr.length-1?8:0,overflow:"hidden"}}>
              <div style={{fontSize:8,color:C.textMuted,fontWeight:600,marginBottom:3,whiteSpace:"nowrap"}}>{item.icon} {item.label.toUpperCase()}</div>
              <div style={{fontSize:13,fontWeight:700,color:item.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CUENTAS */}
      <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
        <SectionHeader title="Mis cuentas" action="Ver todas" onAction={()=>setView("accounts")}/>
        <div className="hscroll-edge" style={{gap:10,paddingTop:10}}>
          {accounts.map(acc=>(
            <button key={acc.id} onClick={()=>{setSelAccount(acc.id);setView("accounts");}} className="fa-btn"
              style={{background:"transparent",border:"1px solid "+C.border,borderRadius:12,padding:"12px 14px",width:108,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:18,marginBottom:6}}>{acc.icon}</div>
              <div style={{fontSize:9,color:C.textMuted,fontWeight:500,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acc.label.toUpperCase()}</div>
              <div style={{fontSize:13,fontWeight:700,color:acc.balance>0?C.text:acc.balance<0?C.red:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtCOP(acc.balance)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PRÉSTAMOS */}
      {loans.filter(l=>l.status==="active").length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Por cobrar" action="Ver todos" onAction={()=>setView("loans")}/>
          {loans.filter(l=>l.status==="active").slice(0,3).map((loan,i,arr)=>(
            <div key={loan.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<arr.length-1?"1px solid "+C.borderSub:"none"}}>
              <div style={{width:30,height:30,borderRadius:8,background:C.card,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>👤</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loan.debtor}</div>
                <div style={{height:2,borderRadius:1,background:C.border,marginTop:5}}>
                  <div style={{height:"100%",borderRadius:1,background:C.yellow,width:(Math.min(100,Math.round((1-loan.balance/loan.amount)*100)))+"%"}}/>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:700,color:C.yellow}}>{fmtCOP(loan.balance)}</div>
                <div style={{fontSize:9,color:C.textMuted}}>pendiente</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GRÁFICA */}
      <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
        <SectionHeader title="Gastos últimos 7 días"/>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:56,marginTop:14,overflow:"hidden"}}>
          {last7.map((d,i)=>{
            const barH=maxDay>0&&d.total>0?Math.max(4,Math.min(40,(d.total/maxDay)*40)):3;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,justifyContent:"flex-end",height:"100%"}}>
                {d.total>0&&<div style={{fontSize:7,color:C.textMuted}}>{(d.total/1000).toFixed(0)}k</div>}
                <div style={{width:"100%",borderRadius:3,background:d.total?C.red:C.border,height:barH,flexShrink:0}}/>
                <span style={{fontSize:8,color:C.textMuted}}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP CATEGORÍAS */}
      {topCats.length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Top gastos" action="Stats" onAction={()=>setView("stats")}/>
          <div style={{display:"grid",gap:10,marginTop:12}}>
            {topCats.map(([catId,amount])=>{
              const cat=categories.expense.find(c=>c.id===catId)||{label:catId,icon:"📦"};
              return(
                <div key={catId}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:C.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{cat.icon} {cat.label}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text,flexShrink:0}}>{fmtCOP(amount)}</span>
                  </div>
                  <div style={{height:2,borderRadius:1,background:C.border}}>
                    <div style={{height:"100%",borderRadius:1,background:C.red,width:Math.min(100,Math.round((amount/totalExpense)*100))+"%"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRESUPUESTOS */}
      {settings.budgets && Object.keys(settings.budgets).filter(k=>settings.budgets[k]>0).length>0&&(
        <div className="fa-pad" style={{paddingTop:16,borderBottom:"1px solid "+C.border,paddingBottom:16}}>
          <SectionHeader title="Presupuestos" action="Configurar" onAction={()=>setView("stats")}/>
          <div style={{display:"grid",gap:10,marginTop:12}}>
            {Object.entries(settings.budgets).filter(([,v])=>v>0).map(([catId,budget])=>{
              const cat = categories.expense.find(c=>c.id===catId)||{label:catId,icon:"📦"};
              const spent = monthTxs.filter(t=>t.type==="expense"&&t.category===catId).reduce((s,t)=>s+t.amount,0);
              const pct   = Math.min(100, Math.round((spent/budget)*100));
              const over  = spent > budget;
              const color = over ? C.red : pct > 80 ? C.yellow : C.green;
              return(
                <div key={catId}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                    <span style={{fontSize:13,color:C.textSub}}>{cat.icon} {cat.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color}}>
                      {fmtShort(spent)} / {fmtShort(budget)}
                      {over && <span style={{fontSize:10,marginLeft:4,color:C.red}}>▲ {pct-100}%</span>}
                    </span>
                  </div>
                  <div style={{height:4,borderRadius:2,background:C.border}}>
                    <div style={{height:"100%",borderRadius:2,background:color,width:pct+"%",transition:"width .4s ease"}}/>
                  </div>
                  {over&&<div style={{fontSize:10,color:C.red,marginTop:3}}>Excedido en {fmtCOP(spent-budget)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECIENTES */}
      <div className="fa-pad" style={{paddingTop:16,paddingBottom:16}}>
        <SectionHeader title="Movimientos recientes" action="Ver todos" onAction={()=>setView("movements")}/>
        <div style={{marginTop:10}}>
          {monthTxs.slice(0,5).map((tx,i)=><TxRow key={tx.id} tx={tx} compact categories={categories} showDivider={i<Math.min(4,monthTxs.length-1)}/>)}
          {monthTxs.length===0&&<EmptyState label="Sin movimientos este mes"/>}
        </div>
      </div>
    </div>
  );
}
