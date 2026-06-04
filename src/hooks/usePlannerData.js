import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10) }
const today  = () => new Date().toISOString().slice(0,10)
const C   = { accent:'#60A5FA', green:'#34D399', purple:'#A78BFA', yellow:'#FBBF24' }

function seed() {
  return {
    tasks: [
      { id:'t1', title:'Revisar extracto bancario', category:'finance',  priority:'high',   date:today(),    done:false, note:'' },
      { id:'t2', title:'Médico control',            category:'health',   priority:'medium', date:today(),    done:false, note:'3pm' },
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
      { id:'n1', title:'Ideas de negocio', content:'App delivery mascotas, consultoría financiera...', color:C.yellow, date:today() },
      { id:'n2', title:'Lista mercado',    content:'Arroz, fríjoles, aceite, pollo, verduras',         color:C.green,  date:today() },
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
      const loadTable = async (table) => {
        try {
          let res = await supabase.from(table).select('*').eq('user_id', userId).order('created_at', { ascending: false })
          if (res.error) {
            console.warn('[PlannerData]', table, 'created_at fallback:', res.error.message)
            res = await supabase.from(table).select('*').eq('user_id', userId)
          }
          if (res.error) { console.warn('[PlannerData]', table, 'error:', res.error.message); return [] }
          return res.data || []
        } catch(e) { console.warn('[PlannerData]', table, 'catch:', e.message); return [] }
      }

      const [taskData, goalData, noteData, habitData] = await Promise.all([
        loadTable('tasks'),
        loadTable('goals'),
        loadTable('notes'),
        loadTable('habits'),
      ])

      setTasks(taskData.map(t => ({
        ...t,
        status: t.status || (t.done ? 'done' : 'pending'),
        done:   t.done || false,
      })))
      setGoals(goalData)
      setNotes(noteData)
      setHabits(habitData.map(h => ({ ...h, completions: parseComp(h.completions) })))
      setOnlineState(true)
      console.log('[PlannerData] ✅', taskData.length, 'tasks,', goalData.length, 'goals')
    } catch(err) {
      console.warn('[PlannerData] Error →', err.message)
      setOnlineState(false)
    } finally {
      setLoading(false)
    }
  }

  async function addTask(t) {
    if (!t.title?.trim()) return { error: 'El título es obligatorio' }
    // userId del ref (seteado en loadAll). El trigger de BD lo garantiza también.
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id;
    const localId = 'local-T-' + Date.now()
    const row = { id:localId, title:t.title, date:t.date||null, category:t.category||'other',
      priority:t.priority||'medium', note:t.note||null, done:false,
      ...(t.subcategory ? { subcategory:t.subcategory } : {}),
      status:'pending' }
    setTasks(p => [row, ...p])
    console.warn('[offline] intentando igualmente...')
    const { id:_skip, ...rowData } = row
    // Si 'status' o 'subcategory' no existen en BD, Supabase retorna error — intentar sin ellos
    let { data, error } = await supabase.from('tasks').insert([{...rowData, user_id:userId}]).select().single()
    if (error && (error.message.includes('status') || error.message.includes('subcategory'))) {
      const { status:_s, subcategory:_sc, ...safeRow } = rowData
      const res = await supabase.from('tasks').insert([{...safeRow, user_id:userId}]).select().single()
      data = res.data; error = res.error
    }
    if (error) {
      console.error('[addTask] ❌', error.message)
      setTasks(p => p.filter(t => t.id !== localId))
      return { error: error.message }
    }
    setTasks(p => p.map(t => t.id === localId ? data : t))
    console.log('[addTask] ✅', data.id)
    return { data }
  }
  async function setTaskStatus(id, status) {
    const done = status === 'done'
    setTasks(p => p.map(t => t.id!==id ? t : {...t, status, done}))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('tasks').update({ status, done }).eq('id', id)
  }
  async function toggleTask(id) {
    const CYCLE = { pending:'in_progress', in_progress:'done', done:'pending', archived:'pending' }
    let nextStatus = 'pending'
    setTasks(p => p.map(t => {
      if (t.id!==id) return t
      nextStatus = CYCLE[t.status||'pending'] || 'pending'
      return {...t, status:nextStatus, done:nextStatus==='done'}
    }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('tasks').update({ status:nextStatus, done:nextStatus==='done' }).eq('id', id)
  }
  async function deleteTask(id) {
    setTasks(p => p.filter(t => t.id!==id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('tasks').delete().eq('id', id)
  }
  async function updateTask(id, updates) {
    setTasks(p => p.map(t => t.id!==id ? t : {...t, ...updates}))
    if (!onlineRef.current) return { error:'Sin conexión' }
    const { error } = await supabase.from('tasks').update({
      title:t.title, date:updates.date, category:updates.category,
      subcategory:updates.subcategory||null, priority:updates.priority,
      note:updates.note||null,
    }).eq('id', id)
    if (error) { console.error('[updateTask] ❌', error.message); return { error:error.message } }
    return { data:true }
  }

  async function addHabit(h) {
    const localId = 'local-H-' + Date.now()
    const local = { ...h, id:localId, completions:{} }
    setHabits(p => [...p, local])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { id:_skip, ...rowData } = local
    const { data, error } = await supabase.from('habits').insert([{...rowData, user_id:userId, completions:{}}]).select().single()
    if (error) { console.error('[addHabit] ❌', error.message); setHabits(p=>p.filter(h=>h.id!==localId)); return }
    setHabits(p => p.map(h => h.id===localId ? data : h))
  }
  async function toggleHabit(hId, date) {
    let updated
    setHabits(p => p.map(h => { if(h.id!==hId) return h; const c={...h.completions,[date]:h.completions[date]?0:1}; updated={...h,completions:c}; return updated }))
    if (!onlineRef.current||!updated) return
    await supabase.from('habits').update({ completions: updated.completions }).eq('id', hId)
  }
  async function deleteHabit(id) {
    setHabits(p => p.filter(h => h.id!==id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('habits').delete().eq('id', id)
  }

  async function addGoal(g) {
    const localId = 'local-G-' + Date.now()
    const local = { ...g, id:localId }
    setGoals(p => [...p, local])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { id:_skip, ...rowData } = local
    const { data, error } = await supabase.from('goals').insert([{...rowData, user_id:userId}]).select().single()
    if (error) { console.error('[addGoal] ❌', error.message); setGoals(p=>p.filter(g=>g.id!==localId)); return }
    setGoals(p => p.map(g => g.id===localId ? data : g))
  }
  async function updateGoalProgress(id, val) {
    setGoals(p => p.map(g => g.id!==id ? g : { ...g, current:Math.min(g.target,Math.max(0,val)) }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('goals').update({ current:val }).eq('id', id)
  }
  async function deleteGoal(id) {
    setGoals(p => p.filter(g => g.id!==id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('goals').delete().eq('id', id)
  }

  async function addNote(n) {
    const localId = 'local-N-' + Date.now()
    const local = { ...n, id:localId, date:today() }
    setNotes(p => [local,...p])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { id:_skip, ...rowData } = local
    const { data, error } = await supabase.from('notes').insert([{...rowData, user_id:userId}]).select().single()
    if (error) { console.error('[addNote] ❌', error.message); setNotes(p=>p.filter(n=>n.id!==localId)); return }
    setNotes(p => p.map(n => n.id===localId ? data : n))
  }
  async function deleteNote(id) {
    setNotes(p => p.filter(n => n.id!==id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('notes').delete().eq('id', id)
  }

  return { tasks, habits, goals, notes, loading, online, addTask, toggleTask, setTaskStatus, deleteTask, updateTask, addHabit, toggleHabit, deleteHabit, addGoal, updateGoalProgress, deleteGoal, addNote, deleteNote, reload:loadAll }
}
