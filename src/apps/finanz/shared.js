// finanz/shared.js — Constantes y utilidades compartidas

// ─── PALETTE ─────────────────────────────────────────────────────────────────
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
export const today  = () => new Date().toISOString().slice(0,10);
export const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

