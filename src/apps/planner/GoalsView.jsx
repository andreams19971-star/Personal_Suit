// planner/GoalsView.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function GoalsView({ goals, updateGoalProgress, deleteGoal }) {
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">
      {goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const daysLeft = Math.max(0, Math.round((new Date(g.deadline) - new Date()) / 86400000));
        const isEditing = editId === g.id;
        return (
          <div key={g.id} style={{ background: C.card, border: "1px solid "+(g.color)+"33", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: g.color + "22", border: "1px solid "+(g.color)+"44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{daysLeft} días restantes · vence {new Date(g.deadline + "T12:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: g.color }}>{pct}%</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>completado</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: C.textMuted }}>Progreso actual</span>
              <span style={{ fontWeight: 700 }}>{g.current} / {g.target}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: C.border, marginBottom: 12 }}>
              <div style={{ height: "100%", borderRadius: 5, background: g.color, width: (pct)+"%", transition: "width 1s ease" }} />
            </div>

            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} placeholder="Nuevo valor actual" style={{ flex: 1, background: C.bg, border: "1px solid "+(C.border), borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13 }} />
                <button onClick={() => { updateGoalProgress(g.id, parseFloat(editVal) || 0); setEditId(null); }} style={{ background: g.color, color: "#000", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>OK</button>
                <button onClick={() => setEditId(null)} style={{ background: C.border, color: C.text, border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(g.id); setEditVal(g.current.toString()); }} style={{ flex: 1, background: g.color + "22", border: "1px solid "+(g.color)+"44", color: g.color, borderRadius: 8, padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>✏️ Actualizar progreso</button>
                <button onClick={() => deleteGoal(g.id)} style={{ background: C.redDim, border: "1px solid "+(C.red)+"33", color: C.red, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>🗑</button>
              </div>
            )}
          </div>
        );
      })}
      {goals.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin metas. ¡Define tu primer objetivo!</div>}
    </div>
  );
}
