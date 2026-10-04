// planner/shared.js


export const C = {
  bg:"#F5F4F0",surface:"#FFFFFF",card:"#FFFFFF",card2:"#F9F8F5",
  border:"#E8E6DF",borderSub:"#F0EEE9",
  text:"#1A1916",textSub:"#6B6860",textMuted:"#A8A49C",
  accent:"#5C8A6B",accentDim:"#EBF2EE",accentText:"#3D6B50",
  green:"#4A7C59",greenDim:"#EBF2EE",
  red:"#C0392B",redDim:"#FDECEA",
  yellow:"#997A00",yellowDim:"#FEF9E7",
  orange:"#C0641A",orangeDim:"#FEF0E7",
  blue:"#3B6FA8",blueDim:"#EBF2FC",
  purple:"#7B5EA7",purpleDim:"#F3EEF9",
};

export const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const today = () => new Date().toISOString().slice(0, 10);

export const TASK_STATUS = {
  pending:     { label:"Pendiente",    icon:"⏳", color:"#EAB308", bg:"#78350F22" },
  in_progress: { label:"En progreso",  icon:"🔄", color:"#3B82F6", bg:"#1E3A5F22" },
  done:        { label:"Completado",   icon:"✅", color:"#22C55E", bg:"#14532D22" },
  archived:    { label:"Archivado",    icon:"📦", color:"#71717A", bg:"#27272A22" },
};

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

