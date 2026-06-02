// finanz/shared.js — Paleta, formateadores y constantes compartidas
import { useState, useEffect } from "react";


// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
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

const DEFAULT_CATEGORIES = {
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

const ACCOUNTS_DEF = [
  {id:"cash",        label:"Efectivo",    icon:"💵",color:C.accentText},
  {id:"nequi",       label:"Nequi",       icon:"💜",color:C.purple},
  {id:"bbva",        label:"BBVA",        icon:"🔵",color:C.blue},
  {id:"daviplata",   label:"Daviplata",   icon:"🔴",color:C.red},
  {id:"bancolombia", label:"Bancolombia", icon:"🟡",color:C.yellow},
  {id:"savings_acc", label:"Ahorros",     icon:"🏦",color:"#34D399"},
];

const fmtCOP   = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
// Formato compacto para espacios pequeños: $2.7M, $484k, $22.6M
const fmtShort = v => {
  const n = Math.abs(v||0);
  const s = v < 0 ? "-" : "";
  if (n >= 1000000) return s+"$"+(n/1000000).toFixed(1).replace(".0","")+"M";
  if (n >= 1000)    return s+"$"+(n/1000).toFixed(0)+"k";
  return s+"$"+n;
};
const today  = () => new Date().toISOString().slice(0,10);
const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── SEED ─────────────────────────────────────────────────────────────────────
function seedTx(){
  const now=new Date(); let id=1; const tx=[];
  const add=(days,type,cat,sub,acc,amount,note,loanId=null)=>{
    const d=new Date(now); d.setDate(d.getDate()-days);
    tx.push({id:id++,date:d.toISOString().slice(0,10),type,category:cat,subcategory:sub,account:acc,amount,note,loanId});
  };
  add(0,"income","salary","Empresa","bancolombia",4200000,"Sueldo mensual");
  add(1,"expense","food","Mercado","nequi",320000,"Éxito");
  add(2,"expense","transport","Gasolina","cash",85000,"Full tanque");
  add(3,"expense","housing","Arriendo","bbva",950000,"Arriendo mes");
  add(4,"expense","entertain","Streaming","nequi",52900,"Netflix+Spotify");
  add(5,"income","business","Ventas","nequi",800000,"Proyecto web");
  add(6,"expense","food","Restaurante","cash",45000,"Almuerzo");
  add(7,"expense","health","Gimnasio","nequi",120000,"Mes gym");
  add(9,"income","salary","Bonificación","bancolombia",500000,"Bonificación Q3");
  add(14,"expense","savings","Fondo emergencia","savings_acc",400000,"Ahorro mensual");
  add(16,"expense","debt","Tarjeta crédito","bbva",650000,"Pago tarjeta");
  add(18,"income","investment","Intereses","savings_acc",95000,"Rendimientos CDT");
  add(25,"expense","health","Farmacia","cash",55000,"Medicamentos");
  return tx;
}

function seedLoans(){
  const now=new Date();
  const d=days=>{const x=new Date(now);x.setDate(x.getDate()-days);return x.toISOString().slice(0,10);};
  return [
    {id:"L1",debtor:"Carlos Rodríguez", amount:500000,  balance:500000, date:d(45),account:"cash",       note:"Préstamo personal",status:"active",payments:[]},
    {id:"L2",debtor:"María González",   amount:1200000, balance:800000, date:d(60),account:"nequi",      note:"Auxilio médico",   status:"active",payments:[
      {id:"P1",date:d(30),amount:200000,note:"Primer abono"},
      {id:"P2",date:d(10),amount:200000,note:"Segundo abono"},
    ]},
    {id:"L3",debtor:"Andrés Martínez",  amount:300000,  balance:0,      date:d(90),account:"bancolombia",note:"Préstamo trabajo", status:"paid",  payments:[
      {id:"P3",date:d(60),amount:150000,note:"Primer pago"},
      {id:"P4",date:d(20),amount:150000,note:"Pago final"},
    ]},
    {id:"L4",debtor:"Luisa Fernández",  amount:750000,  balance:750000, date:d(5), account:"nequi",      note:"Para viaje",       status:"active",payments:[]},
  ];
}

