import { useState, useEffect } from "react";
import { supabase, isConfigured } from "./supabase.js";
import FinanzApp from "./apps/FinanzApp.jsx";
import Planner from "./apps/Planner.jsx";
import FlotaTracker from "./apps/FlotaTracker.jsx";

const APPS = [
  { id:"finanz",  label:"FinanzApp",    subtitle:"Presupuesto & Finanzas",  icon:"💰", color:"#00D97E", colorDim:"#071A10", desc:"Ingresos, gastos, cuentas y préstamos" },
  { id:"planner", label:"Planner",      subtitle:"Tareas, Hábitos & Metas", icon:"📅", color:"#60A5FA", colorDim:"#061022", desc:"Organiza tu vida día a día"            },
  { id:"flota",   label:"FlotaTracker", subtitle:"Gestión de Flota",        icon:"🚗", color:"#A855F7", colorDim:"#110722", desc:"Cobros y gastos de tus dos carros"     },
];

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [dbStatus, setDbStatus]   = useState("checking"); // checking | ok | error

  // Verificar conexión a Supabase al iniciar
  useEffect(() => {
    if (!isConfigured) {
      setDbStatus("error");
      return;
    }
    supabase.from("transactions").select("count").limit(1)
      .then(({ error }) => setDbStatus(error ? "error" : "ok"))
      .catch(() => setDbStatus("error"));
  }, []);

  // Controlar body cuando una app está activa
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100vw'
    return () => {
      document.body.style.overflow = ''
      document.body.style.width = ''
    }
  }, []);

  if (activeApp === "finanz")  return <FinanzApp    onBack={() => setActiveApp(null)} />;
  if (activeApp === "planner") return <Planner      onBack={() => setActiveApp(null)} />;
  if (activeApp === "flota")   return <FlotaTracker onBack={() => setActiveApp(null)} />;

  const statusColor = dbStatus === "ok" ? "#22C55E" : dbStatus === "error" ? "#EF4444" : "#FBBF24";
  const statusText  = dbStatus === "ok" ? "Supabase conectado" : dbStatus === "error" ? "Sin conexión a BD" : "Verificando...";

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      background: "#080C14",
      minHeight: "100vh",
      color: "#F0F4FF",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes launcher-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .launcher-card {
          transition: transform .2s ease;
          cursor: pointer;
          border: none;
          text-align: left;
          width: 100%;
        }
        .launcher-card:hover  { transform: translateY(-3px); }
        .launcher-card:active { transform: scale(.97); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "52px 24px 20px", animation: "launcher-fadeUp .5s ease both" }}>
        <div style={{ fontSize: 12, color: "#3A4A65", fontWeight: 600, letterSpacing: 2, marginBottom: 10 }}>
          MI SUITE PERSONAL
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.15 }}>
          Hola 👋
          <br />
          <span style={{ color: "#00D97E" }}>¿Qué vas a hacer hoy?</span>
        </div>
        <div style={{ fontSize: 13, color: "#3A4A65", marginTop: 10 }}>
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
          })}
        </div>

        {/* ESTADO SUPABASE */}
        <div style={{
          marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7,
          background: "#0F1624", border: `1px solid ${statusColor}33`,
          borderRadius: 100, padding: "6px 14px",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: statusColor, flexShrink: 0,
            animation: dbStatus === "checking" ? "pulse 1.2s ease infinite" : "none",
          }}/>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{statusText}</span>
          {dbStatus === "error" && (
            <span style={{ fontSize: 10, color: "#3A4A65", marginLeft: 2 }}>
              · Configura .env o variables en Render
            </span>
          )}
        </div>
      </div>

      {/* APPS */}
      <div style={{ padding: "0 20px 40px", display: "grid", gap: 14 }}>
        {APPS.map((app, i) => (
          <button
            key={app.id}
            className="launcher-card"
            onClick={() => setActiveApp(app.id)}
            style={{
              background: `linear-gradient(135deg, ${app.colorDim}, #111827)`,
              border: `1px solid ${app.color}30`,
              borderRadius: 22,
              padding: "22px 20px",
              color: "#F0F4FF",
              animation: `launcher-fadeUp .5s ease ${i * .12 + .3}s both`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: -25, right: -25,
              width: 110, height: 110, borderRadius: "50%",
              background: `${app.color}0C`, pointerEvents: "none",
            }}/>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                background: `${app.color}20`, border: `1px solid ${app.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              }}>{app.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2 }}>{app.label}</div>
                <div style={{ fontSize: 12, color: app.color, fontWeight: 600, marginBottom: 5 }}>{app.subtitle}</div>
                <div style={{ fontSize: 13, color: "#6A7A99", lineHeight: 1.4 }}>{app.desc}</div>
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: `${app.color}18`, border: `1px solid ${app.color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: app.color, fontSize: 18,
              }}>›</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: 24, fontSize: 11, color: "#1E2A3A" }}>
        Mi Suite Personal · v2.0
      </div>
    </div>
  );
}
