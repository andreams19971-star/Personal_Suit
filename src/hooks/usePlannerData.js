import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

export function usePlannerData() {
  const [tasks,  setTasks]  = useState([])
  const [habits, setHabits] = useState([])
  const [goals,  setGoals]  = useState([])
  const [notes,  setNotes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [online,  setOnline]  = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [
        { data: tData, error: tErr },
        { data: hData, error: hErr },
        { data: gData, error: gErr },
        { data: nData, error: nErr },
      ] = await Promise.all([
        supabase.from('tasks').select('*').order('date'),
        supabase.from('habits').select('*').order('created_at'),
        supabase.from('goals').select('*').order('deadline'),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
      ])
      if (tErr || hErr || gErr || nErr) throw tErr || hErr || gErr || nErr
      setTasks(tData || [])
      setHabits((hData || []).map(h => ({ ...h, completions: h.completions || {} })))
      setGoals(gData || [])
      setNotes(nData || [])
      setOnline(true)
    } catch (err) {
      console.warn('Usando datos locales:', err.message)
      setOnline(false)
      // Seed data
      const now = new Date()
      const d = days => { const x = new Date(now); x.setDate(x.getDate()+days); return x.toISOString().slice(0,10) }
      setTasks([
        { id:"T1", title:"Revisar extracto bancario", category:"finance", priority:"high", date:now.toISOString().slice(0,10), done:false, note:"" },
        { id:"T2", title:"Ir al médico control", category:"health", priority:"medium", date:now.toISOString().slice(0,10), done:false, note:"Cita 3pm" },
        { id:"T3", title:"Pagar servicios", category:"finance", priority:"high", date:d(3), done:false, note:"" },
      ])
      setHabits([
        { id:"H1", name:"Tomar agua", icon:"💧", target:8, unit:"vasos", color:"#60A5FA", completions:{} },
        { id:"H2", name:"Ejercicio", icon:"🏃", target:1, unit:"sesión", color:"#34D399", completions:{} },
        { id:"H3", name:"Leer", icon:"📚", target:30, unit:"minutos", color:"#A78BFA", completions:{} },
      ])
      setGoals([
        { id:"G1", title:"Ahorrar para viaje", icon:"✈️", target:5000000, current:1200000, deadline:d(120), color:"#60A5FA", category:"finance" },
        { id:"G2", title:"Leer 12 libros", icon:"📚", target:12, current:3, deadline:d(240), color:"#A78BFA", category:"personal" },
      ])
      setNotes([
        { id:"N1", title:"Ideas pendientes", content:"Anotar ideas aquí...", color:"#FBBF24", date:now.toISOString().slice(0,10) },
      ])
    } finally {
      setLoading(false)
    }
  }

  // ── TASKS ──
  async function addTask(task) {
    const t = { ...task, id: 'T'+Date.now(), done: false }
    setTasks(prev => [t, ...prev])
    if (!online) return
    await supabase.from('tasks').insert([t])
  }
  async function toggleTask(id) {
    let updated
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      updated = { ...t, done: !t.done }
      return updated
    }))
    if (!online || !updated) return
    await supabase.from('tasks').update({ done: updated.done }).eq('id', id)
  }
  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (!online) return
    await supabase.from('tasks').delete().eq('id', id)
  }

  // ── HABITS ──
  async function addHabit(habit) {
    const h = { ...habit, id: 'H'+Date.now(), completions: {} }
    setHabits(prev => [...prev, h])
    if (!online) return
    await supabase.from('habits').insert([{ ...h, completions: '{}' }])
  }
  async function toggleHabit(hId, date) {
    let updated
    setHabits(prev => prev.map(h => {
      if (h.id !== hId) return h
      const completions = { ...h.completions, [date]: h.completions[date] ? 0 : 1 }
      updated = { ...h, completions }
      return updated
    }))
    if (!online || !updated) return
    await supabase.from('habits').update({ completions: JSON.stringify(updated.completions) }).eq('id', hId)
  }
  async function deleteHabit(id) {
    setHabits(prev => prev.filter(h => h.id !== id))
    if (!online) return
    await supabase.from('habits').delete().eq('id', id)
  }

  // ── GOALS ──
  async function addGoal(goal) {
    const g = { ...goal, id: 'G'+Date.now() }
    setGoals(prev => [...prev, g])
    if (!online) return
    await supabase.from('goals').insert([g])
  }
  async function updateGoalProgress(id, val) {
    setGoals(prev => prev.map(g => g.id !== id ? g : { ...g, current: Math.min(g.target, Math.max(0, val)) }))
    if (!online) return
    await supabase.from('goals').update({ current: val }).eq('id', id)
  }
  async function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
    if (!online) return
    await supabase.from('goals').delete().eq('id', id)
  }

  // ── NOTES ──
  async function addNote(note) {
    const n = { ...note, id: 'N'+Date.now(), date: new Date().toISOString().slice(0,10) }
    setNotes(prev => [n, ...prev])
    if (!online) return
    await supabase.from('notes').insert([n])
  }
  async function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (!online) return
    await supabase.from('notes').delete().eq('id', id)
  }

  return {
    tasks, habits, goals, notes, loading, online,
    addTask, toggleTask, deleteTask,
    addHabit, toggleHabit, deleteHabit,
    addGoal, updateGoalProgress, deleteGoal,
    addNote, deleteNote,
    reload: loadAll,
  }
}
