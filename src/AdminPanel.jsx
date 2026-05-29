import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = {
  bg:"#09090B", surface:"#111113", card:"#18181B", card2:"#1C1C1F",
  border:"#27272A", borderSub:"#1C1C1F",
  text:"#FAFAFA", textSub:"#A1A1AA", textMuted:"#52525B",
  accent:"#22C55E", accentDim:"#052010", accentText:"#4ADE80",
  red:"#EF4444", redDim:"#1F0808",
  yellow:"#EAB308", yellowDim:"#1C1500",
  blue:"#3B82F6", blueDim:"#071228",
  purple:"#A855F7", purpleDim:"#180A28",
};

const ALL_APPS = [
  { id:"finanz",      label:"Finanzas",     icon:"$",  color:C.accent  },
  { id:"planner",     label:"Planner",      icon:"▢",  color:C.blue    },
  { id:"flota",       label:"FlotaTracker", icon:"◎",  color:C.purple  },
  { id:"apartamento", label:"Apartamento",  icon:"⌂",  color:C.yellow  },
];

const inp = {
  width:"100%", background:C.card, border:"1px solid "+C.border,
  borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14,
  boxSizing:"border-box",
};

export default function AdminPanel({ currentUser, onClose }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [toast,      setToast]      = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setUsers(data || []);
    setLoading(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),2500); }

  async function updateProfile(id, updates) {
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (!error) { showToast("Perfil actualizado ✓"); await loadUsers(); }
    else showToast("Error al actualizar");
  }

  async function toggleApp(user, appId) {
    const current = user.allowed_apps || [];
    const next    = current.includes(appId)
      ? current.filter(a=>a!==appId)
      : [...current, appId];
    await updateProfile(user.id, { allowed_apps: next });
  }

  // ── CREAR USUARIO (usa Admin API via Edge Function o invita por email) ──
  async function inviteUser(email, name) {
    // Supabase no expone createUser en el cliente normal sin service_role
    // Usamos signUp + marcamos pending — el usuario confirmará por email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { name }
    }).catch(() => ({ data: null, error: { message: "Necesita Service Role Key" } }));

    if (error) {
      // Fallback: crear con contraseña temporal
      showToast("Usa el dashboard de Supabase para crear usuarios");
      return false;
    }
    showToast("Invitación enviada a "+email+" ✓");
    await loadUsers();
    return true;
  }

  const colors = [C.accent,C.blue,C.purple,C.yellow,C.red,"#F97316","#06B6D4"];

  return (
    <div style={{
      position:"fixed",inset:0,background:C.bg,zIndex:300,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      color:C.text,display:"flex",flexDirection:"column",
    }}>
      {/* TopBar */}
      <div style={{
        background:C.surface,borderBottom:"1px solid "+C.border,
        paddingTop:"max(14px,calc(env(safe-area-inset-top)+8px))",
        paddingBottom:"12px",paddingLeft:"20px",paddingRight:"20px",
        display:"flex",alignItems:"center",gap:10,flexShrink:0,
      }}>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:500,padding:0}}>← Volver</button>
        <div style={{fontSize:17,fontWeight:600,flex:1,letterSpacing:-0.3}}>Panel de administración</div>
        <button onClick={()=>setShowCreate(true)} style={{background:C.accent,border:"none",borderRadius:8,padding:"7px 12px",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Usuario</button>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",paddingBottom:40}}>
        {loading?(
          <div style={{textAlign:"center",padding:40,color:C.textMuted}}>Cargando usuarios...</div>
        ):(
          <div style={{display:"grid",gap:12}}>
            {users.map(user=>(
              <div key={user.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:14,overflow:"hidden"}}>
                {/* Header del usuario */}
                <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{
                    width:36,height:36,borderRadius:10,
                    background:user.avatar_color+"22",border:"1px solid "+user.avatar_color+"44",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,fontWeight:800,color:user.avatar_color,flexShrink:0,
                  }}>
                    {(user.name||user.email||"?")[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {user.name||"Sin nombre"}
                      {user.id===currentUser?.id&&<span style={{fontSize:9,background:C.accentDim,color:C.accentText,borderRadius:100,padding:"1px 6px",marginLeft:6,fontWeight:700}}>TÚ</span>}
                    </div>
                    <div style={{fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
                  </div>
                  {/* Admin toggle */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                    <button onClick={()=>user.id!==currentUser?.id&&updateProfile(user.id,{is_admin:!user.is_admin})}
                      disabled={user.id===currentUser?.id}
                      style={{
                        width:38,height:22,borderRadius:11,border:"none",cursor:user.id===currentUser?.id?"not-allowed":"pointer",
                        background:user.is_admin?C.accent:C.border,position:"relative",transition:"background .2s",
                        opacity:user.id===currentUser?.id?0.5:1,
                      }}>
                      <div style={{position:"absolute",top:3,left:user.is_admin?19:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                    </button>
                    <div style={{fontSize:8,color:C.textMuted,fontWeight:600}}>ADMIN</div>
                  </div>
                </div>

                {/* Apps permitidas */}
                <div style={{padding:"0 14px 12px"}}>
                  <div style={{fontSize:9,color:C.textMuted,fontWeight:700,marginBottom:7}}>APPS PERMITIDAS</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {ALL_APPS.map(app=>{
                      const active=(user.allowed_apps||[]).includes(app.id);
                      const isMe=user.id===currentUser?.id&&user.is_admin;
                      return(
                        <button key={app.id}
                          onClick={()=>!isMe&&toggleApp(user,app.id)}
                          style={{
                            padding:"5px 10px",borderRadius:8,cursor:isMe?"default":"pointer",
                            border:"1px solid "+(active?app.color:C.border),
                            background:active?app.color+"18":"transparent",
                            color:active?app.color:C.textMuted,
                            fontSize:11,fontWeight:600,
                            display:"flex",alignItems:"center",gap:4,
                            opacity:isMe&&!active?0.3:1,
                          }}>
                          {app.icon} {app.label}
                          {active&&<span style={{fontSize:9}}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {user.id===currentUser?.id&&user.is_admin&&(
                    <div style={{fontSize:10,color:C.textMuted,marginTop:6}}>Admin tiene acceso total siempre</div>
                  )}
                </div>

                {/* Color avatar */}
                <div style={{padding:"0 14px 14px",borderTop:"1px solid "+C.borderSub}}>
                  <div style={{fontSize:9,color:C.textMuted,fontWeight:700,marginBottom:7,marginTop:10}}>COLOR</div>
                  <div style={{display:"flex",gap:7}}>
                    {colors.map(col=>(
                      <button key={col} onClick={()=>updateProfile(user.id,{avatar_color:col})}
                        style={{width:22,height:22,borderRadius:6,background:col,border:"2px solid "+(user.avatar_color===col?"#fff":"transparent"),cursor:"pointer"}}/>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",bottom:"max(90px,calc(env(safe-area-inset-bottom)+80px))",left:"50%",transform:"translateX(-50%)",
          background:C.accent,color:"#000",borderRadius:100,padding:"8px 18px",fontSize:12,fontWeight:700,zIndex:400}}>
          {toast}
        </div>
      )}

      {/* Create User Modal */}
      {showCreate&&<CreateUserModal onClose={()=>setShowCreate(false)} onInvite={inviteUser}/>}
      {editUser&&<EditUserModal user={editUser} onClose={()=>setEditUser(null)} onSave={(u,updates)=>{updateProfile(u.id,updates);setEditUser(null);}}/>}
    </div>
  );
}

function CreateUserModal({ onClose, onInvite }) {
  const [email, setEmail] = useState("");
  const [name,  setName]  = useState("");
  const [loading,setLoading]=useState(false);

  async function handle() {
    if (!email) return;
    setLoading(true);
    await onInvite(email, name);
    setLoading(false);
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,
        padding:"16px 20px max(32px,calc(env(safe-area-inset-bottom)+20px))",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700}}>Invitar usuario</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"grid",gap:10,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>NOMBRE</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del usuario" style={inp} autoCapitalize="words"/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>EMAIL</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" style={inp} autoCapitalize="none"/>
          </div>
          <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.textMuted,lineHeight:1.5}}>
            💡 Se enviará una invitación al email. El usuario podrá activar su cuenta y configurar su contraseña. Después podrás asignarle las apps desde el panel.
          </div>
        </div>
        <button onClick={handle} disabled={!email||loading} style={{
          width:"100%",padding:13,borderRadius:12,border:"none",
          background:email&&!loading?C.accent:C.border,
          color:email&&!loading?"#000":C.textMuted,
          fontWeight:700,fontSize:15,cursor:"pointer",
        }}>
          {loading?"Enviando...":"Enviar invitación"}
        </button>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name||"");
  return (
    <div style={{position:"fixed",inset:0,background:"#000000BB",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,
        padding:"16px 20px max(32px,calc(env(safe-area-inset-bottom)+20px))",borderTop:"1px solid "+C.accent+"55"}}>
        <div style={{width:32,height:3,background:C.border,borderRadius:2,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700}}>Editar usuario</div>
          <button onClick={onClose} style={{background:C.card,border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",color:C.text,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:600,marginBottom:6}}>NOMBRE</div>
          <input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
        </div>
        <button onClick={()=>onSave(user,{name})} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:C.accent,color:"#000",fontWeight:700,fontSize:15,cursor:"pointer"}}>
          Guardar
        </button>
      </div>
    </div>
  );
}
