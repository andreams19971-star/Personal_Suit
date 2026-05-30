import { useState, useEffect, lazy, Suspense } from "react";
import { supabase, isConfigured } from "./supabase.js";
import { useAuthProvider, AuthContext } from "./hooks/useAuth.js";
import AuthScreen    from "./AuthScreen.jsx";
import AdminPanel    from "./AdminPanel.jsx";
import LockScreen    from "./LockScreen.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

const FinanzApp      = lazy(() => import("./apps/FinanzApp.jsx"));
const Planner        = lazy(() => import("./apps/Planner.jsx"));
const FlotaTracker   = lazy(() => import("./apps/FlotaTracker.jsx"));
const ApartamentoApp = lazy(() => import("./apps/ApartamentoApp.jsx"));

const ALL_APPS = [
  { id:"finanz",      label:"Finanzas",      sub:"Ingresos, gastos y préstamos",  icon:"$",  accent:"#22C55E", bg:"#052010" },
  { id:"planner",     label:"Planner",       sub:"Tareas, metas y notas",         icon:"▢",  accent:"#3B82F6", bg:"#071228" },
  { id:"flota",       label:"FlotaTracker",  sub:"Cobros y gastos de tus carros", icon:"◎",  accent:"#A855F7", bg:"#180A28" },
  { id:"apartamento", label:"Apartamento",   sub:"Reservas y disponibilidad",     icon:"⌂",  accent:"#F97316", bg:"#1C0A02" },
];

const THEMES = {
  dark:   { bg:"#09090B", surface:"#111113", card:"#18181B", border:"#27272A", text:"#FAFAFA", textSub:"#A1A1AA", textMuted:"#52525B", accent:"#22C55E", accentDim:"#052010" },
  light:  { bg:"#FAFAFA", surface:"#FFFFFF", card:"#F4F4F5", border:"#E4E4E7", text:"#09090B", textSub:"#52525B", textMuted:"#A1A1AA", accent:"#16A34A", accentDim:"#DCFCE7" },
  black:  { bg:"#000000", surface:"#0A0A0A", card:"#141414", border:"#222222", text:"#FAFAFA", textSub:"#A1A1AA", textMuted:"#444444", accent:"#22C55E", accentDim:"#052010" },
};

const FONT_SIZES = [
  { id:"small",  label:"S",  scale:0.9 },
  { id:"medium", label:"M",  scale:1.0 },
  { id:"large",  label:"L",  scale:1.12 },
  { id:"xl",     label:"XL", scale:1.24 },
];

function loadPrefs() { try { return JSON.parse(localStorage.getItem("suite_prefs")||"{}"); } catch { return {}; } }
function savePrefs(p) { try { localStorage.setItem("suite_prefs", JSON.stringify(p)); } catch {} }
function getSystemTheme() { return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"; }
function getScheduledTheme(prefs) {
  if (prefs.theme !== "schedule") return null;
  const h = new Date().getHours();
  const start = parseInt(prefs.darkFrom || "21");
  const end   = parseInt(prefs.darkUntil || "7");
  // Soporta rango que cruza medianoche (ej: 21-7)
  if (start > end) return (h >= start || h < end) ? "dark" : "light";
  return (h >= start && h < end) ? "dark" : "light";
}

function AppContent() {
  const auth = useAuthProvider();

  const [activeApp,  setActiveApp]  = useState(null);
  const [settings,   setSettings]   = useState(false);
  const [showAdmin,  setShowAdmin]   = useState(false);
  const [prefs,      setPrefs]      = useState(loadPrefs);
  const [db,         setDb]         = useState("checking");
  const [locked,     setLocked]     = useState(()=>loadPrefs().biometric===true);

  const setPref = (k,v) => { const n={...prefs,[k]:v}; setPrefs(n); savePrefs(n); };

  const themeKey = prefs.theme==="system"   ? getSystemTheme()
                 : prefs.theme==="schedule" ? (getScheduledTheme(prefs)||"dark")
                 : (prefs.theme||"dark");
  const C          = THEMES[themeKey]||THEMES.dark;
  const fontScale  = FONT_SIZES.find(f=>f.id===(prefs.fontSize||"medium"))?.scale||1;

  useEffect(()=>{ document.documentElement.style.fontSize=(fontScale*16)+"px"; },[fontScale]);

  useEffect(()=>{
    if (prefs.theme!=="system") return;
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const h=()=>setPrefs(p=>({...p}));
    mq.addEventListener("change",h);
    return()=>mq.removeEventListener("change",h);
  },[prefs.theme]);

  useEffect(() => {
    let retryTimer = null;

    async function checkDb() {
      if (!isConfigured) { setDb("error"); return; }
      setDb("checking");
      try {
        // Usar el endpoint de salud de Supabase en lugar de una tabla (no requiere permisos)
        const url = import.meta.env.VITE_SUPABASE_URL + "/rest/v1/";
        const res = await Promise.race([
          fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_KEY },
            method: "HEAD"
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))
        ]);
        setDb(res.ok ? "ok" : "error");
      } catch {
        setDb("error");
        // Reintentar en 5 segundos si falla
        retryTimer = setTimeout(checkDb, 5000);
      }
    }

    checkDb();
    // Reintentar al volver a foreground
    const onVisible = () => { if (document.visibilityState === "visible") checkDb(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // ── Auth loading ──
  if (auth.loading) {
    return (
      <div style={{position:"absolute",inset:0,background:"#09090B",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
        <div style={{fontSize:32}}>💰</div>
        <div style={{fontSize:13,color:"#52525B"}}>Cargando...</div>
      </div>
    );
  }

  // ── Auth gate ──
  if (!auth.user) {
    return (
      <AuthContext.Provider value={auth}>
        <AuthScreen onAuth={async(mode,email,password,name)=>{
          if (mode==="login") await auth.signIn(email,password);
          else await auth.signUp(email,password,name);
        }}/>
      </AuthContext.Provider>
    );
  }

  // ── Biometric lock ──
  if (locked) {
    return <LockScreen onUnlock={()=>setLocked(false)} userName={auth.profile?.name||prefs.name||"Andrés"}/>;
  }

  const visibleApps = ALL_APPS.filter(a=>
    auth.isAdmin || (auth.allowedApps||[]).includes(a.id)
  );

  // Si el usuario está logueado pero el perfil no cargó → mostrar estado de reintento
  // Solo si NO hay perfil en caché (si hay caché, auth ya lo cargó al iniciar)
  const profileMissing = auth.user && !auth.profile;

  const AppLoader = () => (
    <div style={{position:"absolute",inset:0,background:"#09090B",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:"2px solid #27272A",borderTop:"2px solid #22C55E",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:12,color:"#52525B"}}>Cargando...</div>
    </div>
  );

  const wrap = (App, back) => (
    <AuthContext.Provider value={auth}>
      <ErrorBoundary>
        <Suspense fallback={<AppLoader/>}>
          <App onBack={back}/>
        </Suspense>
      </ErrorBoundary>
    </AuthContext.Provider>
  );

  if (activeApp==="finanz")      return wrap(FinanzApp,      ()=>setActiveApp(null));
  if (activeApp==="planner")     return wrap(Planner,        ()=>setActiveApp(null));
  if (activeApp==="flota")       return wrap(FlotaTracker,   ()=>setActiveApp(null));
  if (activeApp==="apartamento") return wrap(ApartamentoApp, ()=>setActiveApp(null));
  if (showAdmin)                 return <AuthContext.Provider value={auth}><AdminPanel currentUser={auth.user} onClose={()=>setShowAdmin(false)}/></AuthContext.Provider>;

  const userName  = auth.profile?.name || prefs.name || "Usuario";
  const hour      = new Date().getHours();
  const greet     = hour<12?"Buenos días":hour<18?"Buenas tardes":"Buenas noches";
  const dbColor   = db==="ok"?C.accent:db==="error"?"#EF4444":C.textMuted;
  const avatarColor = auth.profile?.avatar_color||C.accent;
  const isLight   = themeKey==="light";

  return (
    <AuthContext.Provider value={auth}>
    <div style={{
      position:"absolute",inset:0,background:C.bg,color:C.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      display:"flex",flexDirection:"column",overflowY:"auto",overflowX:"hidden",
      fontSize:fontScale+"rem",
    }}>
      {/* HEADER */}
      <div className="launcher-header" style={{animation:"launcher-fadeUp .4s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"0.75rem",color:C.textMuted,fontWeight:500,marginBottom:6}}>{greet}</div>
            <div style={{fontSize:"1.9rem",fontWeight:700,letterSpacing:-1,lineHeight:1.1}}>
              {userName}<span style={{color:C.accent}}>.</span>
            </div>
            {auth.isAdmin&&(
              <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:6,
                background:C.accentDim,border:"1px solid "+C.accent+"44",
                borderRadius:100,padding:"2px 8px"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.accent}}/>
                <span style={{fontSize:"0.68rem",color:C.accent,fontWeight:700}}>Admin</span>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:auth.isAdmin?4:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:dbColor,flexShrink:0,
                animation:db==="checking"?"pulse 1.2s ease infinite":"none"}}/>
              <span style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:500}}>
                {db==="ok"?"Conectado":db==="checking"?"Reconectando...":"Sin conexión"}
              </span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            {auth.isAdmin&&(
              <button onClick={()=>setShowAdmin(true)} style={{
                width:40,height:40,borderRadius:12,
                background:C.accentDim,border:"1px solid "+C.accent+"44",
                cursor:"pointer",color:C.accent,fontSize:18,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>👥</button>
            )}
            <button onClick={()=>setSettings(true)} style={{
              width:40,height:40,borderRadius:12,
              background:C.card,border:"1px solid "+C.border,
              cursor:"pointer",color:C.textSub,fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>⚙</button>
          </div>
        </div>
      </div>

      <div style={{height:1,background:C.border,marginBottom:8}}/>

      {/* APPS */}
      <div style={{padding:"8px 0 40px"}}>
        {profileMissing ? (
          <div style={{padding:"40px 24px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12,animation:"pulse 1.5s ease infinite"}}>⏳</div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>Cargando perfil...</div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:24,lineHeight:1.5}}>
              Conectando con Supabase.<br/>Si demora más de 10 segundos, toca Reintentar.
            </div>
            <button onClick={()=>auth.loadProfile(auth.user.id)} style={{
              padding:"10px 20px",borderRadius:10,border:"none",
              background:C.accent,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",
              marginBottom:10,display:"block",margin:"0 auto 10px",
            }}>Reintentar</button>
            <button onClick={()=>auth.signOut()} style={{
              display:"block",margin:"0 auto",padding:"8px 16px",
              borderRadius:10,border:"1px solid "+C.border,
              background:"transparent",color:C.textMuted,fontSize:12,cursor:"pointer",
            }}>Cerrar sesión</button>
          </div>
        ) : visibleApps.length === 0 ? (
          <div style={{padding:"40px 24px",textAlign:"center",color:C.textMuted}}>
            <div style={{fontSize:32,marginBottom:12}}>🔒</div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>Sin acceso</div>
            <div style={{fontSize:13}}>No tienes apps asignadas. Contacta al administrador.</div>
            <button onClick={()=>auth.signOut()} style={{
              marginTop:20,padding:"8px 16px",borderRadius:10,
              border:"1px solid "+C.border,background:"transparent",
              color:C.textMuted,fontSize:12,cursor:"pointer",
            }}>Cerrar sesión</button>
          </div>
        ) : (
          visibleApps.map((a,i)=>(
            <button key={a.id} className="launcher-card" onClick={()=>setActiveApp(a.id)}
              style={{animation:"launcher-fadeUp .4s ease "+(i*.08+.1)+"s both"}}>
              <div style={{padding:"16px 24px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  background:a.bg,border:"1px solid "+a.accent+"40",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"1.2rem",color:a.accent,fontWeight:800}}>{a.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"1rem",fontWeight:600,color:C.text}}>{a.label}</div>
                  <div style={{fontSize:"0.75rem",color:C.textMuted,marginTop:2}}>{a.sub}</div>
                </div>
                <div style={{color:C.textMuted,fontSize:"1.1rem",flexShrink:0}}>›</div>
              </div>
              {i<visibleApps.length-1&&<div style={{height:1,background:C.border,marginLeft:82}}/>}
            </button>
          ))
        )}
      </div>

      <div className="launcher-footer" style={{textAlign:"center",fontSize:"0.7rem",color:C.textMuted}}>
        Mi Suite Personal · v2.0
      </div>

      {/* SETTINGS */}
      {settings&&(
        <div style={{position:"fixed",inset:0,background:"#000000AA",zIndex:200,display:"flex",alignItems:"flex-end"}}
          onClick={()=>setSettings(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",
            padding:"16px 24px max(32px,calc(env(safe-area-inset-bottom)+20px))",
            borderTop:"1px solid "+C.border,animation:"settings-in .3s ease",
            maxHeight:"85vh",overflowY:"auto",color:C.text,
          }}>
            <div style={{width:36,height:3,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:"1rem",fontWeight:700,marginBottom:20}}>Configuración</div>

            {/* Perfil de usuario */}
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"12px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:avatarColor+"22",border:"1px solid "+avatarColor+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:avatarColor,flexShrink:0}}>
                {userName[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.87rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userName}</div>
                <div style={{fontSize:"0.72rem",color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{auth.user?.email}</div>
              </div>
              <button onClick={()=>{auth.signOut();setSettings(false);}} style={{background:"transparent",border:"1px solid "+C.border,borderRadius:8,padding:"6px 10px",color:C.textMuted,cursor:"pointer",fontSize:"0.75rem",flexShrink:0}}>
                Salir
              </button>
            </div>

            {/* Nombre */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:6}}>NOMBRE VISIBLE</div>
              <input value={prefs.name||auth.profile?.name||""} onChange={e=>{ setPref("name",e.target.value); auth.updateProfile({name:e.target.value}); }}
                placeholder="Tu nombre"
                style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:"0.94rem",boxSizing:"border-box"}}/>
            </div>

            {/* Tema */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:8}}>TEMA</div>
              <div style={{display:"flex",gap:8}}>
                {[{id:"dark",l:"Oscuro",p:"#09090B"},{id:"light",l:"Claro",p:"#FAFAFA"},{id:"black",l:"Negro",p:"#000000"},{id:"system",l:"Sistema",p:"linear-gradient(135deg,#09090B 50%,#FAFAFA 50%)"},{id:"schedule",l:"Horario",p:"linear-gradient(135deg,#09090B 50%,#EAB308 50%)"}].map(t=>{
                  const active=(prefs.theme||"dark")===t.id;
                  return(<button key={t.id} onClick={()=>setPref("theme",t.id)} style={{flex:1,padding:"10px 4px",borderRadius:10,cursor:"pointer",border:"1px solid "+(active?C.accent:C.border),background:active?C.accentDim:C.card,color:active?C.accent:C.textSub,fontSize:"0.7rem",fontWeight:600}}>
                    <div style={{width:22,height:22,borderRadius:6,background:t.p,border:"1px solid "+C.border,margin:"0 auto 6px"}}/>
                    {t.l}
                  </button>);
                })}
              </div>
            </div>

            {/* Horario oscuro/claro */}
            {prefs.theme==="schedule"&&(
              <div style={{marginBottom:16,background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,marginBottom:10}}>HORARIO OSCURO</div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.7rem",color:C.textMuted,marginBottom:4}}>Desde</div>
                    <input type="number" min="0" max="23" value={prefs.darkFrom||"21"}
                      onChange={e=>setPref("darkFrom",e.target.value)}
                      style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:8,padding:"8px",color:C.text,fontSize:14,textAlign:"center"}}/>
                  </div>
                  <div style={{color:C.textMuted,paddingTop:16}}>—</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.7rem",color:C.textMuted,marginBottom:4}}>Hasta</div>
                    <input type="number" min="0" max="23" value={prefs.darkUntil||"7"}
                      onChange={e=>setPref("darkUntil",e.target.value)}
                      style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:8,padding:"8px",color:C.text,fontSize:14,textAlign:"center"}}/>
                  </div>
                </div>
                <div style={{fontSize:"0.7rem",color:C.textMuted,marginTop:8}}>
                  Modo oscuro de las {prefs.darkFrom||"21"}:00 a las {prefs.darkUntil||"7"}:00
                </div>
              </div>
            )}

            {/* Tamaño de letra */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:8}}>TAMAÑO DE LETRA</div>
              <div style={{display:"flex",gap:8}}>
                {FONT_SIZES.map(f=>{
                  const active=(prefs.fontSize||"medium")===f.id;
                  return(<button key={f.id} onClick={()=>setPref("fontSize",f.id)} style={{flex:1,padding:"10px 4px",borderRadius:10,cursor:"pointer",border:"1px solid "+(active?C.accent:C.border),background:active?C.accentDim:C.card,color:active?C.accent:C.textSub,fontSize:(f.scale*0.9)+"rem",fontWeight:700}}>
                    {f.label}
                  </button>);
                })}
              </div>
            </div>

            {/* Biométrica */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,letterSpacing:0.5,marginBottom:8}}>SEGURIDAD</div>
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"14px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.87rem",fontWeight:600,marginBottom:2}}>Face ID / Touch ID</div>
                  <div style={{fontSize:"0.72rem",color:C.textMuted}}>{prefs.biometric?"Activo":"Desactivado"}</div>
                </div>
                <button onClick={()=>setPref("biometric",!prefs.biometric)} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",background:prefs.biometric?C.accent:C.border,position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:prefs.biometric?23:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px #0005"}}/>
                </button>
              </div>
            </div>

            {/* DB */}
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:"0.7rem",color:C.textMuted,fontWeight:600,marginBottom:6,letterSpacing:0.5}}>CONEXIÓN</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:dbColor,
                  animation:db==="checking"?"pulse 1.2s ease infinite":"none"}}/>
                <span style={{fontSize:"0.81rem",color:dbColor,fontWeight:600}}>
                  {db==="ok"?"Supabase conectado ✓":db==="checking"?"Reconectando...":"Sin conexión"}
                </span>
              </div>
            </div>

            <button onClick={()=>setSettings(false)} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:C.accent,color:isLight?"#fff":"#000",fontWeight:700,fontSize:"0.94rem",cursor:"pointer"}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
    </AuthContext.Provider>
  );
}

export default function App() {
  return <AppContent/>;
}
