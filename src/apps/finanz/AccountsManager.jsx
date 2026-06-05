// finanz/AccountsManager.jsx
import { useState } from "react";
import { ACCOUNT_ICONS, ACCOUNTS_DEF, C, fmtCOP } from "./shared.js";

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
