import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = {
  bg:"#F5F4F0", surface:"#FFFFFF", card:"#FFFFFF",
  border:"#E8E6DF", text:"#1A1916", textSub:"#6B6860", textMuted:"#A8A49C",
  accent:"#5C8A6B", accentDim:"#EBF2EE", accentText:"#3D6B50",
  red:"#C0392B", redDim:"#FDECEA",
};

const inp = {
  width:"100%", background:C.surface, border:"1px solid "+C.border,
  borderRadius:10, padding:"12px 14px", color:C.text, fontSize:16,
  boxSizing:"border-box", outline:"none",
};

// ── Detecta si Supabase envió un token de recovery en la URL ──
function detectRecoveryToken() {
  const hash = window.location.hash;
  return hash.includes("type=recovery") && hash.includes("access_token");
}

export default function AuthScreen({ onAuth }) {
  // mode: "login" | "register" | "forgot" | "reset"
  const [mode,       setMode]       = useState(() => detectRecoveryToken() ? "reset" : "login");
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState(() => localStorage.getItem("suite_email") || "");
  const [password,   setPassword]   = useState("");
  const [password2,  setPassword2]  = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  // Cuando Supabase redirige con #type=recovery, establece la sesión automáticamente
  useEffect(() => {
    if (detectRecoveryToken()) {
      setMode("reset");
    }
  }, []);

  function clearMessages() { setError(""); setSuccess(""); }

  // ── Login / Register ──
  async function handleSubmit() {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    if (mode === "register" && !name) { setError("Ingresa tu nombre"); return; }
    setLoading(true); clearMessages();
    try {
      if (rememberMe) localStorage.setItem("suite_email", email);
      else localStorage.removeItem("suite_email");
      await onAuth(mode, email, password, name);
    } catch(e) {
      setError(e.message || "Error de autenticación");
    } finally { setLoading(false); }
  }

  // ── Olvidé contraseña: envía email ──
  async function handleForgot() {
    if (!email) { setError("Ingresa tu correo electrónico"); return; }
    setLoading(true); clearMessages();
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;
      setSuccess("✅ Revisa tu correo — te enviamos un enlace para restablecer tu contraseña.");
    } catch(e) {
      setError(e.message || "No se pudo enviar el correo");
    } finally { setLoading(false); }
  }

  // ── Nueva contraseña ──
  async function handleReset() {
    if (!password || !password2) { setError("Completa ambos campos"); return; }
    if (password.length < 6)     { setError("Mínimo 6 caracteres"); return; }
    if (password !== password2)  { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); clearMessages();
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess("✅ Contraseña actualizada. Ya puedes iniciar sesión.");
      // Limpia el hash de la URL y va a login
      window.history.replaceState(null, "", window.location.pathname);
      setTimeout(() => { setMode("login"); setPassword(""); setPassword2(""); }, 2000);
    } catch(e) {
      setError(e.message || "No se pudo cambiar la contraseña");
    } finally { setLoading(false); }
  }

  const titles = {
    login:    { icon:"💰", title:"Mi Suite Personal", sub:"Inicia sesión para continuar" },
    register: { icon:"💰", title:"Mi Suite Personal", sub:"Crea tu cuenta" },
    forgot:   { icon:"🔑", title:"Recuperar contraseña", sub:"Te enviaremos un enlace a tu correo" },
    reset:    { icon:"🔐", title:"Nueva contraseña",   sub:"Elige una contraseña segura" },
  };
  const t = titles[mode];

  return (
    <div style={{
      position:"absolute", inset:0, background:C.bg, color:C.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"32px 24px",
      paddingTop:"max(60px,calc(env(safe-area-inset-top)+40px))",
    }}>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:48,marginBottom:12}}>{t.icon}</div>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>{t.title}</div>
        <div style={{fontSize:13,color:C.textMuted,marginTop:6}}>{t.sub}</div>
      </div>

      <div style={{width:"100%",maxWidth:340,display:"grid",gap:12}}>

        {/* ── LOGIN ── */}
        {mode==="login"&&(<>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>EMAIL</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" style={inp}
              autoCapitalize="none" autoCorrect="off"/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>CONTRASEÑA</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Tu contraseña" style={inp}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          </div>
          {error&&<Msg text={error} color={C.red} bg={C.redDim}/>}
          <Btn label="Ingresar" loading={loading} loadingLabel="Ingresando..." onClick={handleSubmit}/>
          <button onClick={()=>setRememberMe(r=>!r)} style={{
            display:"flex",alignItems:"center",gap:8,padding:"8px 0",
            background:"transparent",border:"none",cursor:"pointer",width:"100%",
          }}>
            <div style={{
              width:20,height:20,borderRadius:5,border:"1px solid "+(rememberMe?C.accent:C.border),
              background:rememberMe?C.accent:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0,transition:"all .15s",
            }}>
              {rememberMe&&<span style={{color:"#000",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:13,color:C.textSub}}>Mantener sesión activa</span>
          </button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <LinkBtn label="¿No tienes cuenta? Regístrate" onClick={()=>{setMode("register");clearMessages();}}/>
            <LinkBtn label="Olvidé mi contraseña" onClick={()=>{setMode("forgot");clearMessages();}}/>
          </div>
        </>)}

        {/* ── REGISTER ── */}
        {mode==="register"&&(<>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>NOMBRE</div>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="Tu nombre" style={inp} autoCapitalize="words"/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>EMAIL</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" style={inp}
              autoCapitalize="none" autoCorrect="off"/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>CONTRASEÑA</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inp}/>
          </div>
          {error&&<Msg text={error} color={C.red} bg={C.redDim}/>}
          <Btn label="Crear cuenta" loading={loading} loadingLabel="Creando cuenta..." onClick={handleSubmit}/>
          <LinkBtn label="¿Ya tienes cuenta? Inicia sesión" onClick={()=>{setMode("login");clearMessages();}}/>
        </>)}

        {/* ── FORGOT PASSWORD ── */}
        {mode==="forgot"&&(<>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>EMAIL</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" style={inp}
              autoCapitalize="none" autoCorrect="off"/>
          </div>
          {error&&<Msg text={error} color={C.red} bg={C.redDim}/>}
          {success&&<Msg text={success} color={C.accentText} bg={C.accentDim}/>}
          {!success&&<Btn label="Enviar enlace" loading={loading} loadingLabel="Enviando..." onClick={handleForgot}/>}
          <LinkBtn label="← Volver al login" onClick={()=>{setMode("login");clearMessages();}}/>
        </>)}

        {/* ── RESET PASSWORD ── */}
        {mode==="reset"&&(<>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>NUEVA CONTRASEÑA</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inp}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>CONFIRMAR CONTRASEÑA</div>
            <input type="password" value={password2} onChange={e=>setPassword2(e.target.value)}
              placeholder="Repite la contraseña" style={inp}
              onKeyDown={e=>e.key==="Enter"&&handleReset()}/>
          </div>
          {error&&<Msg text={error} color={C.red} bg={C.redDim}/>}
          {success&&<Msg text={success} color={C.accentText} bg={C.accentDim}/>}
          {!success&&<Btn label="Guardar contraseña" loading={loading} loadingLabel="Guardando..." onClick={handleReset}/>}
        </>)}

      </div>

      <div style={{position:"absolute",bottom:"max(24px,env(safe-area-inset-bottom))",
        fontSize:11,color:C.textMuted}}>
        Mi Suite Personal · v2.0
      </div>
    </div>
  );
}

function Btn({label,loading,loadingLabel,onClick}){
  return(
    <button onClick={onClick} disabled={loading} style={{
      width:"100%",padding:13,borderRadius:12,border:"none",
      background:loading?C.border:C.accent,
      color:loading?C.textMuted:"#000",
      fontWeight:700,fontSize:16,cursor:loading?"not-allowed":"pointer",
      marginTop:4,transition:"all .2s",
    }}>
      {loading?loadingLabel:label}
    </button>
  );
}

function LinkBtn({label,onClick}){
  return(
    <button onClick={onClick} style={{
      background:"transparent",border:"none",color:C.textMuted,
      cursor:"pointer",fontSize:13,padding:"4px 0",textAlign:"center",
    }}>
      {label}
    </button>
  );
}

function Msg({text,color,bg}){
  return(
    <div style={{background:bg,border:"1px solid "+color+"44",borderRadius:10,
      padding:"10px 14px",fontSize:13,color}}>
      {text}
    </div>
  );
}
