// finanz/Sidebar.jsx
import { useState } from "react";
import { C, fmtCOP, ACCOUNTS_DEF, DEFAULT_CATEGORIES } from "./shared.js";
import { AccountsManager } from "./AccountsManager.jsx";
import { CategoriesManager } from "./CategoriesManager.jsx";

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
