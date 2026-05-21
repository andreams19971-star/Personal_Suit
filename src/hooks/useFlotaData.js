import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const CARRO1_DIARIO  = 70000
const CARRO2_MENSUAL = 500000

const SEED_CARS = [
  { id:"C1", nombre:"Carro 1", placa:"ABC-123", modelo:"Chevrolet Aveo 2019", conductor:"Carlos R.", tipo:"diario",   valor_diario:CARRO1_DIARIO,   valor_mensual:null, color:"#3B82F6", color_dim:"#0A1628", icon:"🚗", activo:true },
  { id:"C2", nombre:"Carro 2", placa:"XYZ-456", modelo:"Renault Logan 2020",  conductor:"Andrés M.", tipo:"mensual", valor_diario:null, valor_mensual:CARRO2_MENSUAL, color:"#A855F7", color_dim:"#1A0A28", icon:"🚙", activo:true },
]

export function useFlotaData() {
  const [cars,     setCars]     = useState([])
  const [payments, setPayments] = useState({})   // { carId: [...pagos] }
  const [expenses, setExpenses] = useState({})   // { carId: [...gastos] }
  const [loading,  setLoading]  = useState(true)
  const [online,   setOnline]   = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [
        { data: carsData, error: cErr },
        { data: paysData, error: pErr },
        { data: expsData, error: eErr },
      ] = await Promise.all([
        supabase.from('cars').select('*').eq('activo', true).order('created_at'),
        supabase.from('car_payments').select('*').order('fecha', { ascending: false }),
        supabase.from('car_expenses').select('*').order('fecha', { ascending: false }),
      ])
      if (cErr || pErr || eErr) throw cErr || pErr || eErr

      // Si no hay carros aún, insertar los seed
      if (!carsData || carsData.length === 0) {
        await supabase.from('cars').insert(SEED_CARS)
        setCars(SEED_CARS)
      } else {
        setCars(carsData)
      }

      // Agrupar pagos y gastos por carro
      const pBycar = {}
      const eBycar = {}
      ;(paysData || []).forEach(p => { (pBycar[p.car_id] = pBycar[p.car_id] || []).push(p) })
      ;(expsData || []).forEach(e => { (eBycar[e.car_id] = eBycar[e.car_id] || []).push(e) })
      setPayments(pBycar)
      setExpenses(eBycar)
      setOnline(true)
    } catch (err) {
      console.warn('Usando datos locales FlotaTracker:', err.message)
      setOnline(false)
      setCars(SEED_CARS)
      // Seed payments
      const now = new Date()
      const ago = d => { const x = new Date(now); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10) }
      const seedPays = { C1: [], C2: [] }
      for (let i = 0; i < 15; i++) {
        const fecha = ago(i)
        const dow = new Date(fecha+'T12:00').getDay()
        if (dow !== 0) seedPays.C1.push({ id:'P1-'+i, car_id:'C1', fecha, monto:CARRO1_DIARIO, pagado: i > 2, nota:'' })
      }
      seedPays.C2 = [
        { id:'P2-1', car_id:'C2', fecha:ago(45), monto:CARRO2_MENSUAL, pagado:true,  nota:'Pago puntual' },
        { id:'P2-2', car_id:'C2', fecha:ago(15), monto:CARRO2_MENSUAL, pagado:true,  nota:'' },
        { id:'P2-3', car_id:'C2', fecha:ago(0),  monto:CARRO2_MENSUAL, pagado:false, nota:'' },
      ]
      setPayments(seedPays)
      setExpenses({
        C1: [
          { id:'E1-1', car_id:'C1', fecha:ago(5),  categoria:'Gasolina',     monto:80000,  nota:'Tanque lleno' },
          { id:'E1-2', car_id:'C1', fecha:ago(20), categoria:'SOAT',          monto:320000, nota:'Renovación' },
        ],
        C2: [
          { id:'E2-1', car_id:'C2', fecha:ago(8),  categoria:'Gasolina',     monto:70000,  nota:'' },
          { id:'E2-2', car_id:'C2', fecha:ago(30), categoria:'Aceite',        monto:85000,  nota:'5W30' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Marcar pago como pagado/pendiente ──
  async function togglePayment(carId, pagoId) {
    let updated
    setPayments(prev => {
      const list = (prev[carId] || []).map(p => {
        if (p.id !== pagoId) return p
        updated = { ...p, pagado: !p.pagado }
        return updated
      })
      return { ...prev, [carId]: list }
    })
    if (!online || !updated) return
    await supabase.from('car_payments').update({ pagado: updated.pagado }).eq('id', pagoId)
  }

  // ── Agregar día de trabajo (carro diario) ──
  async function addWorkDay(carId, fecha) {
    const car = cars.find(c => c.id === carId)
    const newPay = { id: 'P-'+Date.now(), car_id: carId, fecha, monto: car?.valor_diario || CARRO1_DIARIO, pagado: false, nota: '' }
    setPayments(prev => ({ ...prev, [carId]: [newPay, ...(prev[carId] || [])] }))
    if (!online) return
    await supabase.from('car_payments').insert([newPay])
  }

  // ── Registrar gasto del carro ──
  async function addExpense(carId, gasto) {
    const newExp = { ...gasto, id: 'E-'+Date.now(), car_id: carId }
    setExpenses(prev => ({ ...prev, [carId]: [newExp, ...(prev[carId] || [])] }))
    if (!online) return
    await supabase.from('car_expenses').insert([newExp])
  }

  // Combinar cars con sus pagos y gastos para la UI
  const carsWithData = cars.map(c => ({
    ...c,
    pagos:  payments[c.id] || [],
    gastos: expenses[c.id] || [],
  }))

  return {
    cars: carsWithData,
    loading, online,
    togglePayment, addWorkDay, addExpense,
    reload: loadAll,
  }
}
