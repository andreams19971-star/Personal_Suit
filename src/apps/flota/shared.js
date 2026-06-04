// flota/shared.js


const ACCOUNTS = [
  {id:"cash",        label:"Efectivo",    icon:"💵"},
  {id:"nequi",       label:"Nequi",       icon:"💜"},
  {id:"bbva",        label:"BBVA",        icon:"🔵"},
  {id:"daviplata",   label:"Daviplata",   icon:"🔴"},
  {id:"bancolombia", label:"Bancolombia", icon:"🟡"},
];

// ─── COLORES ──────────────────────────────────────────────────────────────────

const CAR1 = "#3B82F6";   // azul - diario
const CAR1_DIM = "#071228";
const CAR2 = "#A855F7";   // morado - mensual
const CAR2_DIM = "#180A28";
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
};

const fmt = v => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v||0);
const today  = () => new Date().toISOString().slice(0,10);
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS  = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Carro 1: $70.000 × días laborales (Lun-Sáb)
// Carro 2: $500.000 mensual fijo
const CARRO1_DIARIO  = 70000;
const CARRO2_MENSUAL = 500000;

function getWorkDaysInMonth(year, month) {
  // month: 0-based
  let count = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0) count++; // excluye domingos
  }
  return count;
}

function getWorkDaysPassed(year, month) {
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

function seedData() {
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
