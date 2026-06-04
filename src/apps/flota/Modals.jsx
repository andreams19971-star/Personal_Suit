// flota/Modals.jsx
import { useState, useEffect } from "react";
import { C, CAR1, CAR2, today, fmtCOP, fmtShort, ACCOUNTS, MONTHS } from "./shared.js";

export function EditPagoModal({carId, pago, accounts, onClose, onSave}) {
  const [form, setForm] = useState({
    fecha:   pago?.fecha   || td(),
    monto:   pago?.monto   || 0,
    nota:    pago?.nota    || "",
    account: pago?.account || "cash",
  });
  // Guard DESPUÉS de hooks
  if (!pago) return null;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <ModalWrap title="Editar Registro" onClose={onClose} color={CAR1}>
      <div>
        <div style={lbl}>MONTO</div>
        <input type="number" value={form.monto} onChange={e=>set("monto",parseFloat(e.target.value)||0)}
          style={{...inp, fontSize:22, fontWeight:900, color:CAR1}}/>
      </div>
      <div>
        <div style={lbl}>FECHA</div>
        <input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} style={inp}/>
      </div>
      <div>
        <div style={lbl}>CUENTA</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(accounts||[]).map(a=>(
            <button key={a.id} onClick={()=>set("account",a.id)}
              style={{flex:"1 1 auto",padding:"8px 4px",borderRadius:9,border:"1px solid "+(form.account===a.id?CAR1:C.border),background:form.account===a.id?CAR1_DIM:"transparent",color:form.account===a.id?CAR1:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center"}}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={lbl}>NOTA</div>
        <input value={form.nota} onChange={e=>set("nota",e.target.value)} placeholder="Opcional..."
          style={inp}/>
      </div>
      <button onClick={()=>onSave(pago.id, form)}
        style={{...btn, background:CAR1, color:"#fff"}}>
        Guardar cambios
      </button>
    </ModalWrap>
  );
}

export function GastoModal({carroId,carros,onClose,onAdd,accounts}) {
  const carro = carros.find(c=>c.id===carroId);
  const [form,setForm] = useState({fecha:td(),categoria:"Gasolina",monto:"",nota:"",account:"cash"});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const cats = ["Gasolina","Aceite","Llantas","SOAT","Revisión técnica","Lavado","Mantenimiento","Repuestos","Seguro","Parqueadero","Otro"];
  return (
    <ModalWrap title={"Gasto — "+(carro?.nombre)} onClose={onClose} color={C.red}>
      <div style={{background:C.redDim,border:"1px solid "+(C.red)+"33",borderRadius:12,padding:14}}>
        <div style={{fontSize:11,color:C.textMuted,marginBottom:3}}>MONTO</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:18,color:C.textMuted}}>$</span>
          <input type="number" value={form.monto} onChange={e=>set("monto",e.target.value)} placeholder="0"
            style={{flex:1,background:"transparent",border:"none",fontSize:24,fontWeight:900,color:C.red}}/>
        </div>
      </div>
      <MF label="Categoría">
        <select value={form.categoria} onChange={e=>set("categoria",e.target.value)} style={inp}>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
      </MF>
      <MF label="Cuenta">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(accounts||[]).map(a=>(
            <button key={a.id} onClick={()=>set("account",a.id)}
              style={{flex:"1 1 auto",padding:"8px 4px",borderRadius:9,border:"1px solid "+(form.account===a.id?C.red:C.border),background:form.account===a.id?C.redDim:"transparent",color:form.account===a.id?C.red:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center"}}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </MF>
      <MF label="Fecha"><input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} style={inp}/></MF>
      <MF label="Nota (opcional)"><input value={form.nota} onChange={e=>set("nota",e.target.value)} placeholder="Detalles..." style={inp}/></MF>
      <button onClick={()=>form.monto&&onAdd(carroId,{...form,monto:parseFloat(form.monto)})}
        style={{...btn,background:form.monto?C.red:C.border,color:form.monto?"#fff":C.textMuted}}>
        Registrar Gasto
      </button>
    </ModalWrap>
  );
}

export function DiaModal({carroId, onClose, onAdd, cars, accounts}) {
  const carro = cars?.find(c=>c.id===carroId);
  const [fecha,   setFecha]   = useState(td());
  const [account, setAccount] = useState("cash");
  const [monto,   setMonto]   = useState(String(carro?.valor_diario || CARRO1_DIARIO));
  const color = carro?.tipo === "mensual" ? CAR2 : CAR1;
  const colorDim = carro?.tipo === "mensual" ? CAR2_DIM : CAR1_DIM;
  return (
    <ModalWrap title="Agregar Día de Trabajo" onClose={onClose} color={color}>
      <div>
        <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>VALOR DEL DÍA</div>
        <div style={{background:colorDim,border:"1px solid "+color+"33",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:C.textMuted,fontSize:16,flexShrink:0}}>$</span>
          <input type="number" value={monto} onChange={e=>setMonto(e.target.value)}
            style={{flex:1,background:"transparent",border:"none",fontSize:22,fontWeight:900,color}}/>
        </div>
        <div style={{fontSize:10,color:C.textMuted,marginTop:4}}>
          Valor default del carro: {fmt(carro?.valor_diario || CARRO1_DIARIO)}
        </div>
      </div>
      <MF label="Fecha del día trabajado">
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/>
      </MF>
      <MF label="Cuenta donde recibes el pago">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(accounts||[]).map(a=>(
            <button key={a.id} onClick={()=>setAccount(a.id)}
              style={{flex:"1 1 auto",padding:"8px 4px",borderRadius:9,border:"1px solid "+(account===a.id?color:C.border),background:account===a.id?colorDim:"transparent",color:account===a.id?color:C.textSub,cursor:"pointer",fontSize:11,fontWeight:600,textAlign:"center"}}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </MF>
      <button onClick={()=>parseFloat(monto)>0&&onAdd(carroId, fecha, account, parseFloat(monto))}
        style={{...btn,background:parseFloat(monto)>0?color:C.border,color:parseFloat(monto)>0?"#fff":C.textMuted}}>
        Agregar Día
      </button>
    </ModalWrap>
  );
}

export function CarroConfig({carro, onSave, onDelete}) {
  const [form, setForm] = useState({
    nombre:       carro.nombre       || '',
    placa:        carro.placa        || '',
    modelo:       carro.modelo       || '',
    conductor:    carro.conductor    || '',
    tipo:         carro.tipo         || 'diario',
    valor_diario: carro.valor_diario || 70000,
    valor_mensual:carro.valor_mensual|| 500000,
  });
  const [open, setOpen] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={{background:C.card,border:"1px solid "+(carro.color)+"44",borderRadius:14,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:C.text}}>
        <span style={{fontSize:22}}>{carro.icon}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:700}}>{carro.nombre}</div>
          <div style={{fontSize:11,color:C.textMuted}}>{carro.placa} · {carro.modelo}</div>
        </div>
        <span style={{color:carro.color,fontSize:16}}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{padding:"0 14px 14px",display:"grid",gap:10,borderTop:"1px solid "+(C.border)}}>
          <div style={{height:10}}/>
          {[["Nombre",   "nombre",    "text",   "Ej: Mi Carro"],
            ["Placa",    "placa",     "text",   "Ej: ABC-123"],
            ["Modelo",   "modelo",    "text",   "Ej: Chevrolet Aveo 2019"],
            ["Conductor","conductor", "text",   "Nombre del conductor"],
          ].map(([label,key,type,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>TIPO DE COBRO</div>
            <div style={{display:"flex",gap:8}}>
              {[["diario","Diario (por día)"],["mensual","Mensual (fijo)"]].map(([v,l])=>(
                <button key={v} onClick={()=>set("tipo",v)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.tipo===v?carro.color:C.border),background:form.tipo===v?carro.color+"22":"transparent",color:form.tipo===v?carro.color:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
              ))}
            </div>
          </div>
          {form.tipo==="diario" && (
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR POR DÍA (COP)</div>
              <input type="number" value={form.valor_diario} onChange={e=>set("valor_diario",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          )}
          {form.tipo==="mensual" && (
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR MENSUAL (COP)</div>
              <input type="number" value={form.valor_mensual} onChange={e=>set("valor_mensual",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.bg,border:"1px solid "+(C.border),borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13}}/>
            </div>
          )}
          <button onClick={()=>{onSave(form);setOpen(false);}}
            style={{background:carro.color,color:"#fff",border:"none",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>
            Guardar cambios
          </button>
          {onDelete&&(
            <button onClick={()=>onDelete(carro.id)}
              style={{background:C.redDim,color:C.red,border:"1px solid "+C.red+"33",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
              🗑 Eliminar este carro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AddCarModal({onClose, onSave}) {
  const [form, setForm] = useState({
    nombre:"", placa:"", conductor:"", modelo:"",
    tipo:"diario", valor_diario:70000, valor_mensual:500000,
    color:"#3B82F6", icon:"🚗",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const ok=form.nombre.trim().length>0;
  return(
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 36px",maxHeight:"90vh",overflowY:"auto",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800}}>+ Nuevo Carro</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>
          {[["Nombre del carro","nombre","text","Ej: Mi Carro"],
            ["Placa","placa","text","ABC-123"],
            ["Conductor","conductor","text","Nombre"],
            ["Modelo","modelo","text","Chevrolet Sail 2020"],
          ].map(([l,k,t,ph])=>(
            <div key={k}>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{l.toUpperCase()}</div>
              <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
                style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:14}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>TIPO DE COBRO</div>
            <div style={{display:"flex",gap:8}}>
              {[["diario","Por día"],["mensual","Mensualidad"]].map(([v,l])=>(
                <button key={v} onClick={()=>set("tipo",v)}
                  style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.tipo===v?C.accent:C.border),background:form.tipo===v?C.accentDim:"transparent",color:form.tipo===v?C.accentText:C.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
              ))}
            </div>
          </div>
          {form.tipo==="diario"&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR POR DÍA (COP)</div>
              <input type="number" value={form.valor_diario} onChange={e=>set("valor_diario",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:14}}/>
            </div>
          )}
          {form.tipo==="mensual"&&(
            <div>
              <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>VALOR MENSUAL (COP)</div>
              <input type="number" value={form.valor_mensual} onChange={e=>set("valor_mensual",parseFloat(e.target.value)||0)}
                style={{width:"100%",background:C.card,border:"1px solid "+C.border,borderRadius:9,padding:"9px 11px",color:C.text,fontSize:14}}/>
            </div>
          )}
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>ÍCONO</div>
            <div style={{display:"flex",gap:8}}>
              {["🚗","🚙","🚕","🚐","🏎️"].map(ic=>(
                <button key={ic} onClick={()=>set("icon",ic)}
                  style={{width:40,height:40,borderRadius:10,border:"1px solid "+(form.icon===ic?C.accent:C.border),background:form.icon===ic?C.accentDim:"transparent",fontSize:20,cursor:"pointer"}}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={()=>ok&&onSave(form)}
          style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"none",background:ok?C.accent:C.border,color:ok?"#000":C.textMuted,fontWeight:700,fontSize:15,cursor:"pointer"}}>
          Crear Carro
        </button>
      </div>
    </div>
  );
}

export function ModalWrap({title,onClose,color,children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"16px 16px 32px",maxHeight:"88vh",overflowY:"auto",borderTop:"1px solid "+(color)+"55",animation:"su .3s ease"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800}}>{title}</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+(C.border),borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10}}>{children}</div>
      </div>
    </div>
  );
}

export function MF({label,children}){return(<div><div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4}}>{label.toUpperCase()}</div>{children}</div>);}
const lbl = {fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:4,textTransform:"uppercase"};
const inp = {width:"100%",background:C.card,border:"1px solid "+(C.border),borderRadius:9,padding:"9px 11px",color:C.text,fontSize:13,boxSizing:"border-box"};
