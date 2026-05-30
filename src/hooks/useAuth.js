import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "../supabase.js";

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

const PROFILE_CACHE_KEY = "suite_profile_cache";

function saveProfileCache(p) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)); } catch {}
}
function loadProfileCache() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "null"); } catch { return null; }
}
function clearProfileCache() {
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
}

export function useAuthProvider() {
  // Inicializar con el caché para que el perfil aparezca INMEDIATAMENTE
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(() => loadProfileCache());
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  async function loadProfile(userId) {
    if (!userId) return;
    // Usar caché inmediatamente — las apps aparecen sin esperar a Supabase
    const cached = loadProfileCache();
    if (cached && cached.id === userId && mountedRef.current) {
      setProfile(cached);
    }
    try {
      // AbortController: la query muere a los 5s si Supabase no responde
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 5000);
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", userId).single()
        .abortSignal(controller.signal);
      clearTimeout(abortTimer);
      if (!mountedRef.current) return;
      if (!error && data) {
        setProfile(data);
        saveProfileCache(data);
        console.log("[Auth] ✅ Perfil cargado:", data.name, "admin:", data.is_admin);
        supabase.from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", userId).then(()=>{});
      } else {
        console.warn("[Auth] loadProfile error:", error?.message);
        if (cached && mountedRef.current) setProfile(cached);
      }
    } catch(e) {
      console.warn("[Auth] loadProfile timeout:", e.message);
      const c = loadProfileCache();
      if (c && mountedRef.current) setProfile(c);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("[Auth] Timeout — forzando carga");
        // Si hay caché, usar eso en lugar de quedar sin perfil
        const cached = loadProfileCache();
        if (cached) setProfile(cached);
        setLoading(false);
      }
    }, 7000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        console.log("[Auth] Evento:", event, session?.user?.email || "sin sesión");

        if (event === "SIGNED_OUT") {
          setUser(null); setProfile(null);
          clearProfileCache();
          setLoading(false);
          clearTimeout(timeout); return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null); setProfile(null);
        }

        if (["INITIAL_SESSION","SIGNED_IN","TOKEN_REFRESHED","USER_UPDATED"].includes(event)) {
          if (mountedRef.current) { clearTimeout(timeout); setLoading(false); }
        }
      }
    );

    // Al volver a foreground: reconectar y recargar perfil
    let retryTimer = null;
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      console.log("[Auth] App en foco — reconectando...");
      if (retryTimer) clearTimeout(retryTimer);
      // Pequeño delay para que la red se estabilice
      retryTimer = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && mountedRef.current) {
            loadProfile(session.user.id);
          }
        });
      }, 800);
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      if (retryTimer) clearTimeout(retryTimer);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ name } } });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    clearProfileCache();
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  }
  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
    if (!error && data) { setProfile(data); saveProfileCache(data); }
    return { data, error };
  }

  return {
    user, profile, loading,
    isAdmin:     profile?.is_admin === true,
    allowedApps: profile?.allowed_apps || [],
    signIn, signUp, signOut, updateProfile, loadProfile,
  };
}

