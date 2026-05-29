import { useState } from "react";

const C = {
  bg:"#09090B", surface:"#111113", card:"#18181B",
  border:"#27272A", text:"#FAFAFA", textSub:"#A1A1AA", textMuted:"#52525B",
  accent:"#22C55E", accentDim:"#052010", accentText:"#4ADE80",
  red:"#EF4444", redDim:"#1F0808",
};

const inp = {
  width:"100%", background:C.card, border:"1px solid "+C.border,
  borderRadius:10, padding:"12px 14px", color:C.text, fontSize:16,
  boxSizing:"border-box",
};

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState("login"); // login | register
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit() {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    if (mode === "register" && !name) { setError("Ingresa tu nombre"); return; }
    setLoading(true);
    setError("");
    try {
      await onAuth(mode, email, password, name);
    } catch(e) {
      setError(e.message || "Error de autenticación");
    } finally { setLoading(false); }
  }

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
        <div style={{fontSize:48,marginBottom:12}}>💰</div>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>Mi Suite Personal</div>
        <div style={{fontSize:13,color:C.textMuted,marginTop:6}}>
          {mode==="login"?"Inicia sesión para continuar":"Crea tu cuenta"}
        </div>
      </div>

      {/* Form */}
      <div style={{width:"100%",maxWidth:340,display:"grid",gap:12}}>
        {mode==="register"&&(
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>NOMBRE</div>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="Tu nombre" style={inp} autoCapitalize="words"/>
          </div>
        )}
        <div>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>EMAIL</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="correo@ejemplo.com" style={inp}
            autoCapitalize="none" autoCorrect="off"/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>CONTRASEÑA</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder={mode==="register"?"Mínimo 6 caracteres":"Tu contraseña"}
            style={inp}/>
        </div>

        {error&&(
          <div style={{background:C.redDim,border:"1px solid "+C.red+"44",borderRadius:10,
            padding:"10px 14px",fontSize:13,color:C.red}}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:"100%",padding:13,borderRadius:12,border:"none",
          background:loading?C.border:C.accent,
          color:loading?C.textMuted:"#000",
          fontWeight:700,fontSize:16,cursor:loading?"not-allowed":"pointer",
          marginTop:4,transition:"all .2s",
        }}>
          {loading?(mode==="login"?"Ingresando...":"Creando cuenta...")
            :(mode==="login"?"Ingresar":"Crear cuenta")}
        </button>

        <button onClick={()=>{setMode(m=>m==="login"?"register":"login");setError("");}} style={{
          background:"transparent",border:"none",color:C.textMuted,
          cursor:"pointer",fontSize:13,padding:"8px",textAlign:"center",
        }}>
          {mode==="login"?"¿No tienes cuenta? Regístrate":"¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>

      <div style={{position:"absolute",bottom:"max(24px,env(safe-area-inset-bottom))",
        fontSize:11,color:C.textMuted}}>
        Mi Suite Personal · v2.0
      </div>
    </div>
  );
}
