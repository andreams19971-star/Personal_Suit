import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const today = () => new Date().toISOString().slice(0,10)

const DEFAULT_ROOMS = [
  { id:'R1', name:'Habitación 1', description:'Cama doble, baño privado',       base_price:0, icon:'🛏️', color:'#818CF8', amenities:['WiFi','AC','TV','Baño privado'] },
  { id:'R2', name:'Habitación 2', description:'Cama sencilla, baño compartido', base_price:0, icon:'🛏️', color:'#34D399', amenities:['WiFi','TV','Baño compartido'] },
  { id:'R3', name:'Habitación 3', description:'Cama doble premium, baño privado',base_price:0, icon:'🛏️', color:'#FBBF24', amenities:['WiFi','AC','TV','Baño privado','Balcón'] },
]

export function useApartamentoData() {
  const [rooms,        setRooms]        = useState(DEFAULT_ROOMS)
  const [reservations, setReservations] = useState([])
  const [expenses,     setExpenses]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [online,       setOnline]       = useState(false)
  const onlineRef = useRef(false)
  const userIdRef = useRef(null)
  const setOnlineState = v => { onlineRef.current = v; setOnline(v) }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { console.warn("[Data] No userId — skipping load"); return; }
    userIdRef.current = userId;
    setLoading(true)
    try {
      const [rr, resr, er] = await Promise.all([
        supabase.from('apt_rooms').select('*').eq('user_id', userId).order('id'),
        supabase.from('apt_reservations').select('*').eq('user_id', userId).order('check_in', { ascending:false }),
        supabase.from('apt_expenses').select('*').eq('user_id', userId).order('fecha', { ascending:false }),
      ])
      if (rr.error||resr.error||er.error) throw new Error((rr.error||resr.error||er.error).message)

      let loadedRooms = rr.data || []
      if (loadedRooms.length === 0) {
        const inserts = DEFAULT_ROOMS.map(r => ({
          id: r.id, name: r.name, description: r.description,
          base_price: r.base_price, icon: r.icon, color: r.color,
          amenities: r.amenities
        }))
        const { data:inserted } = await supabase.from('apt_rooms').insert(inserts).select()
        loadedRooms = inserted || DEFAULT_ROOMS
      }

      // Map DB columns to app format
      setRooms(loadedRooms.map(r => ({
        id: r.id, name: r.name, description: r.description,
        basePrice: r.base_price || 0, icon: r.icon || '🛏️',
        color: r.color || '#818CF8',
        amenities: Array.isArray(r.amenities) ? r.amenities : []
      })))

      setReservations((resr.data||[]).map(r => ({
        id: r.id, roomId: r.room_id, guest: r.guest, phone: r.phone||'',
        checkIn: r.check_in, checkOut: r.check_out, nights: r.nights||1,
        platform: r.platform||'Directo', status: r.status||'reserved',
        notes: r.notes||'', total: r.total||0, paid: r.paid||0,
        gender: r.gender||null,
      })))

      setExpenses((er.data||[]).map(e => ({
        id: e.id, room: e.room_id, date: e.fecha,
        category: e.category, amount: e.amount, note: e.note||''
      })))

      setOnlineState(true)
      console.log('[AptData] ✅ Online')
    } catch(err) {
      console.warn('[AptData] Offline →', err.message)
      setOnlineState(false)
    } finally { setLoading(false) }
  }

  async function addReservation(res) {
    if (!res.guest?.trim())   return { error: 'El nombre del huésped es obligatorio' }
    if (!res.checkIn)         return { error: 'La fecha de entrada es obligatoria' }
    if (!res.checkOut)        return { error: 'La fecha de salida es obligatoria' }
    if (res.checkOut <= res.checkIn) return { error: 'La salida debe ser después de la entrada' }
    const nights = Math.max(1, Math.round((new Date(res.checkOut)-new Date(res.checkIn))/86400000))
    // Fallback: si loadAll no completó aún, obtener userId directo de Supabase
    let userId = userIdRef.current;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
      if (userId) userIdRef.current = userId;
    }
    if (!userId) return { error: "No autenticado — inicia sesión nuevamente" };
    const localId = 'local-RES-' + Date.now()
    const newRes = { ...res, id:localId, nights, total:0, paid:0, status:'reserved' }
    setReservations(prev => [newRes, ...prev])
    if (!onlineRef.current) return { error:'Sin conexión' }
    const { data, error } = await supabase.from('apt_reservations').insert([{ user_id:userId,
      room_id:newRes.roomId, guest:newRes.guest,
      phone:newRes.phone||'', check_in:newRes.checkIn, check_out:newRes.checkOut,
      nights:newRes.nights, platform:newRes.platform||'Directo',
      status:newRes.status, notes:newRes.notes||'', total:0, paid:0,
      ...(newRes.gender ? { gender:newRes.gender } : {})
    }]).select().single()
    if (error) {
      console.error('[addReservation] ❌', error.message)
      setReservations(prev => prev.filter(r => r.id !== localId))
      return { error: error.message }
    }
    setReservations(prev => prev.map(r => r.id===localId ? {...newRes, id:data.id} : r))
    console.log('[addReservation] ✅', data.id)
    return { data }
  }

  async function updateReservationStatus(id, status) {
    setReservations(prev => {
      const updated = prev.map(r => r.id!==id ? r : {...r, status})
      return updated
    })
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('apt_reservations').update({ status }).eq('id', id)
  }

  async function deleteReservation(id) {
    setReservations(prev => {
      const updated = prev.filter(r => r.id!==id)
      return updated
    })
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('apt_reservations').delete().eq('id', id)
  }

  async function addExpense(exp) {
    const localId = 'local-E-' + Date.now()
    const newExp = { ...exp, id:localId }
    setExpenses(prev => [newExp, ...prev])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { data, error } = await supabase.from('apt_expenses').insert([{ user_id:userId,
      room_id:exp.room||null, fecha:exp.date,
      category:exp.category, amount:exp.amount, note:exp.note||''
    }]).select().single()
    if (error) { console.error('[addExpense] ❌', error.message); setExpenses(prev=>prev.filter(e=>e.id!==localId)); return }
    setExpenses(prev => prev.map(e => e.id===localId ? {...newExp,id:data.id} : e))
  }

  async function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id!==id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('apt_expenses').delete().eq('id', id)
  }

  async function updateRoom(roomId, updates) {
    setRooms(prev => prev.map(r => r.id!==roomId ? r : {...r, ...updates}))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('apt_rooms').update({
      name: updates.name, description: updates.description,
      base_price: updates.basePrice||0, amenities: updates.amenities||[]
    }).eq('id', roomId)
  }


  return {
    rooms, reservations, expenses, loading, online,
    addReservation, updateReservationStatus, deleteReservation,
    addExpense, deleteExpense, updateRoom, reload: loadAll
  }
}
