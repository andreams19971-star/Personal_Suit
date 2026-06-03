// finanz/Movements.jsx
import { useState, useEffect, useRef } from "react";
import { C, fmtCOP, fmtShort, today, td, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";
import { TxRow, SectionHeader, EmptyState, Pill, StatCard, MF } from "./Helpers.jsx";

export function Movements({transactions,filterMonth,deleteTransaction,openAddModal,loans,categories=DEFAULT_CATEGORIES,setEditTx}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=transactions
    .filter(t=>t.date.startsWith(filterMonth))
    .filter(t=>filter==="all"||t.type===filter)
    .filter(t=>!search||[t.note,t.category,t.subcategory].join(" ").toLowerCase().includes(search.toLowerCase()));
  const grouped={};
  filtered.forEach(t=>{(grouped[t.date]=grouped[t.date]||[]).push(t);});
  const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  function exportXLSX() {
    const wb = XLSX.utils.book_new();
    // Hoja 1: Movimientos del mes
    const txRows = [["Fecha","Tipo","Categoría","Subcategoría","Cuenta","Monto","Descripción"]];
    filtered.forEach(t=>txRows.push([t.date,t.type==="income"?"Ingreso":"Gasto",t.category||"",t.subcategory||"",t.account||"",t.amount,t.note||""]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), "Movimientos");
    // Hoja 2: Resumen por categoría
    const catMap = {};
    filtered.filter(t=>t.type==="expense").forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
    const catRows = [["Categoría","Total"]];
    Object.entries(catMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>catRows.push([k,v]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catRows), "Por Categoría");
    // Descargar
    XLSX.writeFile(wb, "FinanzApp-"+filterMonth+".xlsx");
  }

  function exportPDF() {
    const win=window.open("","_blank");
    win.document.write('<html><head><title>Movimientos '+filterMonth+'</title><style>body{font-family:Arial;font-size:11px;margin:20px}h2{color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px}th{background:#18181b;color:#fff}.i{color:green;font-weight:700}.e{color:red;font-weight:700}tfoot td{font-weight:700;background:#f5f5f5}</style></head><body>');
    win.document.write('<h2>Movimientos · '+filterMonth+'</h2>');
    win.document.write('<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Cuenta</th><th>Monto</th><th>Descripción</th></tr></thead><tbody>');
    filtered.forEach(t=>{const c=t.type==="income"?"i":"e";win.document.write('<tr><td>'+t.date+'</td><td class="'+c+'">'+(t.type==="income"?"↑ Ingreso":"↓ Gasto")+'</td><td>'+(t.category||"")+'</td><td>'+(t.account||"")+'</td><td class="'+c+'">$'+t.amount.toLocaleString("es-CO")+'</td><td>'+(t.note||"")+'</td></tr>');});
    const tot=filtered.reduce((s,t)=>s+(t.type==="income"?t.amount:-t.amount),0);
    win.document.write('<tr><td colspan="4"><strong>BALANCE</strong></td><td colspan="2" class="'+(tot>=0?"i":"e")+'">'+(tot>=0?"+":"")+tot.toLocaleString("es-CO")+'</td></tr>');
    win.document.write('</tbody></table></body></html>');
    win.document.close(); win.print();
  }

  return(
    <div style={{padding:"16px",display:"grid",gap:12,boxSizing:"border-box"}} className="fa-fade-up">
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textMuted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
          style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:12,padding:"10px 12px 10px 36px",color:C.text,fontSize:14}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6}}>
          {[["all","Todos"],["income","Ingresos"],["expense","Gastos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 12px",borderRadius:100,border:filter!==v?"1px solid "+(C.border):"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filter===v?C.accent:C.card,color:filter===v?"#000":C.textSub}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={exportXLSX} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.card,color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>📊 Excel</button>
          <button onClick={exportPDF} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+C.border,background:C.card,color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600}}>🖨 PDF</button>
        </div>
      </div>
      {sortedDates.length===0&&<EmptyState label="Sin movimientos"/>}
      {sortedDates.map(date=>(
        <div key={date}>
          <div style={{fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:6,paddingLeft:4}}>
            {new Date(date+"T12:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </div>
          <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
            {grouped[date].map((tx,i)=>(
              <TxRow key={tx.id} tx={tx} onDelete={()=>deleteTransaction(tx.id)} onEdit={setEditTx?()=>setEditTx(tx):null} showDivider={i<grouped[date].length-1} categories={categories}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountsView({accounts,transactions,selAccount,setSelAccount,filterMonth,showToast,categories=DEFAULT_CATEGORIES,deleteTransaction,setEditTx}){
  const active=selAccount||accounts[0]?.id;
  const acc=accounts.find(a=>a.id===active)||accounts[0];
  const accTxs=transactions.filter(t=>t.account===active&&t.date.startsWith(filterMonth));
  const totalIn=accTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalOut=accTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  return(
    <div style={{padding:"16px",display:"grid",gap:16,boxSizing:"border-box"}} className="fa-fade-up">
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
        {accounts.map(a=>(
          <button key={a.id} onClick={()=>setSelAccount(a.id)} style={{padding:"10px 14px",borderRadius:14,border:active!==a.id?"1px solid "+(C.border):"none",cursor:"pointer",background:active===a.id?C.accent:C.card,color:active===a.id?"#000":C.textSub,fontWeight:700,fontSize:13,flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>
      {acc&&(
        <div style={{background:"linear-gradient(135deg,"+(C.card)+","+(C.cardHover)+")",border:"1px solid "+(acc.color)+"44",borderRadius:20,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{fontSize:32}}>{acc.icon}</div>
            <div><div style={{fontSize:20,fontWeight:800}}>{acc.label}</div><div style={{fontSize:12,color:C.textMuted}}>Cuenta activa</div></div>
          </div>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>SALDO ACTUAL</div>
          <div style={{fontSize:36,fontWeight:900,color:acc.balance>=0?C.text:C.red,letterSpacing:-2}}>{fmtCOP(acc.balance)}</div>
          <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap"}}>
            <div><div style={{fontSize:11,color:C.accentText}}>↑ INGRESOS</div><div style={{fontSize:16,fontWeight:700}}>{fmtCOP(totalIn)}</div></div>
            <div><div style={{fontSize:11,color:C.red}}>↓ EGRESOS</div><div style={{fontSize:16,fontWeight:700}}>{fmtCOP(totalOut)}</div></div>
            <div><div style={{fontSize:11,color:C.yellow}}>= NETO</div><div style={{fontSize:16,fontWeight:700,color:(totalIn-totalOut)>=0?C.accentText:C.red}}>{fmtCOP(totalIn-totalOut)}</div></div>
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:13,fontWeight:700,color:C.textMuted,marginBottom:10}}>MOVIMIENTOS DEL MES ({accTxs.length})</div>
        {accTxs.length===0&&<EmptyState label="Sin movimientos en esta cuenta"/>}
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:16,overflow:"hidden"}}>
          {accTxs.sort((a,b)=>b.date.localeCompare(a.date)).map((tx,i)=>(
            <TxRow key={tx.id} tx={tx} showDivider={i<accTxs.length-1} categories={categories}
              onDelete={deleteTransaction ? ()=>deleteTransaction(tx.id) : null}
              onEdit={setEditTx ? ()=>setEditTx(tx) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
