// supabase/functions/telegram-bot/index.ts
// Bot de Telegram para registrar transacciones en FinanzApp
// Formatos soportados:
//   cafe 5000              → gasto, cuenta default
//   +salario 3500000       → ingreso, cuenta default
//   gasolina 80000 efectivo → gasto, cuenta "efectivo"
//   almuerzo 15000 efectivo comida → gasto, cuenta + categoría

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Telegram helper ────────────────────────────────────────────────────────
async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

// ── Parser de transacciones ────────────────────────────────────────────────
interface Account { id: string; label: string; icon: string; }

interface ParsedTx {
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  accountId: string | null;
  accountLabel: string;
}

function parseTransaction(text: string, accounts: Account[]): ParsedTx | null {
  const trimmed = text.trim();
  const isIncome = trimmed.startsWith("+");
  const clean = (isIncome ? trimmed.slice(1) : trimmed).trim();

  // Split por espacios
  const parts = clean.split(/\s+/);

  // Buscar el número (monto) — puede tener puntos o comas como separador de miles
  let amountIdx = -1;
  let amount = 0;
  for (let i = 0; i < parts.length; i++) {
    const cleaned = parts[i].replace(/[.,]/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      amountIdx = i;
      amount = num;
      break;
    }
  }

  if (amountIdx < 1 || amount === 0) return null; // necesitamos al menos 1 palabra antes del monto

  const description = parts.slice(0, amountIdx).join(" ");
  const rest = parts.slice(amountIdx + 1); // palabras después del monto

  // Intentar hacer match de cuenta en las palabras restantes
  let matchedAccountId: string | null = null;
  let matchedAccountLabel = "";
  let restAfterAccount = [...rest];

  for (let i = 0; i < rest.length; i++) {
    const word = rest[i].toLowerCase();
    const found = accounts.find(
      (a) =>
        a.label.toLowerCase().includes(word) ||
        word.includes(a.label.toLowerCase().split(" ")[0].toLowerCase())
    );
    if (found) {
      matchedAccountId = found.id;
      matchedAccountLabel = found.label;
      restAfterAccount = [...rest.slice(0, i), ...rest.slice(i + 1)];
      break;
    }
  }

  // Lo que queda = categoría
  const category = restAfterAccount.join(" ") || (isIncome ? "Ingresos" : "Otros");

  return {
    type: isIncome ? "income" : "expense",
    amount,
    description,
    category,
    accountId: matchedAccountId,
    accountLabel: matchedAccountLabel,
  };
}

// ── Handler principal ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("OK");
  }

  const message = body?.message;
  if (!message?.text) return new Response("OK");

  const chatId: number = message.chat.id;
  const text: string = message.text.trim();

  // ── /start ─────────────────────────────────────────────────────────────
  if (text === "/start" || text.startsWith("/start ")) {
    await sendMessage(
      chatId,
      "👋 <b>Hola! Soy tu bot de FinanzApp.</b>\n\n" +
      "Para vincularme con tu cuenta:\n\n" +
      "1. Abre FinanzApp\n" +
      "2. Toca ⚙️ (Configuración)\n" +
      "3. Ve a la pestaña <b>Telegram</b>\n" +
      "4. Pega tu Chat ID:\n\n" +
      "<code>" + chatId + "</code>\n\n" +
      "5. Toca <b>Vincular</b>\n\n" +
      "Una vez vinculado puedes enviarme:\n" +
      "<code>cafe 5000</code> — gasto\n" +
      "<code>+salario 3500000</code> — ingreso\n\n" +
      "/help para más info"
    );
    return new Response("OK");
  }

  // ── /help ──────────────────────────────────────────────────────────────
  if (text === "/help") {
    await sendMessage(
      chatId,
      "📝 <b>Formatos de registro:</b>\n\n" +
      "<b>Gasto:</b>\n<code>descripcion monto</code>\n" +
      "Ej: <code>cafe 5000</code>\n\n" +
      "<b>Ingreso (prefijo +):</b>\n<code>+descripcion monto</code>\n" +
      "Ej: <code>+salario 3500000</code>\n\n" +
      "<b>Con cuenta:</b>\n<code>descripcion monto cuenta</code>\n" +
      "Ej: <code>gasolina 80000 efectivo</code>\n\n" +
      "<b>Con categoría:</b>\n<code>descripcion monto cuenta categoria</code>\n" +
      "Ej: <code>almuerzo 15000 nequi comida</code>\n\n" +
      "<b>Comandos:</b>\n" +
      "/cuentas — ver tus cuentas\n" +
      "/mes — resumen del mes\n" +
      "/help — esta ayuda"
    );
    return new Response("OK");
  }

  // ── Verificar vinculación ──────────────────────────────────────────────
  const { data: configRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "telegram_config")
    .maybeSingle();

  const config = configRow?.value as { chat_id?: string; user_id?: string } | null;

  if (!config || String(config.chat_id) !== String(chatId)) {
    await sendMessage(
      chatId,
      "⚠️ Chat no vinculado aún.\n\n" +
      "Abre FinanzApp → ⚙️ → pestaña <b>Telegram</b>\n" +
      "y pega tu Chat ID: <code>" + chatId + "</code>"
    );
    return new Response("OK");
  }

  const userId = config.user_id!;

  // ── Fetch cuentas del usuario ─────────────────────────────────────────
  const { data: accountsRaw } = await supabase
    .from("account_balances")
    .select("id, label, icon")
    .eq("user_id", userId);

  const accounts: Account[] = accountsRaw || [];

  // ── /cuentas ──────────────────────────────────────────────────────────
  if (text === "/cuentas") {
    const list = accounts.map((a) => (a.icon || "💳") + " " + a.label).join("\n");
    await sendMessage(
      chatId,
      "💳 <b>Tus cuentas:</b>\n\n" + (list || "Sin cuentas registradas")
    );
    return new Response("OK");
  }

  // ── /mes ──────────────────────────────────────────────────────────────
  if (text === "/mes") {
    const now = new Date();
    const ym = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const { data: txs } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("date", ym + "-01")
      .lte("date", ym + "-31");

    let income = 0;
    let expense = 0;
    (txs || []).forEach((t: any) => {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    });

    const fmt = (n: number) =>
      "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

    await sendMessage(
      chatId,
      "📊 <b>Resumen " + ym + ":</b>\n\n" +
      "💚 Ingresos: " + fmt(income) + "\n" +
      "🔴 Gastos: " + fmt(expense) + "\n" +
      "─────────────\n" +
      (income - expense >= 0 ? "✅" : "⚠️") + " Balance: " + fmt(income - expense)
    );
    return new Response("OK");
  }

  // ── Parsear y guardar transacción ─────────────────────────────────────
  const parsed = parseTransaction(text, accounts);

  if (!parsed) {
    await sendMessage(
      chatId,
      "❓ No entendí ese mensaje.\n\n" +
      "Formato: <code>descripcion monto</code>\n" +
      "Ej: <code>cafe 5000</code>\n\n" +
      "/help para ver todos los formatos"
    );
    return new Response("OK");
  }

  // Cuenta default: la primera disponible si no hizo match
  const finalAccountLabel =
    parsed.accountLabel || (accounts.length > 0 ? accounts[0].label : "sin cuenta");

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description,
    category: parsed.category,
    account: finalAccountLabel,
    date: today,
    note: "via Telegram",
  });

  if (error) {
    await sendMessage(chatId, "❌ Error al guardar: " + error.message);
    return new Response("OK");
  }

  const emoji = parsed.type === "income" ? "💚" : "🔴";
  const sign = parsed.type === "income" ? "+" : "-";
  const fmt = (n: number) =>
    "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

  await sendMessage(
    chatId,
    emoji + " <b>" + parsed.description + "</b>\n" +
    sign + fmt(parsed.amount) + "\n" +
    "📁 " + parsed.category + "   💳 " + finalAccountLabel + "\n" +
    "📅 " + today + "   <i>via Telegram</i>"
  );

  return new Response("OK");
});
