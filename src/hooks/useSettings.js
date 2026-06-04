import { supabase } from '../supabase.js'

// app_settings uses composite key (user_id + key) for isolation
// Settings without userId fall back to default

export async function loadSetting(key, defaultValue, userId=null) {
  try {
    let q = supabase.from('app_settings').select('value').eq('key', key)
    if (userId) q = q.eq('user_id', userId)
    const { data, error } = await q.single()
    if (error || !data) return defaultValue
    return data.value
  } catch { return defaultValue }
}

export async function saveSetting(key, value, userId=null) {
  try {
    const row = { key, value }
    if (userId) row.user_id = userId
    await supabase.from('app_settings').upsert(row, { onConflict: userId ? 'user_id,key' : 'key' })
  } catch(e) { console.error('[saveSetting]', e) }
}
