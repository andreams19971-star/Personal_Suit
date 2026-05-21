import { useState } from "react";
import FinanzApp from "./apps/FinanzApp.jsx";
import Planner from "./apps/Planner.jsx";
import FlotaTracker from "./apps/FlotaTracker.jsx";

const APPS = [
  { id:"finanz",  label:"FinanzApp",     subtitle:"Presupuesto & Finanzas",  icon:"💰", color:"#00D97E", colorDim:"#0A2A1A", desc:"Ingresos, gastos, cuentas y préstamos" },
  { id:"planner", label:"Planner",       subtitle:"Tareas, Hábitos & Metas", icon:"📅", color:"#60A5FA", colorDim:"#0A1A2E", desc:"Organiza tu vida día a día"            },
  { id:"flota",   label:"FlotaTracker",  subtitle:"Gestión de Flota",        icon:"🚗", color:"#A855F7", colorDim:"#1A0A28", desc:"Cobros y gastos de tus dos carros"     },
];

export default function App() {
  const [activeApp, setActiveApp] = useState(null);

  if (activeApp === "finanz")  return <FinanzApp    onBack={() => setActiveApp(null)} />;
  if (activeApp === "planner") return <Planner      onBack={() => setActiveApp(null)} />;
  if (activeApp === "flota")   return <FlotaTracker onBack={() => setActiveApp(null)} />;

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif", background:"#080C14", minHeight:"100vh", color:"#F0F4FF", display:"flex", flexDirection:"column" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .app-card{transition:all .25s cubic-bezier(.4,0,.2,1);cursor:pointer}
        .app-card:hover{transform:translateY(-4px) scale(1.01)}
        .app-card:active{transform:scale(.97)}
      `}</style>
      <div style={{ padding:"52px 24px 24px", animation:"fadeUp .5s ease both" }}>
        <div style={{ fontSize:13, color:"#4A5A75", fontWeight:600, letterSpacing:2, marginBottom:8 }}>MI SUITE PERSONAL</div>
        <div style={{ fontSize:32, fontWeight:900, letterSpacing:-1.5, lineHeight:1.1 }}>
          Hola 👋<br/><span style={{ color:"#00D97E" }}>¿Qué vas a hacer hoy?</span>
        </div>
        <div style={{ fontSize:14, color:"#4A5A75", marginTop:10 }}>
          {new Date().toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
      </div>
      <div style={{ padding:"0 20px", display:"grid", gap:16, flex:1 }}>
        {APPS.map((app, i) => (
          <button key={app.id} className="app-card" onClick={() => setActiveApp(app.id)}
            style={{ background:`linear-gradient(135deg,${app.colorDim},#111827)`, border:`1px solid ${app.color}33`, borderRadius:24, padding:24, textAlign:"left", color:"#F0F4FF", animation:`fadeUp .5s ease ${i*.1+.2}s both`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%", background:`${app.color}0D` }}/>
            <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:`${app.color}22`, border:`1px solid ${app.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{app.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:800, marginBottom:2 }}>{app.label}</div>
                <div style={{ fontSize:12, color:app.color, fontWeight:600, marginBottom:6 }}>{app.subtitle}</div>
                <div style={{ fontSize:13, color:"#8899BB", lineHeight:1.4 }}>{app.desc}</div>
              </div>
              <div style={{ width:32, height:32, borderRadius:"50%", background:`${app.color}22`, border:`1px solid ${app.color}44`, display:"flex", alignItems:"center", justifyContent:"center", color:app.color, fontSize:16, flexShrink:0 }}>›</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding:"24px", textAlign:"center", fontSize:11, color:"#2A3550" }}>Mi Suite Personal · v2.0</div>
    </div>
  );
}
