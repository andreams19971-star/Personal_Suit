// planner/EditTaskModal.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function EditTaskModal({task, onClose, onSave, taskCats}) {
  const [form, setForm] = useState({
    title:       task.title,
    category:    task.category,
    subcategory: task.subcategory||"",
    priority:    task.priority||"medium",
    date:        task.date,
    note:        task.note||"",
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v,...(k==="category"?{subcategory:""}:{})}));
  const cat = taskCats?.find(c=>c.id===form.category);
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>✏️ Editar tarea</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TÍTULO</div>
            <input value={form.title} onChange={e=>set("title",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:14}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>CATEGORÍA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {(taskCats||[]).map(c=>(
                <button key={c.id} onClick={()=>set("category",c.id)}
                  style={{padding:"6px 10px",borderRadius:9,border:"1px solid "+(form.category===c.id?C.accent:C.border),background:form.category===c.id?C.accentDim:"transparent",color:form.category===c.id?C.accent:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {cat?.subs?.length>0&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>SUBCATEGORÍA</div>
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
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>PRIORIDAD</div>
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
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>FECHA</div>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)}
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>NOTA</div>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Opcional..."
              style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13}}/>
          </div>
        </div>
        <button onClick={()=>form.title&&onSave(task.id,form)}
          style={{width:"100%",marginTop:14,padding:13,borderRadius:12,border:"none",background:form.title?C.accent:C.border,color:form.title?"#000":C.textMuted,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
