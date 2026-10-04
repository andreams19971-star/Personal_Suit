// planner/HabitsView.jsx
import { useState } from "react";
import { C, DAYS, today } from "./shared.js";

function calcStreak(completions) {
  var current = 0;
  for (var i = 0; i < 365; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    if (completions[d.toISOString().slice(0, 10)]) current++;
    else break;
  }
  return current;
}

function calcBestStreak(completions) {
  var dates = Object.keys(completions).filter(function(k){ return completions[k]; }).sort();
  if (!dates.length) return 0;
  var best = 1, cur = 1;
  for (var i = 1; i < dates.length; i++) {
    var prev = new Date(dates[i - 1] + "T12:00");
    var curr = new Date(dates[i] + "T12:00");
    var diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; if (cur > best) best = cur; }
    else cur = 1;
  }
  return best;
}

function calcCompletionRate(completions, days) {
  if (!days) days = 30;
  var done = 0;
  for (var i = 0; i < days; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    if (completions[d.toISOString().slice(0, 10)]) done++;
  }
  return Math.round((done / days) * 100);
}

export function HabitsView({ habits, toggleHabit, deleteHabit }) {
  var todayStr = today();

  var last28 = Array.from({ length: 28 }, function(_, i) {
    var d = new Date(); d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });

  var doneToday = habits.filter(function(h){ return h.completions[todayStr]; }).length;
  var totalStreakDays = habits.reduce(function(s, h){ return s + calcStreak(h.completions); }, 0);
  var overallRate = habits.length
    ? Math.round(habits.reduce(function(s, h){ return s + calcCompletionRate(h.completions); }, 0) / habits.length)
    : 0;

  var motivational = doneToday === habits.length && habits.length > 0
    ? "Dia perfecto!"
    : doneToday === 0
    ? "Empieza el dia con fuerza!"
    : (habits.length - doneToday) + " habito(s) por completar";

  return (
    <div style={{ padding: 14, display: "grid", gap: 14 }} className="fu">

      {/* TOP STATS CARD */}
      <div style={{ background: C.accentDim, border: "1px solid " + C.accent + "44", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.accentText, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>HOY</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: C.text }}>{doneToday}/{habits.length}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>habitos completados</div>
            <div style={{ fontSize: 12, color: C.accentText, fontWeight: 600 }}>{motivational}</div>
          </div>
        </div>
        {habits.length > 0 && (
          <div style={{ height: 6, borderRadius: 3, background: C.border, marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 3, background: C.accent, width: Math.round((doneToday / habits.length) * 100) + "%", transition: "width .4s ease" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{"Rachas: " + totalStreakDays}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>RACHAS TOTALES</div>
          </div>
          <div style={{ flex: 1, background: C.card, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: overallRate >= 70 ? C.accent : overallRate >= 40 ? "#E6A817" : C.red }}>{overallRate + "%"}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>TASA 30 DIAS</div>
          </div>
        </div>
      </div>

      {/* HABIT CARDS */}
      {habits.map(function(h) {
        var streak = calcStreak(h.completions);
        var best = calcBestStreak(h.completions);
        var rate = calcCompletionRate(h.completions);

        return (
          <div key={h.id} style={{ background: C.card, border: "1px solid " + h.color + "33", borderRadius: 16, padding: 16 }}>
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: h.color + "22", border: "1px solid " + h.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{h.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{h.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: h.color, fontWeight: 700 }}>{streak + " dias"}</span>
                  {best > streak && <span style={{ fontSize: 10, color: C.textMuted }}>{"mejor: " + best}</span>}
                  <span style={{ fontSize: 10, color: C.textMuted }}>{rate + "%"}</span>
                </div>
              </div>
              <button
                onClick={function(){ toggleHabit(h.id, todayStr); }}
                style={{ width: 40, height: 40, borderRadius: 11, border: "2px solid " + (h.completions[todayStr] ? h.color : C.border), background: h.completions[todayStr] ? h.color : "transparent", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}
              >
                {h.completions[todayStr] ? "+" : ""}
              </button>
            </div>

            {/* 28-DAY CALENDAR GRID — header labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
              {["L","M","X","J","V","S","D"].map(function(dl){ return (
                <div key={dl} style={{ textAlign: "center", fontSize: 8, color: C.textMuted, fontWeight: 600, paddingBottom: 2 }}>{dl}</div>
              ); })}
            </div>
            {/* dots */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {last28.map(function(date, i) {
                var done = h.completions[date];
                var isToday = date === todayStr;
                return (
                  <div
                    key={i}
                    onClick={function(){ toggleHabit(h.id, date); }}
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

            {/* MINI-STATS */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: streak > 0 ? h.color : C.textMuted }}>{streak + " d"}</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>RACHA</div>
              </div>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.accentText }}>{best + " d"}</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>MEJOR</div>
              </div>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: rate >= 70 ? C.accent : rate >= 40 ? "#E6A817" : C.red }}>{rate + "%"}</div>
                <div style={{ fontSize: 8, color: C.textMuted, fontWeight: 600 }}>30 DIAS</div>
              </div>
            </div>

            <button onClick={function(){ deleteHabit(h.id); }} style={{ marginTop: 10, fontSize: 11, color: C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Eliminar habito</button>
          </div>
        );
      })}

      {habits.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>Sin habitos</div>
          <div style={{ fontWeight: 600 }}>Crea tu primer habito</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Construye una racha dia a dia</div>
        </div>
      )}
    </div>
  );
}
