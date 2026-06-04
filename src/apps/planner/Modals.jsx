// planner/Modals.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function TaskModal({ onClose, onAdd, defaultDate, taskCats=DEFAULT_TASK_CATS }) {
  const [form, setForm] = useState({ title:"", category: taskCats[0]?.id||"other", subcategory:"", priority:"medium", date: defaultDate||td(), note:"", hasDate:!!defaultDate });
  const set = (k,v) => setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cat = taskCats.find(c=>c.id===form.category)||taskCats[0];
  const submitForm = () => {
    if (!form.title) return;
    onAdd({...form, date: form.hasDate ? form.date : ""});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accent)+"55",animation:"su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>Nueva Tarea</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={lbl2}>TÍTULO</div>
            <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="¿Qué hay que hacer?"
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={lbl2}>CATEGORÍA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {taskCats.map(c=>(
                <button key={c.id} onClick={()=>set("category",c.id)}
                  style={{padding:"6px 10px",borderRadius:9,border:"1px solid "+(form.category===c.id?C.accent:C.border),background:form.category===c.id?C.accentDim:"transparent",color:form.category===c.id?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={lbl2}>SUBCATEGORÍA</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>set("subcategory","")} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(!form.subcategory?C.accent:C.border),background:!form.subcategory?C.accentDim:"transparent",color:!form.subcategory?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>Ninguna</button>
                {cat.subs.map(s=>(
                  <button key={s} onClick={()=>set("subcategory",s)}
                    style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(form.subcategory===s?C.accent:C.border),background:form.subcategory===s?C.accentDim:"transparent",color:form.subcategory===s?C.accent:C.textSub,cursor:"pointer",fontSize:11}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={lbl2}>PRIORIDAD</div>
            <div style={{display:"flex",gap:6}}>
              {PRIORITIES.map(p=>(
                <button key={p.id} onClick={()=>set("priority",p.id)}
                  style={{flex:1,padding:"7px",borderRadius:8,border:"1px solid "+(form.priority===p.id?p.color:C.border),background:form.priority===p.id?p.color+"22":"transparent",color:form.priority===p.id?p.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={lbl2}>FECHA</div>
              <button onClick={()=>set("hasDate",!form.hasDate)}
                style={{background:form.hasDate?C.accentDim:"transparent",border:"1px solid "+(form.hasDate?C.accent:C.border),borderRadius:20,padding:"3px 10px",color:form.hasDate?C.accentText:C.textMuted,fontSize:11,cursor:"pointer",fontWeight:600}}>
                {form.hasDate?"Con fecha":"Sin fecha"}
              </button>
            </div>
            {form.hasDate&&(
              <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
                style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
            )}
          </div>
          <div>
            <div style={lbl2}>NOTA</div>
            <textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Descripción, contexto, links..." rows={2}
              style={{width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13,resize:"none"}}/>
          </div>
        </div>
        <button onClick={submitForm}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:form.title?C.accent:C.border,color:form.title?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Crear Tarea
        </button>
      </div>
    </div>
  );
}

export function TaskCatManager({ taskCats, saveTaskCats, onClose }) {
  const [editIdx, setEditIdx] = useState(null);
  const [newCat,  setNewCat]  = useState(null);
  const [editSub, setEditSub] = useState(null);
  const icons = ["💼","🧍","🏥","💰","📋","📦","🎯","🚗","📚","🎮","🏠","✈️","🌿","⚡","🎵"];

  const addCat = (cat) => { saveTaskCats([...taskCats,{...cat,id:"tc"+Date.now(),subs:[]}]); setNewCat(null); };
  const updateCat = (idx,u) => { saveTaskCats(taskCats.map((c,i)=>i===idx?{...c,...u}:c)); setEditIdx(null); };
  const deleteCat = (idx) => saveTaskCats(taskCats.filter((_,i)=>i!==idx));
  const addSub = (idx,sub) => { saveTaskCats(taskCats.map((c,i)=>i!==idx?c:{...c,subs:[...(c.subs||[]),sub]})); setEditSub(null); };
  const delSub = (idx,si)  => saveTaskCats(taskCats.map((c,i)=>i!==idx?c:{...c,subs:c.subs.filter((_,j)=>j!==si)}));

  return (
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+(C.accent)+"55",animation:"su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>⚙ Categorías de tareas</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <button onClick={()=>setNewCat({label:"",icon:"📦"})} style={{width:"100%",background:C.accentDim,border:"1px solid "+(C.accent)+"44",color:C.accent,borderRadius:9,padding:9,fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:10}}>+ Nueva categoría</button>
        {newCat&&(
          <div style={{background:C.card,border:"1px solid "+(C.accent)+"44",borderRadius:12,padding:12,marginBottom:10,display:"grid",gap:8}}>
            <input value={newCat.label} onChange={e=>setNewCat(n=>({...n,label:e.target.value}))} placeholder="Nombre"
              style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.text,fontSize:13}}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {icons.map(ic=><button key={ic} onClick={()=>setNewCat(n=>({...n,icon:ic}))} style={{width:30,height:30,borderRadius:7,border:"1px solid "+(newCat.icon===ic?C.accent:C.border),background:newCat.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:15}}>{ic}</button>)}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>newCat.label&&addCat(newCat)} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"7px",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer"}}>Crear</button>
              <button onClick={()=>setNewCat(null)} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"7px 10px",color:C.textSub,cursor:"pointer",fontSize:12}}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{display:"grid",gap:8}}>
          {taskCats.map((cat,idx)=>(
            <div key={cat.id||idx} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18,flexShrink:0}}>{cat.icon}</span>
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{cat.label}</span>
                <button onClick={()=>setEditIdx(editIdx===idx?null:idx)} style={{background:C.accentDim,color:C.accent,border:"1px solid "+(C.accent)+"33",borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                <button onClick={()=>deleteCat(idx)} style={{background:C.redDim,color:C.red,border:"1px solid "+(C.red)+"33",borderRadius:6,padding:"3px 7px",fontSize:10,fontWeight:700,cursor:"pointer"}}>🗑</button>
              </div>
              {editIdx===idx&&(
                <div style={{padding:"0 12px 10px",borderTop:"1px solid "+(C.border),display:"grid",gap:6}}>
                  <input defaultValue={cat.label} onBlur={e=>updateCat(idx,{label:e.target.value})} style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"6px 9px",color:C.text,fontSize:12,marginTop:8}}/>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {icons.map(ic=><button key={ic} onClick={()=>updateCat(idx,{icon:ic})} style={{width:27,height:27,borderRadius:6,border:"1px solid "+(cat.icon===ic?C.accent:C.border),background:cat.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:13}}>{ic}</button>)}
                  </div>
                </div>
              )}
              <div style={{padding:"0 12px 10px"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                  {(cat.subs||[]).map((s,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"center",gap:2,background:C.bg,border:"1px solid "+(C.border),borderRadius:100,padding:"2px 7px"}}>
                      <span style={{fontSize:10,color:C.textSub}}>{s}</span>
                      <button onClick={()=>delSub(idx,si)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:10,padding:"0 1px"}}>✕</button>
                    </div>
                  ))}
                  <button onClick={()=>setEditSub(editSub?.idx===idx?null:{idx,val:""})}
                    style={{background:"transparent",border:"1px dashed "+(C.border),borderRadius:100,padding:"2px 7px",fontSize:10,color:C.textMuted,cursor:"pointer"}}>+ sub</button>
                </div>
                {editSub?.idx===idx&&(
                  <div style={{display:"flex",gap:5}}>
                    <input value={editSub.val} onChange={e=>setEditSub(s=>({...s,val:e.target.value}))} placeholder="Nueva subcategoría..."
                      onKeyDown={e=>{if(e.key==="Enter"&&editSub.val)addSub(idx,editSub.val);}}
                      style={{flex:1,background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"4px 8px",color:C.text,fontSize:11}}/>
                    <button onClick={()=>{if(editSub.val)addSub(idx,editSub.val);}} style={{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"4px 9px",fontWeight:700,fontSize:11,cursor:"pointer"}}>OK</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const lbl2 = {fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4,textTransform:"uppercase"};

export function HabitModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", icon: "💧", color: C.accent, target: 1, unit: "vez" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Nuevo Hábito" onClose={onClose} accent={C.accent}>
      <MF label="Nombre"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: Tomar agua" style={inp} /></MF>
      <MF label="Ícono">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HABIT_ICONS.map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid "+(form.icon === ic ? C.accent : C.border), background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 18 }}>{ic}</button>)}
        </div>
      </MF>
      <MF label="Meta diaria">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={form.target} onChange={e => set("target", parseInt(e.target.value) || 1)} style={{ ...inp, width: 80 }} />
          <input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="vez/es, vasos..." style={{ ...inp, flex: 1 }} />
        </div>
      </MF>
      <button onClick={() => form.name && onAdd(form)} style={{ ...btn, background: form.name ? C.accent : C.border, color: form.name ? "#000" : C.textMuted }}>Crear Hábito</button>
    </Modal>
  );
}

export function GoalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", icon: "🎯", target: "", current: 0, deadline: "", color: C.accent, category: "personal" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const colors = [C.accent, C.green, C.yellow, C.purple, C.pink, "#F87171"];
  const ok = form.title && form.target && form.deadline;
  return (
    <Modal title="Nueva Meta" onClose={onClose} accent={C.accent}>
      <MF label="Título"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ej: Ahorrar para viaje" style={inp} /></MF>
      <MF label="Ícono & Color">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {["🎯","✈️","📚","⚖️","💰","🏠","🚗","💪","🌎","🎵"].map(ic => <button key={ic} onClick={() => set("icon", ic)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid "+(form.icon === ic ? C.accent : C.border), background: form.icon === ic ? C.accentDim : "transparent", cursor: "pointer", fontSize: 16 }}>{ic}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {colors.map(c => <button key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
        </div>
      </MF>
      <MF label="Meta total"><input type="number" value={form.target} onChange={e => set("target", e.target.value)} placeholder="Ej: 5000000" style={inp} /></MF>
      <MF label="Progreso actual"><input type="number" value={form.current} onChange={e => set("current", e.target.value)} placeholder="0" style={inp} /></MF>
      <MF label="Fecha límite"><input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} style={inp} /></MF>
      <button onClick={() => ok && onAdd({ ...form, target: parseFloat(form.target), current: parseFloat(form.current) || 0 })} style={{ ...btn, background: ok ? C.accent : C.border, color: ok ? "#000" : C.textMuted }}>Crear Meta</button>
    </Modal>
  );
}

export function NoteModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", content: "", color: C.yellow });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const colors = [C.yellow, C.green, C.accent, C.purple, "#F472B6"];
  return (
    <Modal title="Nueva Nota" onClose={onClose} accent={C.yellow}>
      <MF label="Título"><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Título de la nota" style={inp} /></MF>
      <MF label="Contenido"><textarea value={form.content} onChange={e => set("content", e.target.value)} placeholder="Escribe aquí..." rows={4} style={{ ...inp, resize: "none" }} /></MF>
      <MF label="Color">
        <div style={{ display: "flex", gap: 10 }}>
          {colors.map(c => <button key={c} onClick={() => set("color", c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
        </div>
      </MF>
      <button onClick={() => form.title && onAdd(form)} style={{ ...btn, background: form.title ? form.color : C.border, color: form.title ? "#000" : C.textMuted }}>Guardar Nota</button>
    </Modal>
  );
}

export function Modal({ title, onClose, accent, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "16px 16px 32px", maxHeight: "88vh", overflowY: "auto", borderTop: "1px solid "+(accent)+"55", animation: "su .3s ease" }}>
        <div style={{ width: 32, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.card, border: "1px solid "+(C.border), borderRadius: 6, padding: "4px 8px", color: C.text, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>{children}</div>
      </div>
    </div>
  );
}

export function MF({ label, children }) {
  return <div><div style={{ fontSize: 10, color: "#3A4A62", fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>{children}</div>;
}
const inp = {width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13,boxSizing:"border-box"};
const btn = { width: "100%", marginTop: 6, padding: 13, borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" };
