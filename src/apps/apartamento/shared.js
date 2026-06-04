// apartamento/shared.js


// ─── COLORES ──────────────────────────────────────────────────────────────────
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

export const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);
export const today  = () => new Date().toISOString().slice(0,10);

export const STATUS_CONFIG = {
  available: { label:"Disponible",  color:C.green,  bg:C.greenDim,  icon:"✅" },
  reserved:  { label:"Reservado",   color:C.accent, bg:C.accentDim, icon:"📅" },
  occupied:  { label:"Ocupado",     color:C.orange, bg:C.orangeDim, icon:"🏠" },
  cleaning:  { label:"Limpieza",    color:C.yellow, bg:C.yellowDim, icon:"🧹" },
  blocked:   { label:"Bloqueado",   color:C.red,    bg:C.redDim,    icon:"🚫" },
};

export const PLATFORMS = ["Airbnb","Booking","Directo","WhatsApp","Referido","Otro"];

export function seedData() {
  const now = new Date();
  const d = (days) => { const x = new Date(now); x.setDate(x.getDate()+days); return x.toISOString().slice(0,10); };
  const ago = (days) => { const x = new Date(now); x.setDate(x.getDate()-days); return x.toISOString().slice(0,10); };

  return {
    rooms: [
      { id:"R1", name:"Habitación 1", description:"Cama doble, baño privado", basePrice:120000, icon:"🛏️", color:"#818CF8", amenities:["WiFi","AC","TV","Baño privado"] },
      { id:"R2", name:"Habitación 2", description:"Cama sencilla, baño compartido", basePrice:80000, icon:"🛏️", color:"#34D399", amenities:["WiFi","TV","Baño compartido"] },
      { id:"R3", name:"Habitación 3", description:"Cama doble premium, baño privado", basePrice:150000, icon:"🛏️", color:"#FBBF24", amenities:["WiFi","AC","TV","Baño privado","Balcón"] },
    ],
    reservations: [
      { id:"RES1", roomId:"R1", guest:"Carlos Martínez", phone:"3001234567", checkIn:ago(2), checkOut:d(1), nights:3, platform:"Airbnb", total:360000, status:"occupied", paid:360000, notes:"Viaje de trabajo" },
      { id:"RES2", roomId:"R2", guest:"Ana López",       phone:"3109876543", checkIn:d(3),  checkOut:d(6), nights:3, platform:"Booking", total:240000, status:"reserved",  paid:120000, notes:"" },
      { id:"RES3", roomId:"R3", guest:"Pedro Ruiz",      phone:"3205554433", checkIn:d(1),  checkOut:d(5), nights:4, platform:"Directo",  total:600000, status:"reserved",  paid:300000, notes:"Pareja, aniversario" },
      { id:"RES4", roomId:"R1", guest:"María García",    phone:"3001112222", checkIn:d(5),  checkOut:d(8), nights:3, platform:"WhatsApp", total:360000, status:"reserved",  paid:0,      notes:"" },
    ],
    expenses: [
      { id:"E1", date:ago(5),  category:"Servicios",    amount:180000, note:"Agua + luz",     room:null },
      { id:"E2", date:ago(10), category:"Limpieza",     amount:50000,  note:"Aseo semanal",   room:"R1" },
      { id:"E3", date:ago(3),  category:"Mantenimiento",amount:120000, note:"Grifo baño R2",  room:"R2" },
      { id:"E4", date:ago(1),  category:"Insumos",      amount:35000,  note:"Papel, jabón",   room:null },
    ],
  };
}


export const fmtCOP = n =>
  new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(n||0);
export const fmtShort = n => {
  const n = Math.abs(n||0); const s = (n||0) < 0 ? "-" : "";
  if (n >= 1000000) return s + "$" + (n/1000000).toFixed(1).replace(".0","") + "M";
  if (n >= 1000)    return s + "$" + (n/1000).toFixed(0) + "k";
  return s + "$" + n;
};
