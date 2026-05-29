import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../supabase.js";

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function useAuthProvider() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    if (!userId) return;
    try {
      // Race entre la query y un timeout de 4s
      const result = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("profile_timeout")), 4000))
      ]);
      const { data, error } = result;
      if (!error && data) {
        setProfile(data);
        console.log("[Auth] ✅ Perfil cargado:", data.name, "admin:", data.is_admin);
        supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId).then(()=>{});
      } else {
        console.warn("[Auth] loadProfile error:", error?.message);
      }
    } catch(e) {
      console.warn("[Auth] loadProfile timeout/error:", e.message);
      // Retry silencioso después de 3 segundos
      setTimeout(() => loadProfile(userId), 3000);
    }
  }

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad: 6s máximo en pantalla de carga
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Timeout — forzando carga");
        setLoading(false);
      }
    }, 6000);

    // 1. Listener de cambios de sesión — cubre TODOS los casos:
    //    SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION, SIGNED_OUT, USER_UPDATED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log("[Auth] Evento:", event, session?.user?.email || "sin sesión");

        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }

        // Siempre desbloquear la carga en estos eventos
        if (["INITIAL_SESSION","SIGNED_IN","TOKEN_REFRESHED","USER_UPDATED"].includes(event)) {
          if (mounted) {
            clearTimeout(timeout);
            setLoading(false);
          }
        }
      }
    );

    // 2. Recargar perfil cuando el usuario vuelve a la app (tab visible)
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && mounted) {
            console.log("[Auth] App en foco — recargando perfil");
            loadProfile(session.user.id);
          }
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase.from("profiles")
      .update(updates).eq("id", user.id).select().single();
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
