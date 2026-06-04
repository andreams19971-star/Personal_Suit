// planner/shared.js


export const C = {
  bg:"#09090B",surface:"#111113",card:"#18181B",card2:"#1C1C1F",
  border:"#27272A",borderSub:"#1C1C1F",
  text:"#FAFAFA",textSub:"#A1A1AA",textMuted:"#52525B",
  accent:"#22C55E",accentDim:"#052010",accentText:"#4ADE80",
  green:"#22C55E",greenDim:"#052010",
  red:"#EF4444",redDim:"#1F0808",
  yellow:"#EAB308",yellowDim:"#1C1500",
  orange:"#F97316",orangeDim:"#1C0A02",
  blue:"#3B82F6",blueDim:"#071228",
  purple:"#A855F7",purpleDim:"#180A28",
};

export const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const today = () => new Date().toISOString().slice(0, 10);

export const HABIT_ICONS = ["💧","🏃","📚","🧘","🥗","😴","💪","🚭","🙏","✍️","🎯","🌿"];
export const PRIORITIES = [
  { id: "high",   label: "Alta",   color: "#F87171" },
  { id: "medium", label: "Media",  color: "#FBBF24" },
  { id: "low",    label: "Baja",   color: "#34D399" },
];
export const TASK_CATS = [
  { id: "work",     label: "Trabajo",   icon: "💼" },
  { id: "personal", label: "Personal",  icon: "🧍" },
  { id: "health",   label: "Salud",     icon: "🏥" },
  { id: "finance",  label: "Finanzas",  icon: "💰" },
  { id: "errands",  label: "Diligencias",icon: "📋" },
  { id: "other",    label: "Otro",      icon: "📦" },
];

export function seedData() {
  const now = new Date();
  const d = (days) => { const x = new Date(now); x.setDate(x.getDate() + days); return x.toISOString().slice(0,10); };
  return {
    tasks: [
      { id: "T1", title: "Revisar extracto bancario", category: "finance", priority: "high", date: today(), done: false, note: "" },
      { id: "T2", title: "Ir al médico control", category: "health", priority: "medium", date: today(), done: false, note: "Cita 3pm" },
      { id: "T3", title: "Llamar al seguro del carro", category: "errands", priority: "medium", date: d(1), done: false, note: "" },
      { id: "T4", title: "Completar informe semanal", category: "work", priority: "high", date: d(1), done: false, note: "" },
      { id: "T5", title: "Comprar mercado", category: "personal", priority: "low", date: d(2), done: false, note: "" },
      { id: "T6", title: "Pagar servicios", category: "finance", priority: "high", date: d(3), done: false, note: "" },
    ],
    habits: [
      { id: "H1", name: "Tomar agua", icon: "💧", target: 8, unit: "vasos", color: C.accent, completions: {} },
      { id: "H2", name: "Ejercicio", icon: "🏃", target: 1, unit: "sesión", color: C.green, completions: {} },
      { id: "H3", name: "Leer", icon: "📚", target: 30, unit: "minutos", color: C.purple, completions: {} },
      { id: "H4", name: "Meditar", icon: "🧘", target: 1, unit: "sesión", color: C.yellow, completions: {} },
    ],
    goals: [
      { id: "G1", title: "Ahorrar para viaje", icon: "✈️", target: 5000000, current: 1200000, deadline: d(120), color: C.accent, category: "finance" },
      { id: "G2", title: "Leer 12 libros", icon: "📚", target: 12, current: 3, deadline: d(240), color: C.purple, category: "personal" },
      { id: "G3", title: "Bajar 8 kg", icon: "⚖️", target: 8, current: 2, deadline: d(90), color: C.green, category: "health" },
    ],
    notes: [
      { id: "N1", title: "Ideas de negocio", content: "App de delivery para mascotas, consultoría de finanzas...", color: C.yellow, date: today() },
      { id: "N2", title: "Lista mercado", content: "Arroz, fríjoles, aceite, pollo, verduras, frutas", color: C.green, date: today() },
    ],
  };
}

export const DEFAULT_TASK_CATS = [
  { id:"work",     label:"Trabajo",    icon:"💼", subs:["Reunión","Entrega","Revisión","Llamada"] },
  { id:"personal", label:"Personal",   icon:"🧍", subs:["Familia","Amigos","Hogar","Trámite"] },
  { id:"health",   label:"Salud",      icon:"🏥", subs:["Médico","Ejercicio","Farmacia","Control"] },
  { id:"finance",  label:"Finanzas",   icon:"💰", subs:["Pago","Ahorro","Presupuesto","Inversión"] },
  { id:"errands",  label:"Diligencias",icon:"📋", subs:["Banco","Mercado","Oficina","Envío"] },
  { id:"other",    label:"Otro",       icon:"📦", subs:[] },
];

