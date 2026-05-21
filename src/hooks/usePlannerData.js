import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10) }
const td  = () => new Date().toISOString().slice(0,10)
const C   = { accent:'#60A5FA', green:'#34D399', purple:'#A78BFA', yellow:'#FBBF24' }

function seed() {
  return {
    tasks: [
      { id:'t1', title:'Revisar extracto bancario', category:'finance',  priority:'high',   date:td(),    done:false, note:'' },
      { id:'t2', title:'Médico control',            category:'health',   priority:'medium', date:td(),    done:false, note:'3pm' },
      { id:'t3', title:'Pagar servicios',           category:'finance',  priority:'high',   date:ago(3),  done:false, note:'' },
      { id:'t4', title:'Comprar mercado',           category:'personal', priority:'low',    date:ago(2),  done:false, note:'' },
    ],
    habits: [
      { id:'h1', name:'Tomar agua', icon:'💧', color:C.accent,  target:8,  unit:'vasos',   completions:{} },
      { id:'h2', name:'Ejercicio',  icon:'🏃', color:C.green,   target:1,  unit:'sesión',  completions:{} },
      { id:'h3', name:'Leer',       icon:'📚', color:C.purple,  target:30, unit:'minutos', completions:{} },
      { id:'h4', name:'Meditar',    icon:'🧘', color:C.yellow,  target:1,  unit:'sesión',  completions:{} },
    ],
    goals: [
      { id:'g1', title:'Ahorrar para viaje', icon:'✈️', target:5000000, current:1200000, deadline:ago(120), color:C.accent,  category:'finance'  },
      { id:'g2', title:'Leer 12 libros',     icon:'📚', target:12,      current:3,       deadline:ago(240), color:C.purple,  category:'personal' },
      { id:'g3', title:'Bajar 8 kg',         icon:'⚖️', target:8,       current:2,       deadline:ago(90),  color:C.green,   category:'health'   },
    ],
    notes: [
      { id:'n1', title:'Ideas de negocio', content:'App delivery mascotas, consultoría financiera...', color:C.yellow, date:td() },
      { id:'n2', title:'Lista mercado',    content:'Arroz, fríjoles, aceite, pollo, verduras',         color:C.green,  date:td() },
    ]
  }
}

function parseComp(v) {
  if (!v) return {}
  if (typeof v === 'object' && !Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return {} }
}

export function usePlannerData() {
  const [tasks,   setTasks]   = useState([])
  const [habits,  setHabits]  = useState([])
  const [goals,   setGoals]   = useState([])
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [online,  setOnline]  = useState(false)
  const onlineRef = useRef(false)
  const setOnlineState = v => { onlineRef.current = v; setOnline(v) }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [tr, hr, gr, nr] = await Promise.all([
        supabase.from('tasks').select('*').order('date'),
        supabase.from('habits').select('*').order('created_at'),
        supabase.from('goals').select('*').order('deadline'),
        supabase.from('notes').select('*').order('created_at', { ascending:false }),
      ])
      if (tr.error||hr.error||gr.error||nr.error) throw new Error((tr.error||hr.error||gr.error||nr.error).message)
      setTasks( tr.data || [])
      setHabits((hr.data||[]).map(h => ({ ...h, completions: parseComp(h.completions) })))
      setGoals( gr.data || [])
      setNotes( nr.data || [])
      setOnlineState(true)
    } catch(err) {
      console.warn('[PlannerData] Offline →', err.message)
      const s = seed()
      setTasks(s.tasks); setHabits(s.habits); setGoals(s.goals); setNotes(s.notes)
      setOnlineState(false)
    } finally { setLoading(false) }
  }

  async function addTask(t) {
    const row = { ...t, id:'T'+Date.now(), done:false }
    setTasks(p => [row,...p])
    if (!onlineRef.current) return
    const { error } = await supabase.from('tasks').insert([row])
    if (error) console.error('[addTask]', error.message)
  }
  async function toggleTask(id) {
    let updated
    setTasks(p => p.map(t => { if(t.id!==id) return t; updated={...t,done:!t.done}; return updated }))
    if (!onlineRef.current||!updated) return
    await supabase.from('tasks').update({ done:updated.done }).eq('id', id)
  }
  async function deleteTask(id) {
    setTasks(p => p.filter(t => t.id!==id))
    if (!onlineRef.current) return
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function addHabit(h) {
    const row = { ...h, id:'H'+Date.now(), completions:{} }
    setHabits(p => [...p, row])
    if (!onlineRef.current) return
    await supabase.from('habits').insert([{ ...row, completions:{} }])
  }
  async function toggleHabit(hId, date) {
    let updated
    setHabits(p => p.map(h => { if(h.id!==hId) return h; const c={...h.completions,[date]:h.completions[date]?0:1}; updated={...h,completions:c}; return updated }))
    if (!onlineRef.current||!updated) return
    await supabase.from('habits').update({ completions: updated.completions }).eq('id', hId)
  }
  async function deleteHabit(id) {
    setHabits(p => p.filter(h => h.id!==id))
    if (!onlineRef.current) return
    await supabase.from('habits').delete().eq('id', id)
  }

  async function addGoal(g) {
    const row = { ...g, id:'G'+Date.now() }
    setGoals(p => [...p, row])
    if (!onlineRef.current) return
    await supabase.from('goals').insert([row])
  }
  async function updateGoalProgress(id, val) {
    setGoals(p => p.map(g => g.id!==id ? g : { ...g, current:Math.min(g.target,Math.max(0,val)) }))
    if (!onlineRef.current) return
    await supabase.from('goals').update({ current:val }).eq('id', id)
  }
  async function deleteGoal(id) {
    setGoals(p => p.filter(g => g.id!==id))
    if (!onlineRef.current) return
    await supabase.from('goals').delete().eq('id', id)
  }

  async function addNote(n) {
    const row = { ...n, id:'N'+Date.now(), date:td() }
    setNotes(p => [row,...p])
    if (!onlineRef.current) return
    await supabase.from('notes').insert([row])
  }
  async function deleteNote(id) {
    setNotes(p => p.filter(n => n.id!==id))
    if (!onlineRef.current) return
    await supabase.from('notes').delete().eq('id', id)
  }

  return { tasks, habits, goals, notes, loading, online, addTask, toggleTask, deleteTask, addHabit, toggleHabit, deleteHabit, addGoal, updateGoalProgress, deleteGoal, addNote, deleteNote, reload:loadAll }
}
