import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "../supabase.js";

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function useAuthProvider() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // loadProfile — simple, sin Promise.race ni setTimeout retry
  async function loadProfile(userId) {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!mountedRef.current) return;
      if (!error && data) {
        setProfile(data);
        console.log("[Auth] ✅ Perfil cargado:", data.name, "admin:", data.is_admin);
        supabase.from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", userId).then(()=>{});
      } else {
        console.warn("[Auth] loadProfile error:", error?.message);
      }
    } catch(e) {
      console.warn("[Auth] loadProfile catch:", e.message);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    // Timeout de seguridad: 7s máximo en pantalla de carga
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("[Auth] Timeout — forzando carga");
        setLoading(false);
      }
    }, 7000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        console.log("[Auth] Evento:", event, session?.user?.email || "sin sesión");

        if (event === "SIGNED_OUT") {
          setUser(null); setProfile(null); setLoading(false);
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

    // Recargar perfil al volver a la app
    function onVisible() {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && mountedRef.current) loadProfile(session.user.id);
        });
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
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
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  }
  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
    if (!error && data) setProfile(data);
    return { data, error };
  }

  return {
    user, profile, loading,
    isAdmin:     profile?.is_admin === true,
    allowedApps: profile?.allowed_apps || [],
    signIn, signUp, signOut, updateProfile, loadProfile,
  };
}
