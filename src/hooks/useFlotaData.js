import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10) }
const today  = () => new Date().toISOString().slice(0,10)

const DEFAULT_CARS = [
  { id:'C1', nombre:'Carro 1', placa:'ABC-123', modelo:'Chevrolet Aveo 2019', conductor:'Sin asignar', tipo:'diario',   valor_diario:70000,  valor_mensual:null,   color:'#3B82F6', color_dim:'#0A1628', icon:'🚗', activo:true },
  { id:'C2', nombre:'Carro 2', placa:'XYZ-456', modelo:'Renault Logan 2020',  conductor:'Sin asignar', tipo:'mensual', valor_diario:null,   valor_mensual:500000, color:'#A855F7', color_dim:'#1A0A28', icon:'🚙', activo:true },
]

export function useFlotaData() {
  const [cars,     setCars]     = useState([])
  const [payments, setPayments] = useState({})
  const [expenses, setExpenses] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [online,   setOnline]   = useState(false)
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
      const [cr, pr, er] = await Promise.all([
        supabase.from('cars').select('*').eq('user_id', userId).eq('activo', true).order('created_at'),
        supabase.from('car_payments').select('*').eq('user_id', userId).order('fecha', { ascending:false }),
        supabase.from('car_expenses').select('*').eq('user_id', userId).order('fecha', { ascending:false }),
      ])
      if (cr.error||pr.error||er.error) throw new Error((cr.error||pr.error||er.error).message)

      let loadedCars = cr.data || []
      if (loadedCars.length === 0) {
        const { data:inserted, error:ie } = await supabase.from('cars').insert(DEFAULT_CARS).select()
        if (ie) throw new Error('insert cars: '+ie.message)
        loadedCars = inserted || DEFAULT_CARS
      }
      setCars(loadedCars)

      const pBycar = {}, eBycar = {}
      ;(pr.data||[]).forEach(p => { (pBycar[p.car_id]=pBycar[p.car_id]||[]).push(p) })
      ;(er.data||[]).forEach(e => { (eBycar[e.car_id]=eBycar[e.car_id]||[]).push(e) })
      setPayments(pBycar); setExpenses(eBycar)
      setOnlineState(true)
      console.log('[FlotaData] ✅ Online')
    } catch(err) {
      console.warn('[FlotaData] Offline →', err.message)
      // Seed data only if no cars loaded
      setCars(DEFAULT_CARS)
      setPayments({})
      setExpenses({})
      setOnlineState(false)
    } finally { setLoading(false) }
  }

  const paymentsRef = useRef({})

  // Keep ref in sync
  useEffect(() => { paymentsRef.current = payments }, [payments])

  // ── Marcar/desmarcar pago ──
  async function togglePayment(carId, pagoId) {
    // Read CURRENT state from ref (not stale closure)
    const currentList = paymentsRef.current[carId] || []
    const pago = currentList.find(p => p.id === pagoId)
    if (!pago) { console.warn('[togglePayment] not found:', pagoId); return false }

    const newPagado = !pago.pagado
    const updatedPago = { ...pago, pagado: newPagado }

    // Optimistic UI update
    setPayments(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).map(p => p.id === pagoId ? updatedPago : p)
    }))

    if (!onlineRef.current) console.warn('[offline] toggle...')

    // Upsert — works even if record doesn't exist in DB yet
    const { error } = await supabase.from('car_payments').upsert({
      id: pago.id, car_id: carId, fecha: pago.fecha,
      monto: pago.monto, pagado: newPagado, nota: pago.nota || ''
    })

    if (error) {
      console.error('[togglePayment] ERROR:', error.message)
      // Revert on failure
      setPayments(prev => ({
        ...prev,
        [carId]: (prev[carId]||[]).map(p => p.id === pagoId ? pago : p)
      }))
      return pago.pagado
    }

    console.log('[togglePayment] ✅', pagoId, '→ pagado:', newPagado)
    return newPagado
  }

  // ── Eliminar registro de día ──
  async function deletePayment(carId, pagoId) {
    setPayments(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).filter(p => p.id !== pagoId)
    }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { error } = await supabase.from('car_payments').delete().eq('id', pagoId)
    if (error) console.error('[deletePayment]', error.message)
    else console.log('[deletePayment] ✅', pagoId)
  }

  async function updatePayment(carId, pagoId, updates) {
    const prev_pago = (payments[carId]||[]).find(p=>p.id===pagoId)
    setPayments(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).map(p => p.id !== pagoId ? p : {...p, ...updates})
    }))
    if (!onlineRef.current) return { error:'Sin conexión' }
    const { error } = await supabase.from('car_payments').update({
      fecha:   updates.fecha,
      monto:   updates.monto,
      nota:    updates.nota || '',
      account: updates.account || 'cash',
    }).eq('id', pagoId)
    if (error) {
      console.error('[updatePayment] ❌', error.message)
      // Revertir
      if (prev_pago) setPayments(prev => ({...prev, [carId]: (prev[carId]||[]).map(p=>p.id===pagoId?prev_pago:p)}))
      return { error: error.message }
    }
    console.log('[updatePayment] ✅', pagoId)
    return { data: true }
  }

  // ── Agregar día de trabajo ──
  async function addWorkDay(carId, fecha, account='cash', montoCustom=null) {
    const car   = cars.find(c => c.id === carId)
    const monto = montoCustom || car?.valor_diario || 70000
    // userId del ref (seteado en loadAll). El trigger de BD lo garantiza también.
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id;
    const localId = 'local-P-' + Date.now()
    const localRow = { id:localId, car_id:carId, fecha, monto, pagado:false, nota:'', account }
    setPayments(prev => ({...prev, [carId]: [localRow, ...(prev[carId]||[])]}))
    if (!onlineRef.current) {
      console.warn('[addWorkDay] offline'); return { error:'Sin conexión' }
    }
    // Omitir id para que Supabase genere UUID
    const { data, error } = await supabase.from('car_payments')
      .insert([{ user_id:userId, car_id:carId, fecha, monto, pagado:false, nota:'',
        ...(account ? { account } : {})
      }])
      .select().single()
    if (error) {
      console.error('[addWorkDay] ❌', error.message)
      setPayments(prev => ({...prev, [carId]: (prev[carId]||[]).filter(p=>p.id!==localId)}))
      return { error: error.message }
    }
    // Reemplazar id local con UUID real de Supabase
    setPayments(prev => ({...prev, [carId]: (prev[carId]||[]).map(p=>p.id===localId?data:p)}))
    console.log('[addWorkDay] ✅', data.id)
    return { data }
  }

  // ── Agregar gasto ──
  async function addExpense(carId, gasto) {
    const localId = 'local-E-' + Date.now()
    const localRow = { ...gasto, id:localId, car_id:carId, account:gasto.account||'cash' }
    setExpenses(prev => ({...prev, [carId]: [localRow, ...(prev[carId]||[])]}))
    if (!onlineRef.current) {
      console.warn('[addExpense] offline'); return { error:'Sin conexión' }
    }
    const { data, error } = await supabase.from('car_expenses').insert([{
      car_id:   carId,
      fecha:    gasto.fecha,
      category: gasto.categoria,
      amount:   gasto.monto,
      note:     gasto.nota || '',
      ...(gasto.account ? { account: gasto.account } : {})
    }]).select().single()
    if (error) {
      console.error('[addExpense] ❌', error.message)
      setExpenses(prev => ({...prev, [carId]: (prev[carId]||[]).filter(e=>e.id!==localId)}))
      return { error: error.message }
    }
    setExpenses(prev => ({...prev, [carId]: (prev[carId]||[]).map(e=>e.id===localId?{...localRow,id:data.id}:e)}))
    console.log('[addExpense] ✅', data.id)
    return { data }
  }

  // ── Eliminar gasto ──
  async function deleteExpense(carId, expId) {
    setExpenses(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).filter(e => e.id !== expId)
    }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('car_expenses').delete().eq('id', expId)
  }

  // ── Actualizar datos del carro ──
  async function updateCar(carId, updates) {
    setCars(prev => prev.map(c => c.id !== carId ? c : {...c, ...updates}))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { error } = await supabase.from('cars').update(updates).eq('id', carId)
    if (error) console.error('[updateCar]', error.message)
  }

  // ── Agregar carro ──
  async function addCar(data) {
    const newCar = {
      id: 'car-'+Date.now(),
      nombre: data.nombre, placa: data.placa || '',
      conductor: data.conductor || '', modelo: data.modelo || '',
      tipo: data.tipo || 'diario',
      valor_diario: data.valor_diario || 70000,
      valor_mensual: data.valor_mensual || 500000,
      color: data.color || '#3B82F6',
      icon: data.icon || '🚗', activo: true,
    }
    setCars(prev => [...prev, newCar])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { error } = await supabase.from('cars').insert([newCar])
    if (error) console.error('[addCar]', error.message)
    else console.log('[addCar] ✅', newCar.nombre)
  }

  // ── Eliminar carro (soft delete) ──
  async function deleteCar(carId) {
    setCars(prev => prev.filter(c => c.id !== carId))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('cars').update({ activo: false }).eq('id', carId)
  }

  const carsWithData = cars.map(c => ({
    ...c,
    pagos:  payments[c.id] || [],
    gastos: expenses[c.id] || [],
  }))

  return {
    cars: carsWithData, rawCars: cars, loading, online,
    togglePayment, deletePayment, updatePayment, addWorkDay,
    addExpense, deleteExpense, updateCar, addCar, deleteCar, reload: loadAll
  }
}
