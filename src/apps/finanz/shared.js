// finanz/shared.js — Constantes y utilidades compartidas

// ─── PALETTE ─────────────────────────────────────────────────────────────────
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
  textSub:"#A1A1AA",
};

export const DEFAULT_CATEGORIES = {
  income:[
    {id:"salary",    label:"Sueldo",        icon:"💼",subs:["Empresa","Freelance","Bonificación","Horas extra"]},
    {id:"business",  label:"Negocio",        icon:"🏪",subs:["Ventas","Servicios","Comisiones"]},
    {id:"investment",label:"Inversión",      icon:"📈",subs:["Dividendos","Intereses","Cripto","CDT"]},
    {id:"loan_pay",  label:"Cobro Préstamo", icon:"🤝",subs:["Abono","Pago total"]},
    {id:"flota_inc", label:"Ingresos Flota", icon:"🚗",subs:["Carro 1","Carro 2"]},
    {id:"other_in",  label:"Otros Ingresos", icon:"💰",subs:["Regalo","Reembolso","Varios"]},
    {id:"transfer",  label:"Transferencia",  icon:"↔️",subs:[]},
  ],
  expense:[
    {id:"housing",   label:"Vivienda",        icon:"🏠",subs:["Arriendo","Hipoteca","Servicios","Administración","Internet"]},
    {id:"food",      label:"Alimentación",    icon:"🍽️",subs:["Mercado","Restaurante","Domicilios","Cafetería"]},
    {id:"transport", label:"Transporte",      icon:"🚗",subs:["Gasolina","SITP/Metro","Taxi/Uber","Parqueadero","Mantenimiento"]},
    {id:"health",    label:"Salud",           icon:"🏥",subs:["Medicina","Gimnasio","Farmacia","Médico","EPS"]},
    {id:"education", label:"Educación",       icon:"📚",subs:["Universidad","Cursos","Libros","Útiles"]},
    {id:"entertain", label:"Entretenimiento", icon:"🎮",subs:["Streaming","Salidas","Viajes","Hobbies"]},
    {id:"clothing",  label:"Ropa",            icon:"👗",subs:["Ropa","Calzado","Accesorios"]},
    {id:"savings",   label:"Ahorros",         icon:"🏦",subs:["Fondo emergencia","Meta viaje","Pensión voluntaria"]},
    {id:"debt",      label:"Deudas",          icon:"💳",subs:["Tarjeta crédito","Préstamo personal","Cuota vehículo"]},
    {id:"loans_out", label:"Préstamos",       icon:"🤝",subs:["Préstamo personal","Préstamo familiar","Préstamo laboral"]},
    {id:"other",     label:"Otros",           icon:"📦",subs:["Varios","Impuestos","Donaciones"]},
    {id:"transfer",  label:"Transferencia",   icon:"↔️",subs:[]},
  ],
};

export const ACCOUNTS_DEF = [
  {id:"cash",        label:"Efectivo",    icon:"💵",color:C.accentText},
  {id:"nequi",       label:"Nequi",       icon:"💜",color:C.purple},
  {id:"bbva",        label:"BBVA",        icon:"🔵",color:C.blue},
  {id:"daviplata",   label:"Daviplata",   icon:"🔴",color:C.red},
  {id:"bancolombia", label:"Bancolombia", icon:"🟡",color:C.yellow},
  {id:"savings_acc", label:"Ahorros",     icon:"🏦",color:"#34D399"},
];

export const fmtCOP   = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);
// Formato compacto para espacios pequeños: $2.7M, $484k, $22.6M
export const fmtShort = num => {
  const n = Math.abs(num||0); const s = num < 0 ? "-" : "";
  if (n >= 1000000) return s + "$" + (n/1000000).toFixed(1).replace(".0","") + "M";
  if (n >= 1000)    return s + "$" + (n/1000).toFixed(0) + "k";
  return s + "$" + n;
};
export const CAT_ICONS = ["📦","🛍️","🍔","🚗","🏠","💊","📚","✈️","🎬","💪","🐾","🎮","👔","💡","📱","🏦","💰","🎁","🔧","⛽","🍺","☕","🎵","🏥","📝","💼","🌿","🎯","💎","🛒"];
export const ACCOUNT_ICONS = ["💵","🏦","💳","💜","🔵","🔴","🟡","🟢","🟠","⚫","🏧","💰","📱","💻","🏠","🌍","⭐","🎯"];
export const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

