// finanz/Modals.jsx
import { useState, useEffect, useRef } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, MONTHS, fmtCOP, fmtShort, today } from "./shared.js";
import { MF, SectionHeader, EmptyState } from "./Helpers.jsx";

export function AddModal({onClose,onAdd,accounts,cards=[],opts,categories=DEFAULT_CATEGORIES}){
  const [type,setType]=useState(opts.type||"expense");
  const [form,setForm]=useState({date:today(),category:opts.category||"",subcategory:"",account:accounts[0]?.id||"",amount:"",note:opts.note||""});
  const cats=categories[type];
  const selCat=cats.find(c=>c.id===form.category);
  const set=(k,v)=>setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const submit=()=>{
    if(!form.amount||!form.category||!form.account)return;
    onAdd({...form,type,amount:parseFloat(form.amount)});
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"92vh",overflowY:"auto",borderTop:"1px solid "+(C.border)}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:800}}>Nuevo Movimiento</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",background:C.card,borderRadius:14,padding:4,marginBottom:16,border:"1px solid "+(C.border)}}>
          {[["income","↑ Ingreso"],["expense","↓ Gasto"]].map(([t,l])=>(
            <button key={t} onClick={()=>{ setType(t); setForm(f=>({...f,category:"",subcategory:""})); }} style={{flex:1,padding:10,borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,background:type===t?(t==="income"?C.accentDim:C.redDim):"transparent",color:type===t?(t==="income"?C.accentText:C.red):C.textSub}}>{l}</button>
          ))}
        </div>
        <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:14,border:"1px solid "+(C.border)}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:24,color:C.textMuted,fontWeight:300}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:28,fontWeight:900,color:type==="income"?C.accentText:C.red}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Categoría">
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:form.category?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar categoría</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </MF>
          {selCat&&<MF label="Subcategoría">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:form.subcategory?C.text:C.textMuted,fontSize:14}}>
              <option value="">Seleccionar subcategoría</option>
              {selCat.subs.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </MF>}
          <MF label="Cuenta / Tarjeta">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              <optgroup label="── Cuentas ──">
                {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
              </optgroup>
              {type==="expense" && cards.length>0 && (
                <optgroup label="── Tarjetas ──">
                  {cards.map(card=><option key={"card-"+card.id} value={"card-"+card.id}>💳 {card.name} ···{card.last4}</option>)}
                </optgroup>
              )}
            </select>
          </MF>
          <MF label="Descripción (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Pago mensual Netflix" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={submit} disabled={!form.amount||!form.category||!form.account} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:(!form.amount||!form.category||!form.account)?C.border:C.accent,color:(!form.amount||!form.category||!form.account)?C.textMuted:"#000",fontWeight:800,fontSize:16,cursor:(!form.amount||!form.category||!form.account)?"not-allowed":"pointer"}}>Registrar Movimiento</button>
      </div>
    </div>
  );
}

export function LoanModal({onClose,onAdd,accounts,cards=[]}){
  const [sourceType,setSourceType]=useState("account"); // account | card
  const [form,setForm]=useState({debtor:"",amount:"",date:today(),account:accounts[0]?.id||"",cardId:"",subcategory:"Préstamo personal",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const ok=form.debtor&&form.amount&&(sourceType==="account"?form.account:form.cardId);
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.orange)+"66"}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>🤝 Registrar Préstamo</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Aparecerá en <span style={{color:C.orange,fontWeight:700}}>Por Cobrar</span></div>
        <div style={{background:C.orangeDim,border:"1px solid "+(C.orange)+"44",borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.orange}}/>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Nombre del deudor"><input type="text" value={form.debtor} onChange={e=>set("debtor",e.target.value)} placeholder="Ej: Carlos Rodríguez" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Fecha"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Tipo">
            <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              <option>Préstamo personal</option><option>Préstamo familiar</option><option>Préstamo laboral</option><option>Auxilio de emergencia</option>
            </select>
          </MF>
          {/* FUENTE DEL PRÉSTAMO */}
          <MF label="Fuente del dinero">
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {[["account","💰 Cuenta"],["card","💳 Tarjeta"]].map(([t,l])=>(
                <button key={t} onClick={()=>setSourceType(t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(sourceType===t?C.accent:C.border),background:sourceType===t?C.accentDim:"transparent",color:sourceType===t?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {l}
                </button>
              ))}
            </div>
            {sourceType==="account"&&(
              <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
              </select>
            )}
            {sourceType==="card"&&(
              <select value={form.cardId} onChange={e=>set("cardId",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
                <option value="">Seleccionar tarjeta...</option>
                {cards.map(c=><option key={c.id} value={c.id}>{c.name} ···{c.last4}</option>)}
              </select>
            )}
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Para auxilio médico" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={()=>ok&&onAdd({...form,amount:parseFloat(form.amount),sourceType})} disabled={!ok} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:ok?C.orange:C.border,color:ok?"#fff":C.textMuted,fontWeight:800,fontSize:16,cursor:ok?"pointer":"not-allowed"}}>Registrar Préstamo</button>
      </div>
    </div>
  );
}

export function PayModal({onClose,loan,onPay,accounts}){
  const [form,setForm]=useState({date:today(),amount:"",account:accounts[0]?.id||"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const amt=parseFloat(form.amount)||0;
  const isTotal=amt>=loan.balance;
  const remaining=Math.max(0,loan.balance-amt);
  const ok=form.amount&&amt>0;
  return(
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px",animation:"fa-slideUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accentText)+"66"}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>💸 Registrar Cobro</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:C.card,border:"1px solid "+(C.orange)+"44",borderRadius:14,padding:14,marginBottom:16}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:2}}>PRÉSTAMO A</div>
          <div style={{fontSize:16,fontWeight:800}}>{loan.debtor}</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            <div><div style={{fontSize:11,color:C.textMuted}}>Prestado</div><div style={{fontWeight:700}}>{fmtCOP(loan.amount)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:C.orange}}>Pendiente</div><div style={{fontWeight:900,color:C.orange,fontSize:18}}>{fmtCOP(loan.balance)}</div></div>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:700,marginBottom:8}}>COBRO RÁPIDO</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[.25,.5,.75,1].map((f,i)=>{
              const v=Math.round(loan.balance*f);
              return <button key={i} onClick={()=>set("amount",v.toString())} style={{padding:"6px 12px",borderRadius:100,border:"1px solid "+(C.border),background:amt===v?C.accentDim:C.card,color:amt===v?C.accentText:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{["25%","50%","75%","Total"][i]}</button>;
            })}
          </div>
        </div>
        <div style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",borderRadius:16,padding:16,marginBottom:14}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>MONTO A COBRAR{isTotal&&<span style={{color:C.accentText,fontWeight:700}}> · ¡Pago total!</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0" style={{flex:1,background:"transparent",border:"none",fontSize:26,fontWeight:900,color:C.accentText}}/>
            <span style={{fontSize:12,color:C.textMuted}}>COP</span>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          <MF label="Fecha del cobro"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
          <MF label="Cuenta destino (¿dónde entra el dinero?)">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Nota (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Segundo abono acordado" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        {ok&&<div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:12,padding:"10px 14px",marginTop:14,fontSize:13,color:C.textSub}}>
          Saldo restante: <span style={{fontWeight:800,color:remaining===0?C.accentText:C.orange}}>{fmtCOP(remaining)}</span>
        </div>}
        <button onClick={()=>ok&&onPay(loan,form)} disabled={!ok} style={{width:"100%",marginTop:16,padding:14,borderRadius:14,border:"none",background:ok?C.accentText:C.border,color:ok?"#000":C.textMuted,fontWeight:800,fontSize:16,cursor:ok?"pointer":"not-allowed"}}>
          {isTotal?"✓ Registrar Pago Total":"💸 Registrar Abono"}
        </button>
      </div>
    </div>
  );
}

export function EditTxModal({tx,onClose,onSave,accounts,categories=DEFAULT_CATEGORIES}){
  const [form,setForm]=useState({
    date:tx.date, type:tx.type, category:tx.category,
    subcategory:tx.subcategory||"", account:tx.account,
    amount:tx.amount, note:tx.note||""
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cats=categories[form.type]||[];
  const cat=cats.find(c=>c.id===form.category);
  return(
    <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar movimiento</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TIPO</div>
            <div style={{display:"flex",gap:8}}>
              {["income","expense"].map(t=>(
                <button key={t} onClick={()=>set("type",t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(form.type===t?C.accent:C.border),background:form.type===t?C.accentDim:"transparent",color:form.type===t?C.accent:C.textSub,cursor:"pointer",fontWeight:700,fontSize:12}}>
                  {t==="income"?"💰 Ingreso":"💸 Gasto"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>MONTO</div>
            <input type="number" value={form.amount} onChange={e=>set("amount",parseFloat(e.target.value)||0)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:16,fontWeight:800}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CATEGORÍA</div>
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>SUBCATEGORÍA</div>
              <select value={form.subcategory} onChange={e=>set("subcategory",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
                <option value="">Sin subcategoría</option>
                {cat.subs.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CUENTA</div>
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>FECHA</div>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DESCRIPCIÓN</div>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <button onClick={()=>onSave(tx.id,form)}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:C.accent,color:"#000",fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

export function TransferModal({onClose, onTransfer, accounts}) {
  const [form, setForm] = useState({ from:"cash", to:"nequi", amount:"", date:today(), note:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const ok = form.from && form.to && form.from !== form.to && parseFloat(form.amount) > 0;
  const fromAcc = accounts.find(a=>a.id===form.from);
  const toAcc   = accounts.find(a=>a.id===form.to);
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>↔️ Transferencia entre cuentas</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>

        {/* Preview visual */}
        {ok && (
          <div style={{background:C.accentDim,border:"1px solid "+C.accent+"44",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:8,textAlign:"center",justifyContent:"center"}}>
            <div>
              <div style={{fontSize:18}}>{fromAcc?.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:C.red}}>{fromAcc?.label}</div>
              <div style={{fontSize:12,color:C.red}}>-{fmtCOP(parseFloat(form.amount))}</div>
            </div>
            <div style={{fontSize:20,color:C.accent}}>→</div>
            <div>
              <div style={{fontSize:18}}>{toAcc?.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:C.green}}>{toAcc?.label}</div>
              <div style={{fontSize:12,color:C.green}}>+{fmtCOP(parseFloat(form.amount))}</div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gap:12}}>
          <MF label="Monto">
            <div style={{background:C.accentDim,border:"1px solid "+C.accent+"33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:C.textMuted,fontSize:16}}>$</span>
              <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
                style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color:C.accent}}/>
            </div>
          </MF>
          <MF label="Desde">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {accounts.map(a=>(
                <button key={a.id} onClick={()=>set("from",a.id)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:9,
                  border:"1px solid "+(form.from===a.id?C.red:C.border),
                  background:form.from===a.id?C.redDim:"transparent",
                  color:form.from===a.id?C.red:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center",
                  opacity:form.to===a.id?0.3:1}}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </MF>
          <MF label="Hacia">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {accounts.map(a=>(
                <button key={a.id} onClick={()=>set("to",a.id)} style={{flex:"1 1 auto",padding:"8px 6px",borderRadius:9,
                  border:"1px solid "+(form.to===a.id?C.green:C.border),
                  background:form.to===a.id?C.greenDim:"transparent",
                  color:form.to===a.id?C.green:C.textSub,
                  cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center",
                  opacity:form.from===a.id?0.3:1}}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </MF>
          {form.from === form.to && form.from && (
            <div style={{fontSize:12,color:C.red,textAlign:"center"}}>⚠️ La cuenta origen y destino deben ser diferentes</div>
          )}
          <MF label="Fecha">
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
          <MF label="Nota (opcional)">
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Descripción..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
        </div>
        <button onClick={()=>ok&&onTransfer(form.from,form.to,parseFloat(form.amount),form.date,form.note)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",
            background:ok?C.accent:C.border,color:ok?"#000":C.textMuted,
            fontWeight:800,fontSize:15,cursor:ok?"pointer":"default"}}>
          Transferir
        </button>
      </div>
    </div>
  );
}
