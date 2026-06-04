// planner/HabitsView.jsx
import { useState, useEffect } from "react";
import { C, DAYS, today } from "./shared.js";

export function HabitsView({ habits, toggleHabit, deleteHabit }) {
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      <div style={{ background: "linear-gradient(135deg,"+(C.accentDim)+","+(C.card)+")", border: "1px solid "+(C.accent)+"33", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 700, marginBottom: 4 }}>RACHA TOTAL HOY</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>{habits.filter(h => h.completions[today()]).length}/{habits.length} hábitos</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>completados hoy</div>
      </div>

      {habits.map(h => {
        const streak = (() => { let s = 0; for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.completions[d.toISOString().slice(0,10)]) s++; else break; } return s; })();
        return (
          <div key={h.id} style={{ background: C.card, border: "1px solid "+(h.color)+"33", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: h.color + "22", border: "1px solid "+(h.color)+"44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: h.color, fontWeight: 600 }}>🔥 {streak} días seguidos</div>
              </div>
              <button onClick={() => toggleHabit(h.id, today())} style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid "+(h.completions[today()] ? h.color : C.border), background: h.completions[today()] ? h.color : "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {h.completions[today()] ? "✓" : ""}
              </button>
            </div>
            {/* LAST 7 DAYS */}
            <div style={{ display: "flex", gap: 4 }}>
              {last7.map((date, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 6, background: h.completions[date] ? h.color : C.border, cursor: "pointer" }} onClick={() => toggleHabit(h.id, date)} />
                  <span style={{ fontSize: 8, color: C.textMuted }}>{DAYS[new Date(date + "T12:00").getDay()][0]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => deleteHabit(h.id)} style={{ marginTop: 10, fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>🗑 Eliminar hábito</button>
          </div>
        );
      })}
      {habits.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin hábitos. ¡Crea tu primer hábito!</div>}
    </div>
  );
}
