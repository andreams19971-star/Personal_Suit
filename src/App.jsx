import { useState, useEffect } from "react";
import { supabase, isConfigured } from "./supabase.js";
import FinanzApp from "./apps/FinanzApp.jsx";
import Planner from "./apps/Planner.jsx";
import FlotaTracker from "./apps/FlotaTracker.jsx";
import ApartamentoApp from "./apps/ApartamentoApp.jsx";

const APPS = [
  { id:"finanz",      label:"FinanzApp",    subtitle:"Presupuesto & Finanzas",    icon:"💰", color:"#00D97E", colorDim:"#071A10", desc:"Ingresos, gastos, tarjetas y préstamos" },
  { id:"planner",     label:"Planner",      subtitle:"Tareas & Metas",            icon:"📅", color:"#60A5FA", colorDim:"#061022", desc:"Organiza tu vida día a día"             },
  { id:"flota",       label:"FlotaTracker", subtitle:"Gestión de Flota",          icon:"🚗", color:"#A855F7", colorDim:"#110722", desc:"Cobros y gastos de tus dos carros"      },
  { id:"apartamento", label:"Apartamento",  subtitle:"Reservas & Disponibilidad", icon:"🏠", color:"#818CF8", colorDim:"#0F1235", desc:"Gestiona las 3 habitaciones"            },
];

const THEMES = [
  { id:"dark",    label:"Oscuro",   bg:"#080C14" },
  { id:"darker",  label:"Negro",    bg:"#000000" },
  { id:"purple",  label:"Morado",   bg:"#0D0B14" },
];

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem("suite_prefs") || "{}"); } catch { return {}; }
}
function savePrefs(p) {
  try { localStorage.setItem("suite_prefs", JSON.stringify(p)); } catch {}
}

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [dbStatus,  setDbStatus]  = useState("checking");
  const [settings,  setSettings]  = useState(false);
  const [prefs,     setPrefs]     = useState(loadPrefs);

  const updatePref = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    savePrefs(next);
  };

  useEffect(() => {
    if (!isConfigured) { setDbStatus("error"); return; }
    supabase.from("transactions").select("count").limit(1)
      .then(({ error }) => setDbStatus(error ? "error" : "ok"))
      .catch(() => setDbStatus("error"));
  }, []);

  if (activeApp === "finanz")      return <FinanzApp       onBack={() => setActiveApp(null)} />;
  if (activeApp === "planner")     return <Planner         onBack={() => setActiveApp(null)} />;
  if (activeApp === "flota")       return <FlotaTracker    onBack={() => setActiveApp(null)} />;
  if (activeApp === "apartamento") return <ApartamentoApp  onBack={() => setActiveApp(null)} />;

  const theme = THEMES.find(t => t.id === (prefs.theme || "dark")) || THEMES[0];
  const userName = prefs.name || "Andrés";
  const statusColor = dbStatus==="ok" ? "#22C55E" : dbStatus==="error" ? "#EF4444" : "#FBBF24";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      background: theme.bg,
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      color: "#F0F4FF",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      overflowX: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ paddingTop: "max(52px, calc(env(safe-area-inset-top) + 20px))", padding: "max(52px, calc(env(safe-area-inset-top) + 20px)) 24px 20px", animation: "launcher-fadeUp .5s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "#3A4A65", fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>MI SUITE PERSONAL</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
              {greeting} 👋
              <br/>
              <span style={{ color: "#00D97E" }}>{userName}</span>
            </div>
            <div style={{ fontSize: 12, color: "#3A4A65", marginTop: 8 }}>
              {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <button onClick={() => setSettings(true)} style={{
            width: 42, height: 42, borderRadius: 12, background: "#0F1624",
            border: "1px solid #1E2A3A", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", fontSize: 20, flexShrink: 0,
            marginTop: 4,
          }}>⚙️</button>
        </div>

        {/* STATUS */}
        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "#0F1624", border: "1px solid " + statusColor + "33", borderRadius: 100, padding: "6px 14px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, animation: dbStatus === "checking" ? "pulse 1.2s ease infinite" : "none" }}/>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
            {dbStatus === "ok" ? "Supabase conectado" : dbStatus === "error" ? "Sin conexión a BD" : "Verificando..."}
          </span>
        </div>
      </div>

      {/* APPS */}
      <div style={{ padding: "0 20px 40px", display: "grid", gap: 14 }}>
        {APPS.map((app, i) => (
          <button key={app.id} className="launcher-card" onClick={() => setActiveApp(app.id)}
            style={{ animation: "launcher-fadeUp .5s ease " + (i * .12 + .3) + "s both" }}>
            <div style={{ background: "linear-gradient(135deg," + app.colorDim + ",#111827)", border: "1px solid " + app.color + "30", borderRadius: 22, padding: "22px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -25, right: -25, width: 110, height: 110, borderRadius: "50%", background: app.color + "0C", pointerEvents: "none" }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, flexShrink: 0, background: app.color + "20", border: "1px solid " + app.color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{app.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2 }}>{app.label}</div>
                  <div style={{ fontSize: 12, color: app.color, fontWeight: 600, marginBottom: 5 }}>{app.subtitle}</div>
                  <div style={{ fontSize: 13, color: "#6A7A99", lineHeight: 1.4 }}>{app.desc}</div>
                </div>
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: app.color + "18", border: "1px solid " + app.color + "35", display: "flex", alignItems: "center", justifyContent: "center", color: app.color, fontSize: 18 }}>›</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: "max(24px, env(safe-area-inset-bottom))", fontSize: 11, color: "#1E2A3A" }}>
        Mi Suite Personal · v2.0
      </div>

      {/* SETTINGS PANEL */}
      {settings && (
        <div style={{ position: "fixed", inset: 0, background: "#000000AA", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={() => setSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0F1320", borderRadius: "20px 20px 0 0", width: "100%",
            padding: "16px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))",
            borderTop: "1px solid #232D45", animation: "settings-in .3s ease",
            maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ width: 36, height: 4, background: "#232D45", borderRadius: 2, margin: "0 auto 20px" }}/>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>⚙️ Configuración</div>

            {/* Nombre */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#3A4A65", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>TU NOMBRE</div>
              <input
                value={prefs.name || ""}
                onChange={e => updatePref("name", e.target.value)}
                placeholder="¿Cómo te llamas?"
                style={{ width: "100%", background: "#161C2E", border: "1px solid #232D45", borderRadius: 10, padding: "10px 14px", color: "#F1F5FF", fontSize: 15 }}
              />
            </div>

            {/* Tema */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#3A4A65", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>TEMA DE COLOR</div>
              <div style={{ display: "flex", gap: 10 }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => updatePref("theme", t.id)} style={{
                    flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
                    border: "2px solid " + ((prefs.theme || "dark") === t.id ? "#00D97E" : "#232D45"),
                    background: t.bg, color: (prefs.theme || "dark") === t.id ? "#00D97E" : "#6A7A99",
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: t.bg, border: "2px solid #232D45", margin: "0 auto 6px" }}/>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{ background: "#161C2E", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#3A4A65", fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>CONEXIÓN</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }}/>
                <span style={{ fontSize: 13, color: statusColor, fontWeight: 600 }}>
                  {dbStatus === "ok" ? "Supabase conectado ✓" : "Sin conexión"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#3A4A65", marginTop: 6 }}>Base de datos: cpzwvavhbhspjuntlkyz</div>
            </div>

            <button onClick={() => setSettings(false)} style={{
              width: "100%", marginTop: 16, padding: 13, borderRadius: 12, border: "none",
              background: "#00D97E", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>Guardar y cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
