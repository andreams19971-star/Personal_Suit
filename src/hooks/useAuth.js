import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../supabase.js";

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function useAuthProvider() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad: si en 6 segundos no resuelve, desbloquear
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Timeout — forzando loading=false");
        setLoading(false);
      }
    }, 6000);

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) { console.error("[Auth] getSession error:", error); }
        setUser(session?.user || null);
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch(e) {
        console.error("[Auth] init error:", e);
      } finally {
        if (mounted) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    }

    init();

    // Listener de cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        setUser(session?.user || null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
        // Actualizar last_seen sin bloquear
        supabase.from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", userId)
          .then(() => {});
      } else if (error) {
        console.error("[Auth] loadProfile error:", error.message);
      }
    } catch(e) {
      console.error("[Auth] loadProfile catch:", e);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
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
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  }

  return {
    user, profile, loading,
    isAdmin:     profile?.is_admin === true,
    allowedApps: profile?.allowed_apps || [],
    signIn, signUp, signOut, updateProfile,
  };
}
