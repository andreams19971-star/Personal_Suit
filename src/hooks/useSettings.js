import { supabase } from '../supabase.js'

// app_settings: clave compuesta (user_id, key). RLS solo deja ver las filas propias.

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || null
}

export async function loadSetting(key, defaultValue, userId=null) {
  try {
    const uid = userId || await currentUserId()
    if (!uid) return defaultValue
    const { data, error } = await supabase.from('app_settings')
      .select('value').eq('key', key).eq('user_id', uid).maybeSingle()
    if (error || !data) return defaultValue
    return data.value
  } catch { return defaultValue }
}

export async function saveSetting(key, value, userId=null) {
  try {
    const uid = userId || await currentUserId()
    if (!uid) return { error: 'No autenticado' }
    const { error } = await supabase.from('app_settings')
      .upsert({ user_id: uid, key, value }, { onConflict: 'user_id,key' })
    if (error) { console.error('[saveSetting]', error.message); return { error: error.message } }
    return { data: true }
  } catch(e) { console.error('[saveSetting]', e); return { error: String(e) } }
}
