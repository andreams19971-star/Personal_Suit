// planner/NotesView.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function NotesView({ notes, deleteNote }) {
  const colors = [C.yellow, C.green, C.accent, C.purple, C.pink];
  return (
    <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="fu">
      {notes.map(n => (
        <div key={n.id} style={{ background: n.color + "15", border: "1px solid "+(n.color)+"33", borderRadius: 14, padding: 14, position: "relative" }}>
          <button onClick={() => deleteNote(n.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, opacity: .6 }}>✕</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: n.color, marginBottom: 6, paddingRight: 20 }}>{n.title}</div>
          <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{n.content}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 10 }}>{n.date}</div>
        </div>
      ))}
      {notes.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 32, color: C.textMuted }}>📭 Sin notas</div>}
    </div>
  );
}
