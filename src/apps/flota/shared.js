// flota/shared.js


export const ACCOUNTS = [
  {id:"cash",        label:"Efectivo",    icon:"💵"},
  {id:"nequi",       label:"Nequi",       icon:"💜"},
  {id:"bbva",        label:"BBVA",        icon:"🔵"},
  {id:"daviplata",   label:"Daviplata",   icon:"🔴"},
  {id:"bancolombia", label:"Bancolombia", icon:"🟡"},
];

// ─── COLORES ──────────────────────────────────────────────────────────────────

export const CAR1 = "#3B82F6";   // azul - diario
export const CAR1_DIM = "#071228";
export const CAR2 = "#A855F7";   // morado - mensual
export const CAR2_DIM = "#180A28";
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

export const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);
export const today  = () => new Date().toISOString().slice(0,10);
export const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Carro 1: $70.000 × días laborales (Lun-Sáb)
// Carro 2: $500.000 mensual fijo
export const CARRO1_DIARIO  = 70000;
export const CARRO2_MENSUAL = 500000;

export function getWorkDaysInMonth(year, month) {
  // month: 0-based
  let count = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0) count++; // excluye domingos
  }
  return count;
}

export function getWorkDaysPassed(year, month) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const lastDay = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0) count++;
  }
  return count;
}

export function seedData() {
  const now = new Date();
  const ago = d => { const x = new Date(now); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10); };

  // Pagos carro 1 (diarios, Lun-Sáb)
  const pagos1 = [];
  for (let i = 0; i < 20; i++) {
    const fecha = ago(i);
    const dow = new Date(fecha+"T12:00").getDay();
    if (dow !== 0) { // no domingos
      pagos1.push({ id:"P1-"+i, fecha, monto: CARRO1_DIARIO, pagado: i > 2, nota:"" });
    }
  }

  // Pagos carro 2 (mensuales)
  const pagos2 = [
    { id:"P2-1", fecha: ago(45), monto: CARRO2_MENSUAL, pagado: true,  nota:"Pago puntual" },
    { id:"P2-2", fecha: ago(15), monto: CARRO2_MENSUAL, pagado: true,  nota:"" },
    { id:"P2-3", fecha: ago(0),  monto: CARRO2_MENSUAL, pagado: false, nota:"" },
  ];

  return {
    carros: [
      {
        id: "C1",
        nombre: "Carro 1",
        placa: "ABC-123",
        modelo: "Chevrolet Aveo 2019",
        conductor: "Carlos R.",
        tipo: "diario",
        valorDiario: CARRO1_DIARIO,
        color: CAR1,
        colorDim: CAR1_DIM,
        icon: "🚗",
        activo: true,
        gastos: [
          { id:"G1-1", fecha: ago(5),  categoria:"Gasolina",    monto:80000, nota:"Tanque lleno" },
          { id:"G1-2", fecha: ago(12), categoria:"Mantenimiento",monto:150000,nota:"Frenos" },
          { id:"G1-3", fecha: ago(20), categoria:"SOAT",         monto:320000,nota:"Renovación" },
        ],
      },
      {
        id: "C2",
        nombre: "Carro 2",
        placa: "XYZ-456",
        modelo: "Renault Logan 2020",
        conductor: "Andrés M.",
        tipo: "mensual",
        valorMensual: CARRO2_MENSUAL,
        color: CAR2,
        colorDim: CAR2_DIM,
        icon: "🚙",
        activo: true,
        gastos: [
          { id:"G2-1", fecha: ago(8),  categoria:"Gasolina",    monto:70000, nota:"" },
          { id:"G2-2", fecha: ago(30), categoria:"Aceite",       monto:85000, nota:"5W30" },
        ],
      },
    ],
    pagos: { C1: pagos1, C2: pagos2 },
  };
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

export const fmtCOP = n =>
  new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(n||0);
export const fmtShort = num => {
  const n = Math.abs(num||0); const s = num < 0 ? "-" : "";
  if (n >= 1000000) return s + "$" + (n/1000000).toFixed(1).replace(".0","") + "M";
  if (n >= 1000)    return s + "$" + (n/1000).toFixed(0) + "k";
  return s + "$" + n;
};
