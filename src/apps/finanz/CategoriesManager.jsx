// finanz/CategoriesManager.jsx
import { useState } from "react";
import { ACCOUNTS_DEF, C, DEFAULT_CATEGORIES, fmtCOP } from "./shared.js";

export function CategoriesManager({ categories, saveCategories, showToast }) {
  const [type, setType]   = useState("income");
  const [editCat, setEditCat] = useState(null); // {idx, ...cat} or "new"
  const [editSub, setEditSub] = useState(null); // {catIdx, subIdx} or null

  const cats = categories[type];

  const addCategory = (cat) => {
    const updated = { ...categories, [type]: [...cats, { ...cat, id: "cat_"+Date.now(), subs: [] }] };
    saveCategories(updated);
    setEditCat(null);
    showToast("Categoría creada ✓");
  };

  const updateCategory = (idx, updates) => {
    const list = cats.map((c,i) => i===idx ? {...c,...updates} : c);
    saveCategories({ ...categories, [type]: list });
    setEditCat(null);
    showToast("Categoría actualizada ✓");
  };

  const deleteCategory = (idx) => {
    saveCategories({ ...categories, [type]: cats.filter((_,i)=>i!==idx) });
    showToast("Categoría eliminada","err");
  };

  const addSub = (catIdx, sub) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:[...(c.subs||[]), sub]});
    saveCategories({ ...categories, [type]: list });
    setEditSub(null);
  };

  const deleteSub = (catIdx, subIdx) => {
    const list = cats.map((c,i) => i!==catIdx ? c : {...c, subs:c.subs.filter((_,j)=>j!==subIdx)});
    saveCategories({ ...categories, [type]: list });
  };

  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{display:"flex",gap:6}}>
        {[["income","Ingresos"],["expense","Gastos"]].map(([t,l])=>(
          <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(type===t?C.accent:C.border),background:type===t?C.accentDim:"transparent",color:type===t?C.accent:C.textSub,cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
        ))}
      </div>

      <button onClick={()=>setEditCat("new")} style={{background:C.accentDim,border:"1px solid "+(C.accentText)+"44",color:C.accentText,borderRadius:9,padding:"9px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Nueva categoría</button>

      {editCat==="new" && (
        <CatForm onSave={addCategory} onCancel={()=>setEditCat(null)}/>
      )}

      {cats.map((cat,idx)=>(
        <div key={cat.id||idx} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20,flexShrink:0}}>{cat.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700}}>{cat.label}</div>
              <div style={{fontSize:10,color:C.textMuted}}>{(cat.subs||[]).length} subcategorías</div>
            </div>
            <button onClick={()=>setEditCat(editCat===idx?null:idx)} style={{background:C.accentDim,color:C.accentText,border:"1px solid "+(C.accentText)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️</button>
            <button onClick={()=>deleteCategory(idx)} style={{background:C.redDim,color:C.red,border:"1px solid "+(C.red)+"33",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>🗑</button>
          </div>
          {editCat===idx && (
            <div style={{padding:"0 12px 12px",borderTop:"1px solid "+(C.border)}}>
              <CatForm initial={cat} onSave={(u)=>updateCategory(idx,u)} onCancel={()=>setEditCat(null)}/>
            </div>
          )}
          {/* Subcategorías */}
          <div style={{padding:"0 12px 10px"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
              {(cat.subs||[]).map((sub,si)=>(
                <div key={si} style={{display:"flex",alignItems:"center",gap:3,background:C.bg,border:"1px solid "+(C.border),borderRadius:100,padding:"3px 8px"}}>
                  <span style={{fontSize:11,color:C.textSub}}>{sub}</span>
                  <button onClick={()=>deleteSub(idx,si)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:11,lineHeight:1,padding:"0 1px"}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setEditSub(editSub?.catIdx===idx?null:{catIdx:idx,val:""})}
                style={{background:"transparent",border:"1px dashed "+(C.border),borderRadius:100,padding:"3px 8px",fontSize:11,color:C.textMuted,cursor:"pointer"}}>+ sub</button>
            </div>
            {editSub?.catIdx===idx && (
              <div style={{display:"flex",gap:6}}>
                <input value={editSub.val} onChange={e=>setEditSub(s=>({...s,val:e.target.value}))} placeholder="Nueva subcategoría..."
                  onKeyDown={e=>{if(e.key==="Enter"&&editSub.val){addSub(idx,editSub.val);setEditSub(null);}}}
                  style={{flex:1,background:C.bg,border:"1px solid "+(C.border),borderRadius:7,padding:"5px 8px",color:C.text,fontSize:12}}/>
                <button onClick={()=>{if(editSub.val)addSub(idx,editSub.val);setEditSub(null);}}
                  style={{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"5px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ label: initial?.label||"", icon: initial?.icon||"📦" });
  return (
    <div style={{display:"grid",gap:8,paddingTop:10}}>
      <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="Nombre de la categoría"
        style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {CAT_ICONS.map(ic=>(
          <button key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))}
            style={{width:32,height:32,borderRadius:7,border:"1px solid "+(form.icon===ic?C.accent:C.border),background:form.icon===ic?C.accentDim:"transparent",cursor:"pointer",fontSize:16}}>
            {ic}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>form.label&&onSave(form)} style={{flex:1,background:C.accent,border:"none",borderRadius:8,padding:"8px",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          {initial?"Guardar":"Crear"}
        </button>
        <button onClick={onCancel} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.textSub,cursor:"pointer",fontSize:12}}>Cancelar</button>
      </div>
    </div>
  );
}
