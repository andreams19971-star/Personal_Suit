import { createClient } from '@supabase/supabase-js'

// Estas variables las define Vite en build time desde el archivo .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

// Debug - puedes ver esto en la consola del navegador (F12)
console.log('[Supabase] URL:', SUPABASE_URL ? '✅ ' + SUPABASE_URL : '❌ No encontrada')
console.log('[Supabase] KEY:', SUPABASE_KEY ? '✅ Clave presente (' + SUPABASE_KEY.length + ' chars)' : '❌ No encontrada')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(`
❌ SUPABASE NO CONFIGURADO
Crea el archivo .env en la raíz del proyecto con:
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGci...
  `)
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder-key'
)

export const isConfigured = !!(SUPABASE_URL && SUPABASE_KEY &&
  SUPABASE_URL !== 'https://placeholder.supabase.co')
