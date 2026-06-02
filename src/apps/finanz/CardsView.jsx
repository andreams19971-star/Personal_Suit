// finanz/CardsView.jsx
import {{ useState, useEffect }} from "react";
import * as XLSX from "xlsx";
import {{ C, fmtCOP, fmtShort, today, td, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES }} from "./shared.js";

function CardsView({ cards, addCharge, deleteCharge, updateCharge, markPaid, saveCard, addCard, filterMonth, showToast }) {
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

