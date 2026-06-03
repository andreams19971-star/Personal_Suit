// finanz/Sidebar.jsx
import { useState, useEffect, useRef } from "react";
import { C, fmtCOP, fmtShort, today, td, MONTHS, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";

export function AccountsManager({accounts, updateAccountBalance, showToast}) {
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

export function CategoriesManager({ categories, saveCategories, showToast }) {
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

export function CatForm({ initial, onSave, onCancel }) {
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

export function Sidebar({open,onClose,accounts,updateAccountBalance,settings,setSettings,showToast,categories=DEFAULT_CATEGORIES,saveCategories}){
  const [tab,setTab]=useState("accounts");
  const [notifPerm, setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"default");

  const handleRequestNotif = async () => {
    const result = await requestPermission();
    setNotifPerm(result);
    if (result==="granted") showToast("Notificaciones activadas ✓");
  };

  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"#00000088",zIndex:200}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:Math.min(340,window.innerWidth-40),background:C.surface,borderLeft:"1px solid "+(C.border),transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",zIndex:300,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid "+(C.border),display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:18,fontWeight:800}}>⚙ Configuración</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid "+(C.border),flexShrink:0,overflowX:"auto"}}>
          {[["accounts","Cuentas"],["cats","Categorías"],["notif","Notif"],["prefs","Prefs"]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:"0 0 auto",padding:"10px 10px",border:"none",background:"transparent",borderBottom:tab===id?"2px solid "+(C.accent):"2px solid transparent",color:tab===id?C.accent:C.textSub,fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="accounts"&&(
            <AccountsManager accounts={accounts} updateAccountBalance={updateAccountBalance} showToast={showToast}/>
          )}
          {tab==="cats"&&saveCategories&&(
            <CategoriesManager categories={categories} saveCategories={saveCategories} showToast={showToast}/>
          )}
          {tab==="notif"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>NOTIFICACIONES</div>
              <div style={{background:C.card,border:"1px solid "+(notifPerm==="granted"?C.accentText+"44":C.border),borderRadius:14,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:notifPerm==="granted"?C.accentText:notifPerm==="denied"?C.red:C.yellow,flexShrink:0}}/>
                  <div style={{fontSize:13,fontWeight:700}}>
                    {notifPerm==="granted"?"Notificaciones activas":notifPerm==="denied"?"Notificaciones bloqueadas":"Sin configurar"}
                  </div>
                </div>
                {notifPerm!=="granted"&&(
                  <button onClick={handleRequestNotif}
                    style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Activar Notificaciones
                  </button>
                )}
                {notifPerm==="granted"&&(
                  <button onClick={()=>{if(typeof showLocalNotification==="function")showLocalNotification("Mi Suite Personal","¡Las notificaciones funcionan! 🎉");else showToast("Notificaciones OK ✓");}}
                    style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                    Probar notificación
                  </button>
                )}
              </div>
              {/* Instrucciones iOS */}
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📱 Para iOS (iPhone/iPad)</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>
                  1. Abre la app en <b>Safari</b><br/>
                  2. Toca el botón compartir <b>⎙</b><br/>
                  3. Selecciona <b>"Agregar a pantalla de inicio"</b><br/>
                  4. Abre la app desde el ícono instalado<br/>
                  5. Vuelve aquí y activa notificaciones<br/>
                  <span style={{color:C.textMuted,fontSize:11}}>Requiere iOS 16.4 o superior</span>
                </div>
              </div>
              {/* Instrucciones Android */}
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🤖 Para Android</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>
                  1. Abre en <b>Chrome</b><br/>
                  2. Toca los 3 puntos <b>⋮</b><br/>
                  3. Selecciona <b>"Instalar app"</b> o <b>"Agregar a inicio"</b><br/>
                  4. Abre desde el ícono y activa notificaciones
                </div>
              </div>
            </div>
          )}
          {tab==="budgets"&&(
            <div style={{display:"grid",gap:12}}>
              <div style={{fontSize:12,color:C.textMuted,fontWeight:700}}>PRESUPUESTO MENSUAL</div>
              {categories.expense.map(cat=>(
                <div key={cat.id} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{cat.label}</div>
                    <input type="number" placeholder="0" defaultValue={settings.budgets?.[cat.id]||""} onChange={e=>setSettings(s=>({...s,budgets:{...s.budgets,[cat.id]:parseFloat(e.target.value)||0}}))} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"6px 10px",color:C.text,fontSize:13}}/>
                  </div>
                </div>
              ))}
              <button onClick={()=>showToast("Presupuestos guardados ✓")} style={{background:C.accent,color:"#000",border:"none",borderRadius:12,padding:12,fontWeight:800,fontSize:14,cursor:"pointer"}}>Guardar</button>
            </div>
          )}
          {tab==="prefs"&&(
            <div style={{display:"grid",gap:14}}>
              <div style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Moneda</div>
                <select value={settings.currency} onChange={e=>setSettings(s=>({...s,currency:e.target.value}))} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}>
                  <option value="COP">🇨🇴 COP - Peso colombiano</option>
                  <option value="USD">🇺🇸 USD - Dólar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="MXN">🇲🇽 MXN - Peso mexicano</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
