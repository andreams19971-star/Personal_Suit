// theme.js — Paleta unificada de Mi Suite Personal
// Importar en cada app: import { C, fmtCOP, fmtShort } from "../theme.js"

export const C = {
  bg:         "#09090B",
  surface:    "#111113",
  card:       "#18181B",
  card2:      "#1C1C1F",
  border:     "#27272A",
  borderSub:  "#1C1C1F",
  text:       "#FAFAFA",
  textSub:    "#A1A1AA",
  textMuted:  "#52525B",
  accent:     "#22C55E",
  accentDim:  "#052010",
  accentText: "#4ADE80",
  green:      "#22C55E",
  greenDim:   "#052010",
  red:        "#EF4444",
  redDim:     "#1F0808",
  yellow:     "#EAB308",
  yellowDim:  "#1C1500",
  orange:     "#F97316",
  orangeDim:  "#1C0A02",
  blue:       "#3B82F6",
  blueDim:    "#071228",
  purple:     "#A855F7",
  purpleDim:  "#180A28",
};

// Formato completo COP
export const fmtCOP = v =>
  new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(v||0);

// Formato compacto para espacios pequeños
export const fmtShort = v => {
  const n = Math.abs(v||0);
  const s = v < 0 ? "-" : "";
  if (n >= 1000000) return s + "$" + (n/1000000).toFixed(1).replace(".0","") + "M";
  if (n >= 1000)    return s + "$" + (n/1000).toFixed(0) + "k";
  return s + "$" + n;
};
