// planner/HabitsView.jsx
import { useState } from "react";
import { C, DAYS, today } from "./shared.js";

function calcStreak(completions) {
  let current = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (completions[d.toISOString().slice(0, 10)]) current++;
    else break;
  }
  return current;
}

function calcBestStreak(completions) {
  const dates = Object.keys(completions).filter(k => completions[k]).sort();
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T12:00");
    const curr = new Date(dates[i] + "T12:00");
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; if (cur > best) best = cur; }
    else cur = 1;
  }
  return best;
}

function calcCompletionRate(completions, days = 30) {
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (completions[d.toISOString().slice(0, 10)]) done++;
  }
  return Math.round((done / days) * 100);
}

export function HabitsView({ habits, toggleHabit, deleteHabit }) {
  const [expanded, setExpanded] = useState(null);
  const todayStr = today();

  // 28-day grid (4 weeks)
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });

  const doneToday = habits.filter(h => h.completions[todayStr]).length;
  const totalStreakDays = habits.reduce((s, h) => s + calcStreak(h.completions), 0);
  const overallRate = habits.length
    ? Math.round(habits.reduce((s, h) => s + calcCompletionRate(h.completions), 0) / habits.length)
    : 0;

  const motivational = doneToday === habits.length && habits.length > 0
    ? "¡Día perfecto! 🎉"
    : doneToday === 0
    ? "¡Empieza el día con fuerza! 💪"
    : `${habits.length - doneToday} hábito${habits.length - doneToday > 1 ? "s" : ""} por completar`;

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">

      {/* TOP STATS CARD */}
      <div style={{ background: "linear-gradient(135deg," + C.accentDim + "," + C.card + ")", border: "1px solid " + C.accent + "44", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>HOY</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: C.text }}>{doneToday}/{habits.length}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>hábitos completados</div>
            <div style={{ fontSize: 12, color: C.accentText, fontWeight: 600 }}>{motivational}</div>
          </div>
        </div>
        {/* progress bar */}
        {habits.length > 0 && (
          <div style={{ height: 6, borderRadius: 3, background: C.border, marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 3, background: C.accent, width: Math.round((doneToday / habits.length) * 100) + "%", transition: "width .4s ease" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>🔥 {totalStreakDays}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>RACHAS TOTALES</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: overallRate >= 70 ? C.accent : overallRate >= 40 ? "#E6A817" : C.red }}>{overallRate}%</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>TASA 30 DÍAS</div>
          </div>
        </div>
      </div>

      {/* HABIT CARDS */}
      {habits.map(h => {
        const streak = calcStreak(h.completions);
        const best = calcBestStreak(h.completions);
        const rate = calcCompletionRate(h.completions);
        const isExpanded = expanded === h.id;

        return (
          <div key={h.id} style={{ background: C.card, border: "1px solid " + h.color + "33", borderRadius: 16, padding: 16 }}>
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: h.color + "22", border: "1px solid " + h.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{h.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: h.color, fontWeight: 700 }}>🔥 {streak} días</span>
                  {best > streak && <span style={{ fontSize: 10, color: C.textMuted }}>· mejor: {best}</span>}
                  <span style={{ fontSize: 10, color: C.textMuted }}>· {rate}%</span>
                </div>
              </div>
              <button
                onClick={() => toggleHabit(h.id, todayStr)}
                style={{ width: 40, height: 40, borderRadius: 11, border: "2px solid " + (h.completions[todayStr] ? h.color : C.border), background: h.completions[todayStr] ? h.color : "transparent", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}
              >
                {h.completions[todayStr] ? "✓" : ""}
              </button>
            </div>

            {/* 28-DAY CALENDAR GRID */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
                {["L","M","X","J","V","S","D"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 8, color: C.textMuted, fontWeight: 600, paddingBottom: 2 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {last28.map((date, i) => {
                  const done = h.completions[date];
                  const isToday = date === todayStr;
                  return (
                    <div
                      key={i}
                      onClick={() => toggleHabit(h.id, date)}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 4,
                        background: done ? h.color : C.border,
                        border: isToday ? "2px solid " + h.color : "2px solid transparent",
                        cursor: "pointer",
                        opacity: done ? 1 : 0.5,
                        transition: "all .1s",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* STREAK MINI-STATS */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: streak > 0 ? h.color : C.textMuted }}>🔥 {streak}</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>RACHA ACTUAL</div>
              </div>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.accentText }}>⭐ {best}</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>MEJOR RACHA</div>
              </div>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: rate >= 70 ? C.accent : rate >= 40 ? "#E6A817" : C.red }}>{rate}%</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>30 DÍAS</div>
              </div>
            </div>

            <button onClick={() => deleteHabit(h.id)} style={{ marginTop: 10, fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>🗑 Eliminar hábito</button>
          </div>
        );
      })}

      {habits.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 600 }}>Sin hábitos aún</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>¡Crea tu primer hábito y construye una racha!</div>
        </div>
      )}
    </div>
  );
}
