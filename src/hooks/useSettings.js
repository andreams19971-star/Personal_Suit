import { supabase } from '../supabase.js'

export async function loadSetting(key, defaultValue) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()
    if (error || !data) return defaultValue
    return data.value
  } catch { return defaultValue }
}

export async function saveSetting(key, value) {
  try {
    await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
  } catch(e) { console.error('[saveSetting]', e) }
}
