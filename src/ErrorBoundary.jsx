import { Component } from "react";

const C = {
  bg:"#09090B", card:"#18181B", border:"#27272A",
  text:"#FAFAFA", textMuted:"#52525B",
  accent:"#22C55E", red:"#EF4444", redDim:"#1F0808",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] 💥 Crash capturado:", error.message, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        position:"absolute",inset:0,background:C.bg,color:C.text,
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"32px 24px",
        paddingTop:"max(60px,calc(env(safe-area-inset-top)+40px))",
      }}>
        <div style={{fontSize:48,marginBottom:16}}>💥</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:8,textAlign:"center"}}>Algo salió mal</div>
        <div style={{fontSize:14,color:C.textMuted,textAlign:"center",marginBottom:32,lineHeight:1.5,maxWidth:280}}>
          Ocurrió un error inesperado en la app. Puedes intentar recargar o volver al inicio.
        </div>

        {/* Mensaje de error (solo en desarrollo) */}
        {this.state.error && (
          <div style={{background:C.redDim,border:"1px solid "+C.red+"33",borderRadius:12,
            padding:"12px 16px",marginBottom:24,width:"100%",maxWidth:340,wordBreak:"break-word"}}>
            <div style={{fontSize:10,color:C.red,fontWeight:700,marginBottom:4}}>ERROR</div>
            <div style={{fontSize:12,color:C.red,fontFamily:"monospace"}}>
              {this.state.error.message}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,width:"100%",maxWidth:340}}>
          <button onClick={()=>window.location.reload()} style={{
            flex:1,padding:13,borderRadius:12,border:"none",
            background:C.accent,color:"#000",fontWeight:700,fontSize:15,cursor:"pointer"
          }}>Recargar app</button>
          <button onClick={()=>this.setState({hasError:false,error:null,errorInfo:null})} style={{
            flex:1,padding:13,borderRadius:12,border:"1px solid "+C.border,
            background:C.card,color:C.text,fontWeight:600,fontSize:15,cursor:"pointer"
          }}>Reintentar</button>
        </div>
      </div>
    );
  }
}
