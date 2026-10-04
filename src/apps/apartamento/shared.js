// apartamento/shared.js


// ─── COLORES ──────────────────────────────────────────────────────────────────
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
export const fmtShort = num => {
  const n = Math.abs(num||0); const s = num < 0 ? "-" : "";
  if (n >= 1000000) return s + "$" + (n/1000000).toFixed(1).replace(".0","") + "M";
  if (n >= 1000)    return s + "$" + (n/1000).toFixed(0) + "k";
  return s + "$" + n;
};
