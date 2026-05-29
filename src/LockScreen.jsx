import { useState, useEffect } from "react";
import {
  isBiometricSupported,
  hasBiometricRegistered,
  registerBiometric,
  authenticateBiometric,
  removeBiometric,
} from "./hooks/useBiometric.js";

const C = {
  bg:"#09090B", card:"#18181B", border:"#27272A",
  text:"#FAFAFA", textSub:"#A1A1AA", textMuted:"#52525B",
  accent:"#22C55E", accentDim:"#052010", red:"#EF4444",
};

export default function LockScreen({ onUnlock, userName }) {
  const [state,    setState]    = useState("idle");   // idle | authenticating | registering | error | unsupported
  const [msg,      setMsg]      = useState("");
  const [hasReg,   setHasReg]   = useState(false);
  const [supported,setSupported]= useState(true);

  useEffect(() => {
    const sup = isBiometricSupported();
    setSupported(sup);
    if (!sup) { setState("unsupported"); return; }
    const reg = hasBiometricRegistered();
    setHasReg(reg);
    // Si ya está registrado, intentar auth automáticamente después de un breve delay
    if (reg) {
      setTimeout(() => tryAuth(), 400);
    } else {
      setState("idle");
    }
  }, []);

  async function tryAuth() {
    setState("authenticating");
    setMsg("");
    try {
      const ok = await authenticateBiometric();
      if (ok) {
        setState("success");
        setTimeout(() => onUnlock(), 300);
      } else {
        setState("error");
        setMsg("Autenticación fallida");
      }
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setState("error");
        setMsg("Autenticación cancelada");
      } else {
        setState("error");
        setMsg(err.message || "Error al autenticar");
      }
    }
  }

  async function tryRegister() {
    setState("registering");
    setMsg("");
    try {
      await registerBiometric(userName || "Andrés");
      setHasReg(true);
      setState("idle");
      setMsg("Biométrica registrada ✓");
      // Intentar auth inmediatamente
      setTimeout(() => tryAuth(), 500);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setState("error");
        setMsg("Registro cancelado");
      } else {
        setState("error");
        setMsg(err.message || "Error al registrar");
      }
    }
  }

  function handleReset() {
    removeBiometric();
    setHasReg(false);
    setState("idle");
    setMsg("Biométrica eliminada");
  }

  const isLoading = state === "authenticating" || state === "registering";
  const isSuccess = state === "success";

  return (
    <div style={{
      position:"absolute",inset:0,
      background:C.bg,
      color:C.text,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      padding:"40px 32px",
      paddingTop:"max(60px,calc(env(safe-area-inset-top)+40px))",
    }}>

      {/* Icon */}
      <div style={{
        width:80,height:80,borderRadius:24,
        background:isSuccess?C.accentDim:isLoading?"#0F1A2E":C.card,
        border:"1px solid "+(isSuccess?C.accent:C.border),
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:36,marginBottom:24,
        transition:"all .3s",
        boxShadow:isSuccess?"0 0 30px "+C.accent+"44":"none",
      }}>
        {isSuccess ? "✓" : isLoading ? "⋯" : "🔒"}
      </div>

      {/* Title */}
      <div style={{fontSize:24,fontWeight:700,letterSpacing:-0.5,marginBottom:8,textAlign:"center"}}>
        Mi Suite Personal
      </div>
      <div style={{fontSize:14,color:C.textMuted,marginBottom:40,textAlign:"center"}}>
        {isSuccess ? "Acceso concedido" :
         state === "unsupported" ? "Biométrica no disponible" :
         hasReg ? "Usa Face ID o Touch ID para continuar" :
         "Configura el acceso biométrico"}
      </div>

      {/* Message */}
      {msg&&(
        <div style={{
          background:msg.includes("✓")?C.accentDim:C.card,
          border:"1px solid "+(msg.includes("✓")?C.accent:C.border),
          borderRadius:12,padding:"10px 16px",
          fontSize:13,color:msg.includes("✓")?C.accent:C.textSub,
          marginBottom:24,textAlign:"center",width:"100%",maxWidth:320,
        }}>
          {msg}
        </div>
      )}

      {/* Botón principal */}
      {state !== "unsupported" && !isSuccess && (
        <button
          onClick={hasReg ? tryAuth : tryRegister}
          disabled={isLoading}
          style={{
            width:"100%",maxWidth:320,padding:"14px",borderRadius:14,border:"none",
            background:isLoading?C.card:C.accent,
            color:isLoading?C.textMuted:"#000",
            fontWeight:700,fontSize:16,cursor:isLoading?"not-allowed":"pointer",
            marginBottom:12,
            transition:"all .2s",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>
          {isLoading ? (
            <>
              <span style={{display:"inline-block",animation:"bio-spin 1s linear infinite"}}>⋯</span>
              {state==="registering"?"Registrando...":"Autenticando..."}
            </>
          ) : hasReg ? (
            <>{state==="error"?"Reintentar":"Face ID / Touch ID"}</>
          ) : (
            <>Activar Face ID / Touch ID</>
          )}
        </button>
      )}

      {/* Skip / Entrar sin biométrica */}
      {!isSuccess && (
        <button onClick={onUnlock} style={{
          background:"transparent",border:"none",
          color:C.textMuted,cursor:"pointer",
          fontSize:13,padding:"8px",marginBottom:8,
        }}>
          Entrar sin biométrica
        </button>
      )}

      {/* Reset biométrica */}
      {hasReg && !isLoading && !isSuccess && (
        <button onClick={handleReset} style={{
          background:"transparent",border:"none",
          color:C.textMuted,cursor:"pointer",
          fontSize:11,padding:"6px",opacity:.6,
          marginTop:16,
        }}>
          Quitar Face ID registrado
        </button>
      )}

      {/* Unsupported */}
      {state === "unsupported" && (
        <div style={{textAlign:"center",maxWidth:280}}>
          <div style={{fontSize:13,color:C.textMuted,lineHeight:1.6,marginBottom:24}}>
            Tu dispositivo o navegador no soporta biométrica web. Necesitas iOS 14+ con Safari o Chrome 67+.
          </div>
          <button onClick={onUnlock} style={{
            width:"100%",padding:13,borderRadius:12,border:"none",
            background:C.accent,color:"#000",fontWeight:700,fontSize:15,cursor:"pointer",
          }}>
            Entrar de todas formas
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:
        "@keyframes bio-spin{from{opacity:.3}50%{opacity:1}to{opacity:.3}}"
      }}/>
    </div>
  );
}
