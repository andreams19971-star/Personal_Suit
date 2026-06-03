// finanz/CardsView.jsx
import { useState, useEffect, useRef } from "react";
import { C, fmtCOP, fmtShort, today, td, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";
import { MF, SectionHeader, EmptyState, TxRow } from "./Helpers.jsx";

export function CardsView({ cards, addCharge, deleteCharge, updateCharge, markPaid, saveCard, addCard, filterMonth, showToast }) {
  const [selCard, setSelCard] = useState(cards[0]?.id || null);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showEditCard, setShowEditCard] = useState(null);
  const [editCharge, setEditCharge] = useState(null); // {cardId, charge}

  const card = cards.find(c => c.id === selCard) || cards[0];

  const handleAddCharge    = async (charge) => { await addCharge(selCard, charge); showToast("Gasto registrado ✓"); setShowAddCharge(false); };
  const handleDeleteCharge = async (cardId, chargeId) => { await deleteCharge(cardId, chargeId); showToast("Gasto eliminado", "error"); };
  const handleUpdateCharge = async (cardId, chargeId, updates) => { await updateCharge(cardId, chargeId, updates); showToast("Gasto actualizado ✓"); setEditCharge(null); };
  const handleMarkPaid     = async (cardId) => { await markPaid(cardId); showToast("Tarjeta pagada ✓"); };
  const handleSaveCard     = async (cardId, updates) => { await saveCard(cardId, updates); showToast("Tarjeta actualizada ✓"); setShowEditCard(null); };
  const handleAddCard      = async (data) => { await addCard(data); showToast("Tarjeta agregada ✓"); setShowEditCard(null); };

  const totalDebt = cards.reduce((s, c) => s + (c.balance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (c.limit || 0), 0);

  const CHARGE_CATS = ["Supermercado","Restaurante","Gasolina","Ropa","Entretenimiento","Salud","Viajes","Tecnología","Servicios","Otro"];

  const monthCharges = (card?.charges || []).filter(ch => ch.date?.startsWith(filterMonth));

  return (
    <div style={{padding:"16px",display:"grid",gap:14,boxSizing:"border-box"}} className="fa-fade-up">

      {/* RESUMEN GLOBAL */}
      <div style={{background:"linear-gradient(135deg,"+(C.redDim)+","+(C.card)+")",border:"1px solid "+(C.red)+"44",borderRadius:18,padding:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:90,height:90,borderRadius:"50%",background:(C.red)+"0D",pointerEvents:"none"}}/>
        <div style={{fontSize:11,color:C.red,fontWeight:700,marginBottom:3}}>DEUDA TOTAL TARJETAS</div>
        <div style={{fontSize:28,fontWeight:900}}>{fmtCOP(totalDebt)}</div>
        <div style={{fontSize:12,color:C.textMuted,marginTop:4}}>Límite total disponible: {fmtCOP(totalLimit - totalDebt)}</div>
        <div style={{height:6,borderRadius:3,background:C.border,marginTop:10}}>
          <div style={{height:"100%",borderRadius:3,background:C.red,width:(Math.min(100,Math.round((totalDebt/Math.max(totalLimit,1))*100)))+"%",transition:"width 1s ease"}}/>
        </div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{Math.round((totalDebt/Math.max(totalLimit,1))*100)}% del límite usado</div>
      </div>

      {/* SELECTOR DE TARJETA */}
      <div className="overflow-guard">
        <div className="hscroll-edge" style={{gap:10,paddingBottom:2}}>
          {cards.map(c => (
            <button key={c.id} onClick={()=>setSelCard(c.id)} style={{
              padding:"10px 14px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:12,
              background:selCard===c.id?c.color+"33":C.card,
              border:"1px solid "+(selCard===c.id?c.color:C.border),
              color:selCard===c.id?c.color:C.textSub,
              display:"flex",alignItems:"center",gap:6,
            }}>
              <span>💳</span>{c.name}
            </button>
          ))}
          <button onClick={()=>setShowEditCard("new")} style={{padding:"10px 14px",borderRadius:12,cursor:"pointer",fontSize:12,fontWeight:700,background:C.card,border:"1px solid "+(C.border),color:C.textMuted}}>+ Nueva</button>
        </div>
      </div>

      {/* TARJETA ACTIVA */}
      {card && (
        <div style={{background:"linear-gradient(135deg, "+(card.color)+"22, "+(C.card)+")",border:"1px solid "+(card.color)+"44",borderRadius:20,padding:18}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:800}}>{card.name}</div>
              <div style={{fontSize:12,color:C.textMuted}}>{card.bank} •••• {card.last4}</div>
            </div>
            <button onClick={()=>setShowEditCard(card.id)} style={{background:card.color+"22",border:"1px solid "+(card.color)+"44",color:card.color,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏️ Editar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {l:"Saldo actual",    v:fmtCOP(card.balance||0),   c:card.color},
              {l:"Límite",          v:fmtCOP(card.limit||0),     c:C.textSub},
              {l:"Disponible",      v:fmtCOP((card.limit||0)-(card.balance||0)), c:(card.limit||0)-(card.balance||0)>0?C.green:C.red},
              {l:"Día de corte",    v:"Día "+(card.cutDay||"-"),  c:C.yellow},
            ].map(item=>(
              <div key={item.l} style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>{item.l.toUpperCase()}</div>
                <div style={{fontSize:14,fontWeight:800,color:item.c}}>{item.v}</div>
              </div>
            ))}
          </div>
          {/* PAGO MÍNIMO */}
          {(card.balance||0) > 0 && (() => {
            const saldo   = card.balance || 0;
            const minPct  = Math.max(saldo * 0.05, 20000); // 5% del saldo, mínimo $20.000
            const minFijo = saldo <= 500000 ? saldo : minPct;
            const totalSug = minFijo * 1.15; // incluye intereses aprox 3% mensual
            return (
              <div style={{background:C.yellowDim,border:"1px solid "+C.yellow+"44",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:10,color:C.yellow,fontWeight:700,marginBottom:6}}>⚡ PAGO MÍNIMO ESTIMADO</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:900,color:C.yellow}}>{fmtCOP(Math.round(totalSug/1000)*1000)}</div>
                    <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Base {fmtCOP(Math.round(minFijo/1000)*1000)} + intereses aprox.</div>
                  </div>
                  <div style={{fontSize:10,color:C.textMuted,textAlign:"right"}}>
                    <div>Tasa ~3% mensual</div>
                    <div style={{color:C.red,fontWeight:600}}>Pagar antes día {card.payDay||"?"}</div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div style={{height:8,borderRadius:4,background:C.border,marginBottom:8}}>
            <div style={{height:"100%",borderRadius:4,background:card.color,width:(Math.min(100,Math.round(((card.balance||0)/Math.max(card.limit||1,1))*100)))+"%",transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAddCharge(true)} style={{flex:1,background:card.color,color:"#000",border:"none",borderRadius:10,padding:"10px",fontWeight:800,fontSize:13,cursor:"pointer"}}>+ Registrar gasto</button>
            <button onClick={()=>handleMarkPaid(card.id)} style={{background:C.greenDim,border:"1px solid "+(C.green)+"44",color:C.green,borderRadius:10,padding:"10px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Pagar</button>
          </div>
        </div>
      )}

      {/* GASTOS DEL MES */}
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.textMuted,marginBottom:8}}>
          GASTOS DEL MES ({monthCharges.length}) · {fmtCOP(monthCharges.reduce((s,c)=>s+c.amount,0))}
        </div>
        {monthCharges.length === 0 && (
          <div style={{textAlign:"center",padding:20,color:C.textMuted,fontSize:13,background:C.card,borderRadius:14,border:"1px solid "+(C.border)}}>
            📭 Sin gastos este mes
          </div>
        )}
        <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          {monthCharges.map((ch,i)=>(
            <div key={ch.id} className="fa-tx-row" style={{padding:"11px 14px",borderBottom:i<monthCharges.length-1?"1px solid "+(C.border):"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>💳</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.note||ch.category}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{ch.category} · {ch.date}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:800,color:C.red}}>-{fmtCOP(ch.amount)}</div>
              </div>
              <button onClick={()=>setEditCharge({cardId:card.id,charge:ch})} style={{background:"none",border:"none",color:C.accentText,cursor:"pointer",fontSize:12,opacity:.7,flexShrink:0}}>✏️</button>
              <button onClick={()=>handleDeleteCharge(card.id, ch.id)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,opacity:.5,flexShrink:0}}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL NUEVO GASTO */}
      {showAddCharge && (
        <ChargeModal card={card} onClose={()=>setShowAddCharge(false)} onAdd={handleAddCharge} cats={CHARGE_CATS}/>
      )}
      {/* MODAL EDITAR GASTO */}
      {editCharge && (
        <EditChargeModal
          charge={editCharge.charge}
          card={cards.find(c=>c.id===editCharge.cardId)}
          cats={CHARGE_CATS}
          onClose={()=>setEditCharge(null)}
          onSave={(chargeId, updates)=>handleUpdateCharge(editCharge.cardId, chargeId, updates)}
        />
      )}

      {/* MODAL EDITAR/NUEVA TARJETA */}
      {showEditCard && (
        <CardEditModal
          card={showEditCard==="new" ? null : cards.find(c=>c.id===showEditCard)}
          onClose={()=>setShowEditCard(null)}
          onSave={showEditCard==="new" ? handleAddCard : (updates)=>handleSaveCard(showEditCard, updates)}
        />
      )}
    </div>
  );
}

export function ChargeModal({ card, onClose, onAdd, cats }) {
  const [form, setForm] = useState({ date:today(), amount:"", category:"Supermercado", note:"", installments:1 });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(card.color)+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>💳 Gasto en {card.name}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:C.redDim,border:"1px solid "+(C.red)+"33",borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:3}}>MONTO</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:20,color:C.textMuted}}>$</span>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="0"
              style={{flex:1,background:"transparent",border:"none",fontSize:24,fontWeight:900,color:C.red}}/>
          </div>
        </div>
        <div style={{display:"grid",gap:10}}>
          {[["Categoría","select"],["Fecha","date"],["Descripción","text"]].map(([label,type])=>{
            const key = label==="Categoría"?"category":label==="Fecha"?"date":"note";
            return (
              <div key={key}>
                <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
                {type==="select"
                  ? <select value={form[key]} onChange={e=>set(key,e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
                      {cats.map(c=><option key={c}>{c}</option>)}
                    </select>
                  : <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={label==="Descripción"?"Ej: Mercado Éxito":""}
                      style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
                }
              </div>
            );
          })}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>CUOTAS</div>
            <div style={{display:"flex",gap:6}}>
              {[1,3,6,12,24,36].map(n=>(
                <button key={n} onClick={()=>set("installments",n)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"1px solid "+(form.installments===n?card.color:C.border),background:form.installments===n?card.color+"22":"transparent",color:form.installments===n?card.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {n===1?"Cont.":n+"x"}
                </button>
              ))}
            </div>
          </div>
          {form.installments > 1 && form.amount && (
            <div style={{background:C.card,borderRadius:9,padding:"8px 12px",fontSize:12,color:C.textSub}}>
              Cuota mensual: <strong style={{color:card.color}}>{fmtCOP(parseFloat(form.amount)/form.installments)}</strong> × {form.installments} meses
            </div>
          )}
        </div>
        <button onClick={()=>form.amount&&onAdd({...form,amount:parseFloat(form.amount)})}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:form.amount?card.color:C.border,color:form.amount?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Registrar Gasto
        </button>
      </div>
    </div>
  );
}

export function EditChargeModal({ charge, card, cats, onClose, onSave }) {
  const [form, setForm] = useState({
    date:         charge.date,
    amount:       charge.amount,
    category:     charge.category,
    note:         charge.note || "",
    installments: charge.installments || 1,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+((card?.color)||C.accent)+"55",animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar gasto</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:12}}>
          <MF label="Monto">
            <div style={{background:C.redDim,border:"1px solid "+C.red+"33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:C.textMuted,fontSize:16}}>$</span>
              <input type="number" value={form.amount} onChange={e=>set("amount",parseFloat(e.target.value)||0)}
                style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color:C.red}}/>
            </div>
          </MF>
          <MF label="Categoría">
            <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </MF>
          <MF label="Fecha">
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
          <MF label="Descripción">
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </MF>
        </div>
        <button onClick={()=>onSave(charge.id, form)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:C.red,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

export function CardEditModal({ card, onClose, onSave }) {
  const [form, setForm] = useState({
    name:    card?.name    || "",
    bank:    card?.bank    || "",
    last4:   card?.last4   || "",
    limit:   card?.limit   || 5000000,
    cutDay:  card?.cutDay  || 25,
    payDay:  card?.payDay  || 10,
    color:   card?.color   || "#60A5FA",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const COLORS = ["#60A5FA","#FFD166","#FB923C","#A78BFA","#F472B6","#34D399","#F87171","#00D97E"];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"18px 18px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.border),animation:"fa-slideUp .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>{card?"Editar tarjeta":"Nueva tarjeta"}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          {[["Nombre",form.name,"name","Ej: Visa Bancolombia"],["Banco",form.bank,"bank","Ej: Bancolombia"],["Últimos 4 dígitos",form.last4,"last4","0000"]].map(([label,val,key,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
              <input value={val} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>LÍMITE DE CRÉDITO</div>
            <input type="number" value={form.limit} onChange={e=>set("limit",parseFloat(e.target.value)||0)}
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DÍA DE CORTE</div>
              <input type="number" value={form.cutDay} onChange={e=>set("cutDay",parseInt(e.target.value)||1)} min="1" max="31"
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>DÍA DE PAGO</div>
              <input type="number" value={form.payDay} onChange={e=>set("payDay",parseInt(e.target.value)||1)} min="1" max="31"
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:8}}>COLOR DE TARJETA</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(col=>(
                <button key={col} onClick={()=>set("color",col)}
                  style={{width:32,height:32,borderRadius:"50%",background:col,border:form.color===col?"3px solid #fff":"2px solid transparent",cursor:"pointer"}}/>
              ))}
            </div>
          </div>
        </div>
        <button onClick={()=>form.name&&onSave(form)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:form.name?form.color:C.border,color:form.name?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          {card?"Guardar cambios":"Agregar tarjeta"}
        </button>
      </div>
    </div>
  );
}
