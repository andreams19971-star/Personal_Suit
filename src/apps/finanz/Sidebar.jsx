// finanz/Sidebar.jsx
import { useState, useEffect } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, fmtCOP } from "./shared.js";
import { supabase } from "../../supabase.js";
import { AccountsManager } from "./AccountsManager.jsx";
import { CategoriesManager } from "./CategoriesManager.jsx";

function BudgetManager({ categories, settings, setSettings, saveBudgets, showToast }) {
  const [localBudgets, setLocalBudgets] = useState(() => ({ ...(settings.budgets || {}) }));
  const [saving, setSaving] = useState(false);

  const handleChange = (catId, val) => {
    setLocalBudgets(b => ({ ...b, [catId]: parseFloat(val) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveBudgets(localBudgets);
    setSaving(false);
    showToast("Presupuestos guardados ✓");
  };

  const totalBudget = Object.values(localBudgets).reduce((s, v) => s + (v || 0), 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>PRESUPUESTO MENSUAL</div>
      <div style={{ background: C.accentDim, border: "1px solid " + C.accentText + "33", borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 600 }}>Total presupuestado</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.accentText }}>{fmtCOP(totalBudget)}</div>
      </div>
      {categories.expense.map(cat => (
        <div key={cat.id} style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{cat.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>$</span>
              <input
                type="number"
                placeholder="Sin límite"
                value={localBudgets[cat.id] || ""}
                onChange={e => handleChange(cat.id, e.target.value)}
                style={{ flex: 1, background: C.bg, border: "1px solid " + C.border, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13 }}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ background: saving ? C.border : C.accent, color: saving ? C.textMuted : "#000", border: "none", borderRadius: 12, padding: 13, fontWeight: 800, fontSize: 14, cursor: saving ? "default" : "pointer" }}
      >
        {saving ? "Guardando..." : "Guardar presupuestos"}
      </button>
    </div>
  );
}

function TelegramSettings({ showToast }) {
  const [chatId, setChatId] = useState("");
  const [linked, setLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function() {
    supabase.from("app_settings").select("value").eq("key", "telegram_config").maybeSingle().then(function(res) {
      if (res.data && res.data.value && res.data.value.chat_id) {
        setChatId(String(res.data.value.chat_id));
        setLinked(true);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    const id = chatId.trim();
    if (!id) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { chat_id: id, user_id: user ? user.id : "" };
    const { error } = await supabase.from("app_settings").upsert({ key: "telegram_config", value: payload });
    setSaving(false);
    if (error) { showToast("Error al guardar"); return; }
    setLinked(true);
    showToast("Telegram vinculado correctamente!");
  }

  async function handleUnlink() {
    await supabase.from("app_settings").delete().eq("key", "telegram_config");
    setChatId("");
    setLinked(false);
    showToast("Telegram desvinculado");
  }

  if (loading) return (
    <div style={{ padding: 20, color: C.textMuted, textAlign: "center", fontSize: 13 }}>Cargando...</div>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>BOT DE TELEGRAM</div>

      {/* Estado */}
      <div style={{ background: linked ? C.accentDim : C.card, border: "1px solid " + (linked ? C.accent + "44" : C.border), borderRadius: 14, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: linked ? 6 : 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: linked ? C.accent : C.textMuted, flexShrink: 0 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: linked ? C.accent : C.text }}>
            {linked ? "Bot vinculado" : "Sin vincular"}
          </div>
        </div>
        {linked && (
          <div style={{ fontSize: 12, color: C.textMuted }}>{"Chat ID: " + chatId}</div>
        )}
      </div>

      {/* Instrucciones */}
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{"Telegram"}</div>
        <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.7 }}>
          {"1. Abre "}
          <span style={{ color: C.accent, fontWeight: 700 }}>@tu_bot</span>
          {" en Telegram"}<br />
          {"2. Envía el comando "}<span style={{ fontWeight: 700 }}>/start</span><br />
          {"3. El bot te mostrara tu Chat ID"}<br />
          {"4. Pegalo abajo y toca Vincular"}
        </div>
      </div>

      {/* Input */}
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>TU CHAT ID</div>
        <input
          type="number"
          placeholder="Ej: 123456789"
          value={chatId}
          onChange={function(e) { setChatId(e.target.value); setLinked(false); }}
          style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 15, fontWeight: 600 }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !chatId.trim()}
          style={{ background: saving || !chatId.trim() ? C.border : C.accent, color: saving || !chatId.trim() ? C.textMuted : "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 13, cursor: saving || !chatId.trim() ? "default" : "pointer" }}
        >
          {saving ? "Guardando..." : "Vincular cuenta"}
        </button>
        {linked && (
          <button onClick={handleUnlink} style={{ background: "transparent", border: "1px solid " + C.red + "55", borderRadius: 10, padding: 10, color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Desvincular
          </button>
        )}
      </div>

      {/* Guía de uso */}
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, marginBottom: 10 }}>COMO USARLO</div>
        {[
          ["Gasto:", "cafe 5000"],
          ["Ingreso:", "+salario 3500000"],
          ["Con cuenta:", "gasolina 80000 efectivo"],
          ["Con categoria:", "almuerzo 15000 nequi comida"],
        ].map(function(row) { return (
          <div key={row[0]} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{row[0]}</div>
            <div style={{ fontSize: 13, color: C.accentText, fontWeight: 600, fontFamily: "monospace", background: C.bg, borderRadius: 6, padding: "3px 8px", display: "inline-block", marginTop: 2 }}>{row[1]}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

export function Sidebar({open,onClose,initialTab="accounts",accounts,updateAccountBalance,settings,setSettings,saveBudgets,showToast,categories=DEFAULT_CATEGORIES,saveCategories}){
  const [tab,setTab]=useState(initialTab);
  useEffect(()=>{ if(open) setTab(initialTab); },[open,initialTab]);
  const [notifPerm, setNotifPerm]=useState(typeof Notification!=="undefined" && Notification.permission ? Notification.permission : "unsupported");

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
          {[["accounts","Cuentas"],["budgets","Presupuesto"],["cats","Categorías"],["notif","Notif"],["telegram","Telegram"],["prefs","Prefs"]].map(([id,l])=>(
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
            <BudgetManager categories={categories} settings={settings} setSettings={setSettings} saveBudgets={saveBudgets} showToast={showToast}/>
          )}
          {tab==="telegram"&&(
            <TelegramSettings showToast={showToast}/>
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
