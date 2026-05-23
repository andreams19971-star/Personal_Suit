import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10) }
const td  = () => new Date().toISOString().slice(0,10)

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
  const setOnlineState = v => { onlineRef.current = v; setOnline(v) }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [cr, pr, er] = await Promise.all([
        supabase.from('cars').select('*').eq('activo', true).order('created_at'),
        supabase.from('car_payments').select('*').order('fecha', { ascending:false }),
        supabase.from('car_expenses').select('*').order('fecha', { ascending:false }),
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

  // ── Marcar/desmarcar pago ──
  async function togglePayment(carId, pagoId) {
    let updated
    setPayments(prev => {
      const list = (prev[carId]||[]).map(p => {
        if (p.id !== pagoId) return p
        updated = {...p, pagado: !p.pagado}
        return updated
      })
      return {...prev, [carId]: list}
    })
    if (!onlineRef.current || !updated) return
    const { error } = await supabase.from('car_payments').update({ pagado: updated.pagado }).eq('id', pagoId)
    if (error) console.error('[togglePayment]', error.message)
  }

  // ── Eliminar registro de día ──
  async function deletePayment(carId, pagoId) {
    setPayments(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).filter(p => p.id !== pagoId)
    }))
    if (!onlineRef.current) return
    const { error } = await supabase.from('car_payments').delete().eq('id', pagoId)
    if (error) console.error('[deletePayment]', error.message)
    else console.log('[deletePayment] ✅', pagoId)
  }

  // ── Agregar día de trabajo ──
  async function addWorkDay(carId, fecha) {
    const car = cars.find(c => c.id === carId)
    const row = { id:'P'+Date.now(), car_id:carId, fecha, monto:car?.valor_diario||70000, pagado:false, nota:'' }
    setPayments(prev => ({...prev, [carId]: [row, ...(prev[carId]||[])]}))
    if (!onlineRef.current) return
    const { error } = await supabase.from('car_payments').insert([row])
    if (error) console.error('[addWorkDay]', error.message)
  }

  // ── Agregar gasto ──
  async function addExpense(carId, gasto) {
    const row = { ...gasto, id:'E'+Date.now(), car_id:carId }
    setExpenses(prev => ({...prev, [carId]: [row, ...(prev[carId]||[])]}))
    if (!onlineRef.current) return
    const { error } = await supabase.from('car_expenses').insert([row])
    if (error) console.error('[addExpense]', error.message)
  }

  // ── Eliminar gasto ──
  async function deleteExpense(carId, expId) {
    setExpenses(prev => ({
      ...prev,
      [carId]: (prev[carId]||[]).filter(e => e.id !== expId)
    }))
    if (!onlineRef.current) return
    await supabase.from('car_expenses').delete().eq('id', expId)
  }

  // ── Actualizar datos del carro ──
  async function updateCar(carId, updates) {
    setCars(prev => prev.map(c => c.id !== carId ? c : {...c, ...updates}))
    if (!onlineRef.current) return
    const { error } = await supabase.from('cars').update(updates).eq('id', carId)
    if (error) console.error('[updateCar]', error.message)
  }

  const carsWithData = cars.map(c => ({
    ...c,
    pagos:  payments[c.id] || [],
    gastos: expenses[c.id] || [],
  }))

  return {
    cars: carsWithData, rawCars: cars, loading, online,
    togglePayment, deletePayment, addWorkDay,
    addExpense, deleteExpense, updateCar, reload: loadAll
  }
}
