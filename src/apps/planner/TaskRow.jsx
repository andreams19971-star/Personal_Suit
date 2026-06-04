// planner/TaskRow.jsx
import { useState, useEffect } from "react";
import { C, today } from "./shared.js";

export function TaskRow({ task, onToggle, onSetStatus, onDelete, onEdit, taskCats, muted, accent }) {
  const [expanded, setExpanded] = useState(false);
  const cat    = taskCats?.find(c=>c.id===task.category)||{icon:"📦",label:task.category||"Sin categoría"};
  const pr     = PRIORITIES.find(p=>p.id===task.priority)||PRIORITIES[1];
  const st     = TASK_STATUS[task.status||"pending"] || TASK_STATUS.pending;
  const color  = accent || pr.color;
  const isArchived = task.status === "archived";
  return (
    <div style={{background:C.card,border:"1px solid "+(isArchived?C.border:task.status==="done"?C.border:color+"25"),borderRadius:12,overflow:"hidden",opacity:muted?0.5:1}}>
      {/* MAIN ROW — click to expand */}
      <button onClick={()=>setExpanded(e=>!e)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"10px 12px",display:"flex",alignItems:"center",gap:8,color:C.text,textAlign:"left"}}>
        {/* Status pill */}
        <div onClick={e=>{e.stopPropagation();}} style={{flexShrink:0}}>
          <button onClick={e=>{e.stopPropagation();setExpanded(true);}}
            style={{padding:"3px 7px",borderRadius:100,border:"1px solid "+st.color+"55",background:st.bg,color:st.color,fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            {st.icon}
          </button>
        </div>
        <span style={{fontSize:15,flexShrink:0}}>{cat.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,textDecoration:isArchived||task.status==="done"?"line-through":"none",color:isArchived||task.status==="done"?C.textMuted:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
          <div style={{fontSize:10,color:C.textMuted,marginTop:1}}>
            {cat.label}{task.subcategory?" · "+task.subcategory:""}
            {task.date?" · "+task.date:" · Sin fecha"}
          </div>
        </div>
        <span style={{color:C.textMuted,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </button>

      {/* EXPANDED INFO */}
      {expanded&&(
        <div style={{padding:"0 12px 12px",borderTop:"1px solid "+C.border}}>
          <div style={{paddingTop:10,display:"grid",gap:8}}>
            {/* Status selector */}
            <div>
              <div style={{fontSize:9,color:C.textMuted,fontWeight:700,marginBottom:5}}>CAMBIAR ESTADO</div>
              <div style={{display:"flex",gap:5}}>
                {Object.entries(TASK_STATUS).map(([key,s])=>(
                  <button key={key} onClick={()=>onSetStatus&&onSetStatus(task.id,key)}
                    style={{flex:1,padding:"5px 2px",borderRadius:7,border:"1px solid "+(task.status===key?s.color:C.border),background:task.status===key?s.bg:"transparent",color:task.status===key?s.color:C.textMuted,cursor:"pointer",fontSize:9,fontWeight:600,textAlign:"center"}}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            {/* Full info */}
            {task.note&&(
              <div style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.textMuted,fontWeight:700,marginBottom:3}}>NOTA</div>
                <div style={{fontSize:12,color:C.textSub,lineHeight:1.5}}>{task.note}</div>
              </div>
            )}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <div style={{background:C.bg,borderRadius:8,padding:"5px 10px",flex:1}}>
                <div style={{fontSize:9,color:C.textMuted,fontWeight:700}}>PRIORIDAD</div>
                <div style={{fontSize:11,color:pr.color,fontWeight:600,marginTop:2}}>{pr.label}</div>
              </div>
              {task.date&&(
                <div style={{background:C.bg,borderRadius:8,padding:"5px 10px",flex:1}}>
                  <div style={{fontSize:9,color:C.textMuted,fontWeight:700}}>FECHA</div>
                  <div style={{fontSize:11,color:C.textSub,fontWeight:600,marginTop:2}}>{task.date}</div>
                </div>
              )}
            </div>
            {/* Actions */}
            <div style={{display:"flex",gap:6}}>
              {onEdit&&(
                <button onClick={()=>onEdit(task)} style={{flex:1,padding:"7px",borderRadius:8,background:C.accentDim,border:"1px solid "+C.accent+"44",color:C.accentText,cursor:"pointer",fontSize:11,fontWeight:600}}>
                  ✏️ Editar
                </button>
              )}
              {task.status==="done"&&onSetStatus&&(
                <button onClick={()=>onSetStatus(task.id,"archived")}
                  style={{flex:1,padding:"7px",borderRadius:8,background:C.card,border:"1px solid "+C.border,color:C.textMuted,cursor:"pointer",fontSize:11,fontWeight:600}}>
                  📦 Archivar
                </button>
              )}
              {onDelete&&(
                <button onClick={()=>onDelete(task.id)} style={{padding:"7px 10px",borderRadius:8,background:C.redDim,border:"1px solid "+C.red+"33",color:C.red,cursor:"pointer",fontSize:11,fontWeight:600}}>
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
