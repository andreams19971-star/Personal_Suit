// finanz/Modals.jsx
import { useState } from "react";
import { C, fmtCOP, today, td, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";

}

// ─── ACCOUNTS MANAGER ────────────────────────────────────────────────────────
const ACCOUNT_ICONS = ["💵","💳","🏦","💜","🔵","🟡","🔴","🟢","⚫","🟠","💰","🏧"];
const ACCOUNT_COLORS = ["#00D97E","#A78BFA","#4D9EFF","#FFD166","#FF4D6A","#FB923C","#34D399","#F472B6","#60A5FA","#FBBF24"];

function AccountsManager({accounts, updateAccountBalance, showToast}) {
  const [editId, setEditId] = useState(null);
  const [newAcc, setNewAcc] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (acc) => {
    setEditId(acc.id);
    setEditForm({ label: acc.label, icon: acc.icon, initialBalance: acc.initialBalance });
  };

  const saveEdit = async () => {
    if (!editForm.label) return;
    await updateAccountBalance(editId, parseFloat(editForm.initialBalance) || 0, editForm);
    showToast("Cuenta actualizada ✓");
    setEditId(null);
  };

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>MIS CUENTAS</div>
        <button onClick={()=>setNewAcc({label:"",icon:"💵",color:C.accentText,initialBalance:0})}
          style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          + Nueva cuenta
        </button>
      </div>
      <div style={{fontSize:11,color:C.textMuted,marginTop:-6}}>Configura nombre, ícono y saldo inicial de cada cuenta</div>

      {/* Nueva cuenta form */}
      {newAcc && (
        <div style={{background:C.card,border:"1px solid "+(C.accentText)+"44",borderRadius:14,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.accentText,marginBottom:10}}>+ NUEVA CUENTA</div>
          <div style={{display:"grid",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>NOMBRE</div>
              <input value={newAcc.label} onChange={e=>setNewAcc(a=>({...a,label:e.target.value}))} placeholder="Ej: Efectivo, Nequi..."
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>ÍCONO</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ACCOUNT_ICONS.map(ic=>(
                  <button key={ic} onClick={()=>setNewAcc(a=>({...a,icon:ic}))}
                    style={{width:34,height:34,borderRadius:8,border:"1px solid "+(newAcc.icon===ic?C.accent:C.border),background:newAcc.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:16}}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>COLOR</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ACCOUNT_COLORS.map(col=>(
                  <button key={col} onClick={()=>setNewAcc(a=>({...a,color:col}))}
                    style={{width:28,height:28,borderRadius:"50%",background:col,border:newAcc.color===col?"3px solid #fff":"2px solid transparent",cursor:"pointer"}}>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>SALDO INICIAL</div>
              <input type="number" value={newAcc.initialBalance} onChange={e=>setNewAcc(a=>({...a,initialBalance:parseFloat(e.target.value)||0}))} placeholder="0"
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={async()=>{
                if(!newAcc.label)return;
                const id=newAcc.label.toLowerCase().replace(/\s+/g,"-")+"-"+Date.now();
                await updateAccountBalance(id, newAcc.initialBalance, {label:newAcc.label,icon:newAcc.icon,color:newAcc.color,isNew:true});
                showToast((newAcc.label)+" creada ✓");
                setNewAcc(null);
              }} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"9px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Crear cuenta
              </button>
              <button onClick={()=>setNewAcc(null)}
                style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"9px 12px",color:C.textSub,cursor:"pointer",fontSize:13}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cuentas existentes */}
      {accounts.map(acc=>(
        <div key={acc.id} style={{background:C.card,border:"1px solid "+(editId===acc.id?acc.color+"66":C.border),borderRadius:14,overflow:"hidden"}}>
          {editId===acc.id ? (
            <div style={{padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:acc.color,marginBottom:10}}>EDITANDO: {acc.label}</div>
              <div style={{display:"grid",gap:8}}>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>NOMBRE</div>
                  <input value={editForm.label} onChange={e=>setEditForm(f=>({...f,label:e.target.value}))}
                    style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:6}}>ÍCONO</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {ACCOUNT_ICONS.map(ic=>(
                      <button key={ic} onClick={()=>setEditForm(f=>({...f,icon:ic}))}
                        style={{width:32,height:32,borderRadius:8,border:"1px solid "+(editForm.icon===ic?C.accent:C.border),background:editForm.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:15}}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>SALDO INICIAL</div>
                  <input type="number" value={editForm.initialBalance} onChange={e=>setEditForm(f=>({...f,initialBalance:e.target.value}))}
                    style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveEdit} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"9px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>Guardar</button>
                  <button onClick={()=>setEditId(null)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"9px 12px",color:C.textSub,cursor:"pointer",fontSize:13}}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20,flexShrink:0}}>{acc.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>{acc.label}</div>
                <div style={{fontSize:11,color:C.accentText}}>Saldo actual: {fmtCOP(acc.balance)}</div>
                <div style={{fontSize:11,color:C.textMuted}}>Inicial: {fmtCOP(acc.initialBalance)}</div>
              </div>
              <button onClick={()=>startEdit(acc)}
                style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"33",color:C.accentText,borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                ✏️ Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── CATEGORIES MANAGER ───────────────────────────────────────────────────────
const CAT_ICONS = ["💼","🏪","📈","🤝","💰","🏠","🍽️","🚗","🏥","📚","🎮","👗","🏦","💳","📦","✈️","🐾","🎵","🌿","⚡"];

function CategoriesManager({ categories, saveCategories, showToast }) {
  const [type, setType]   = useState("income");
  const [editCat, setEditCat] = useState(null); // {idx, ...cat} or "new"
  const [editSub, setEditSub] = useState(null); // {catIdx, subIdx} or null

  const cats = categories[type];

  const addCategory = (cat) => {
    const updated = { ...categories, [type]: [...cats, { ...cat, id: "cat_"+Date.now(), subs: [] }] };
    saveCategories(updated);
    setEditCat(null);
    showToast("Categoría creada ✓");
  };

  const updateCategory = (idx, updates) => {
    const list = cats.map((c,i) => i===idx ? {...c,...updates} : c);
    saveCategories({ ...categories, [type]: list });
    setEditCat(null);
    showToast("Categoría actualizada ✓");
  };

  const deleteCategory = (idx) => {
    saveCategories({ ...categories, [type]: cats.filter((_,i)=>i!==idx) });
    showToast("Categoría eliminada","err");
  };

  const addSub = (catIdx, sub) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:[...(c.subs||[]), sub]});
    saveCategories({ ...categories, [type]: list });
    setEditSub(null);
  };

  const deleteSub = (catIdx, subIdx) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:c.subs.filter((_,j)=>j!==subIdx)});
    saveCategories({ ...categories, [type]: list });
  };

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",gap:6}}>
        {[["income","Ingresos"],["expense","Gastos"]].map(([t,l])=>(
          <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(type===t?C.accent:C.border),background:type===t?C.accentDim:"transparent",color:type===t?C.accent:C.textSub,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      <button onClick={()=>setEditCat("new")} style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:9,padding:"9px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Nueva categoría</button>

      {editCat==="new" && (
        <CatForm onSave={addCategory} onCancel={()=>setEditCat(null)}/>
      )}

      {cats.map((cat,idx)=>(
        <div key={cat.id||idx} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700}}>{cat.label}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{(cat.subs||[]).length} subcategorías</div>
            </div>
            <button onClick={()=>setEditCat(editCat===idx?null:idx)} style={{background:C.accentDim,color:C.accentText,border:"1px solid "+(C.accentText)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️</button>
            <button onClick={()=>deleteCategory(idx)} style={{background:C.redDim,color:C.red,border:"1px solid "+(C.red)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>🗑</button>
          </div>
          {editCat===idx && (
            <div style={{padding:"0 12px 12px",borderTop:"1px solid "+(C.border)}}>
              <CatForm initial={cat} onSave={(u)=>updateCategory(idx,u)} onCancel={()=>setEditCat(null)}/>
            </div>
          )}
          {/* Subcategorías */}
          <div style={{padding:"0 12px 10px"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
              {(cat.subs||[]).map((sub,si)=>(
                <div key={si} style={{display:"flex",alignItems:"center",gap:3,background:C.bg,border:"1px solid "+(C.border),borderRadius:100,padding:"3px 8px"}}>
                  <span style={{fontSize:11,color:C.textSub}}>{sub}</span>
                  <button onClick={()=>deleteSub(idx,si)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,lineHeight:1,padding:"0 1px"}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setEditSub(editSub?.catIdx===idx?null:{catIdx:idx,val:""})}
                style={{background:"transparent",border:"1px dashed "+(C.border),borderRadius:100,padding:"3px 8px",fontSize:11,color:C.textMuted,cursor:"pointer"}}>+ sub</button>
            </div>
            {editSub?.catIdx===idx && (
              <div style={{display:"flex",gap:6}}>
                <input value={editSub.val} onChange={e=>setEditSub(s=>({...s,val:e.target.value}))} placeholder="Nueva subcategoría..."
                  onKeyDown={e=>{if(e.key==="Enter"&&editSub.val){addSub(idx,editSub.val);setEditSub(null);}}}
                  style={{flex:1,background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"5px 8px",color:C.text,fontSize:12}}/>
                <button onClick={()=>{if(editSub.val)addSub(idx,editSub.val);setEditSub(null);}}
                  style={{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"5px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ label: initial?.label||"", icon: initial?.icon||"📦" });
  return (
    <div style={{display:"grid",gap:8,paddingTop:10}}>
      <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Nombre de la categoría"
        style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {CAT_ICONS.map(ic=>(
          <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))}
            style={{width:32,height:32,borderRadius:7,border:"1px solid "+(form.icon===ic?C.accent:C.border),background:form.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:16}}>
            {ic}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>form.label&&onSave(form)} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"8px",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          {initial?"Guardar":"Crear"}
        </button>
        <button onClick={onCancel} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.textSub,cursor:"pointer",fontSize:12}}>Cancelar</button>
      </div>
    </div>
  );
}

}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────
function AddModal({onClose,onAdd,accounts,opts,categories=DEFAULT_CATEGORIES}){
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
          <MF label="Cuenta">
            <select value={form.account} onChange={e=>set("account",e.target.value)} style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </MF>
          <MF label="Descripción (opcional)"><input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Ej: Pago mensual Netflix" style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14}}/></MF>
        </div>
        <button onClick={submit} disabled={!form.amount||!form.category||!form.account} style={{width:"100%",marginTop:20,padding:14,borderRadius:14,border:"none",background:(!form.amount||!form.category||!form.account)?C.border:C.accent,color:(!form.amount||!form.category||!form.account)?C.textMuted:"#000",fontWeight:800,fontSize:16,cursor:(!form.amount||!form.category||!form.account)?"not-allowed":"pointer"}}>Registrar Movimiento</button>
      </div>
    </div>
  );
}

// ─── LOAN MODAL ───────────────────────────────────────────────────────────────
function LoanModal({onClose,onAdd,accounts,cards=[]}){
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

// ─── PAY MODAL ────────────────────────────────────────────────────────────────
function PayModal({onClose,loan,onPay,accounts}){
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

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
