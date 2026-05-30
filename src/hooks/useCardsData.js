import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const DEFAULT_CARDS = [
  { id:'C1', name:'Visa Bancolombia', bank:'Bancolombia', last4:'4521', color:'#FFD166', limit:5000000, cutDay:25, payDay:10, balance:0, charges:[] },
  { id:'C2', name:'Mastercard BBVA',  bank:'BBVA',        last4:'8834', color:'#60A5FA', limit:8000000, cutDay:15, payDay:5,  balance:0, charges:[] },
]

export function useCardsData() {
  const [cards,   setCards]   = useState([])
  const [loading, setLoading] = useState(true)
  const [online,  setOnline]  = useState(false)
  const onlineRef = useRef(false)
  const setOnlineState = v => { onlineRef.current = v; setOnline(v) }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [cr, chr] = await Promise.all([
        supabase.from('credit_cards').select('*').order('created_at'),
        supabase.from('card_charges').select('*').order('date', { ascending: false }),
      ])
      if (cr.error || chr.error) throw new Error((cr.error || chr.error).message)

      let loadedCards = cr.data || []
      if (loadedCards.length === 0) {
        const { data: inserted } = await supabase.from('credit_cards').insert(
          DEFAULT_CARDS.map(c => ({ id:c.id, name:c.name, bank:c.bank, last4:c.last4, color:c.color, card_limit:c.limit, cut_day:c.cutDay, pay_day:c.payDay, balance:0 }))
        ).select()
        loadedCards = inserted || []
      }

      const chargesByCard = {}
      ;(chr.data || []).forEach(ch => {
        if (!chargesByCard[ch.card_id]) chargesByCard[ch.card_id] = []
        chargesByCard[ch.card_id].push({ id:ch.id, date:ch.date, amount:Number(ch.amount), category:ch.category, note:ch.note||'', installments:ch.installments||1 })
      })

      setCards(loadedCards.map(c => ({
        id: c.id, name: c.name, bank: c.bank, last4: c.last4,
        color: c.color, limit: Number(c.card_limit),
        cutDay: c.cut_day, payDay: c.pay_day,
        balance: Number(c.balance),
        charges: chargesByCard[c.id] || [],
      })))
      setOnlineState(true)
      console.log('[CardsData] ✅ Online')
    } catch(err) {
      console.warn('[CardsData] Offline →', err.message)
      setCards(DEFAULT_CARDS)
      setOnlineState(false)
    } finally { setLoading(false) }
  }

  async function addCharge(cardId, charge) {
    const localId = 'local-ch-' + Date.now()
    const row = { ...charge, id:localId, card_id:cardId }
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      return { ...c, balance:(c.balance||0)+charge.amount, charges:[row,...(c.charges||[])] }
    }))
    if (!onlineRef.current) return { error:'Sin conexión' }
    const { data, error } = await supabase.from('card_charges').insert([{
      card_id:cardId, date:charge.date, amount:charge.amount,
      category:charge.category, note:charge.note||'', installments:charge.installments||1
    }]).select().single()
    if (error) {
      console.error('[addCharge] ❌', error.message)
      setCards(prev => prev.map(c => c.id!==cardId ? c : {...c,
        balance:Math.max(0,(c.balance||0)-charge.amount),
        charges:(c.charges||[]).filter(x=>x.id!==localId)
      }))
      return { error: error.message }
    }
    // Reemplazar ID local con UUID real
    setCards(prev => prev.map(c => c.id!==cardId ? c : {...c,
      charges:(c.charges||[]).map(ch => ch.id===localId ? {...ch,id:data.id} : ch)
    }))
    // Actualizar balance en credit_cards
    const card = cards.find(c => c.id === cardId)
    if (card) await supabase.from('credit_cards').update({ balance:(card.balance||0)+charge.amount }).eq('id', cardId)
    return { data }
  }

  async function deleteCharge(cardId, chargeId) {
    let amount = 0
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      const ch = c.charges.find(x => x.id === chargeId)
      amount = ch?.amount || 0
      return { ...c, balance: Math.max(0, (c.balance||0) - amount), charges: c.charges.filter(x => x.id !== chargeId) }
    }))
    if (!onlineRef.current) return
    await supabase.from('card_charges').delete().eq('id', chargeId)
    const card = cards.find(c => c.id === cardId)
    if (card) await supabase.from('credit_cards').update({ balance: Math.max(0, (card.balance||0) - amount) }).eq('id', cardId)
  }

  async function markPaid(cardId) {
    setCards(prev => prev.map(c => c.id !== cardId ? c : { ...c, balance: 0, charges: [] }))
    if (!onlineRef.current) return
    await supabase.from('card_charges').delete().eq('card_id', cardId)
    await supabase.from('credit_cards').update({ balance: 0 }).eq('id', cardId)
  }

  async function saveCard(cardId, updates) {
    setCards(prev => prev.map(c => c.id !== cardId ? c : { ...c, ...updates }))
    if (!onlineRef.current) return
    await supabase.from('credit_cards').update({
      name: updates.name, bank: updates.bank, last4: updates.last4,
      color: updates.color, card_limit: updates.limit,
      cut_day: updates.cutDay, pay_day: updates.payDay,
    }).eq('id', cardId)
  }

  async function addCard(data) {
    const localId = 'local-card-' + Date.now()
    const newCard = { ...data, id:localId, balance:0, charges:[] }
    setCards(prev => [...prev, newCard])
    if (!onlineRef.current) return { error:'Sin conexión' }
    const { data:saved, error } = await supabase.from('credit_cards').insert([{
      name:data.name, bank:data.bank, last4:data.last4, color:data.color,
      card_limit:data.limit, cut_day:data.cutDay, pay_day:data.payDay, balance:0
    }]).select().single()
    if (error) {
      console.error('[addCard] ❌', error.message)
      setCards(prev => prev.filter(c => c.id !== localId))
      return { error: error.message }
    }
    setCards(prev => prev.map(c => c.id===localId ? {...newCard,id:saved.id} : c))
    return { data: saved }
  }

  async function updateCharge(cardId, chargeId, updates) {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      const old = c.charges.find(ch => ch.id === chargeId)
      const diff = updates.amount - (old?.amount || 0)
      return { ...c, balance: (c.balance||0)+diff,
        charges: c.charges.map(ch => ch.id !== chargeId ? ch : {...ch,...updates}) }
    }))
    if (!onlineRef.current) return
    await supabase.from('card_charges').update({
      date: updates.date, amount: updates.amount,
      category: updates.category, note: updates.note||'', installments: updates.installments||1
    }).eq('id', chargeId)
    const card = cards.find(c => c.id === cardId)
    if (card) {
      const old = card.charges.find(ch => ch.id === chargeId)
      await supabase.from('credit_cards').update({
        balance: (card.balance||0) + updates.amount - (old?.amount||0)
      }).eq('id', cardId)
    }
  }

  return { cards, loading, online, addCharge, deleteCharge, updateCharge, markPaid, saveCard, addCard, reload:loadAll }
}
