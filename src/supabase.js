import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

console.log('[Supabase] URL:', SUPABASE_URL ? '✅ ' + SUPABASE_URL : '❌ No encontrada')
console.log('[Supabase] KEY:', SUPABASE_KEY ? '✅ Clave presente (' + SUPABASE_KEY.length + ' chars)' : '❌ No encontrada')

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder-key',
  {
    auth: {
      // Sesión persistente en localStorage — el usuario no tiene que volver a logearse
      persistSession:    true,
      // Renovar token automáticamente antes de que expire
      autoRefreshToken:  true,
      // Detectar sesión en cookies/URL (útil para email confirm)
      detectSessionInUrl: true,
      // Guardar en localStorage (default, explícito para claridad)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
)

export const isConfigured = !!(SUPABASE_URL && SUPABASE_KEY &&
  SUPABASE_URL !== 'https://placeholder.supabase.co')
