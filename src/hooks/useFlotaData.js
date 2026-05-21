import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10) }
const td  = () => new Date().toISOString().slice(0,10)

const DEFAULT_CARS = [
  { id:'C1', nombre:'Carro 1', placa:'ABC-123', modelo:'Chevrolet Aveo 2019', conductor:'Sin asignar', tipo:'diario',   valor_diario:70000,  valor_mensual:null,   color:'#3B82F6', color_dim:'#0A1628', icon:'🚗', activo:true },
  { id:'C2', nombre:'Carro 2', placa:'XYZ-456', modelo:'Renault Logan 2020',  conductor:'Sin asignar', tipo:'mensual', valor_diario:null,   valor_mensual:500000, color:'#A855F7', color_dim:'#1A0A28', icon:'🚙', activo:true },
]

function seedPayments(cars) {
  const pays = {}
  cars.forEach(c => {
    if (c.tipo==='diario') {
      const list = []
      for (let i=0;i<20;i++) {
        const f=ago(i); const dow=new Date(f+'T12:00').getDay()
        if (dow!==0) list.push({id:'sp'+c.id+i,car_id:c.id,fecha:f,monto:c.valor_diario||70000,pagado:i>2,nota:''})
      }
      pays[c.id] = list
    } else {
      pays[c.id] = [
        {id:'sp'+c.id+'1',car_id:c.id,fecha:ago(45),monto:c.valor_mensual||500000,pagado:true, nota:''},
        {id:'sp'+c.id+'2',car_id:c.id,fecha:ago(15),monto:c.valor_mensual||500000,pagado:true, nota:''},
        {id:'sp'+c.id+'0',car_id:c.id,fecha:td(),   monto:c.valor_mensual||500000,pagado:false,nota:''},
      ]
    }
  })
  return pays
}

export function useFlotaData() {
  const [cars,     setCars]     = useState([])
  const [payments, setPayments] = useState({})
  const [expenses, setExpenses] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [online,   setOnline]   = useState(false)

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
      // Si no hay carros, crear los por defecto
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
      setOnline(true)
    } catch(err) {
      console.warn('[FlotaData] Offline →', err.message)
      setCars(DEFAULT_CARS)
      setPayments(seedPayments(DEFAULT_CARS))
      setExpenses({ C1:[{id:'se1',car_id:'C1',fecha:ago(5),categoria:'Gasolina',monto:80000,nota:''}], C2:[] })
      setOnline(false)
    } finally { setLoading(false) }
  }

  async function togglePayment(carId, pagoId) {
    let updated
    setPayments(prev => {
      const list = (prev[carId]||[]).map(p => { if(p.id!==pagoId) return p; updated={...p,pagado:!p.pagado}; return updated })
      return {...prev,[carId]:list}
    })
    if (!online||!updated) return
    await supabase.from('car_payments').update({pagado:updated.pagado}).eq('id', pagoId)
  }

  async function addWorkDay(carId, fecha) {
    const car = cars.find(c=>c.id===carId)
    const row = { id:'P'+Date.now(), car_id:carId, fecha, monto:car?.valor_diario||70000, pagado:false, nota:'' }
    setPayments(prev => ({...prev,[carId]:[row,...(prev[carId]||[])]}))
    if (!online) return
    await supabase.from('car_payments').insert([row])
  }

  async function addExpense(carId, gasto) {
    const row = { ...gasto, id:'E'+Date.now(), car_id:carId }
    setExpenses(prev => ({...prev,[carId]:[row,...(prev[carId]||[])]}))
    if (!online) return
    await supabase.from('car_expenses').insert([row])
  }

  async function updateCar(carId, updates) {
    setCars(prev => prev.map(c => c.id!==carId ? c : {...c,...updates}))
    if (!online) return
    await supabase.from('cars').update(updates).eq('id', carId)
  }

  const carsWithData = cars.map(c => ({
    ...c,
    pagos:  payments[c.id] || [],
    gastos: expenses[c.id] || [],
  }))

  return { cars:carsWithData, rawCars:cars, loading, online, togglePayment, addWorkDay, addExpense, updateCar, reload:loadAll }
}
