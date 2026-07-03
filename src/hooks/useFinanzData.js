import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase.js'

const ago = d => { const x = new Date(); x.setDate(x.getDate()-d); return x.toISOString().slice(0,10) }

function seed() {
  return {
    transactions: [
      { id:'s1', date:ago(0),  type:'income',  category:'salary',    subcategory:'Empresa',          account:'bancolombia', amount:4200000, note:'Sueldo mensual',    loanId:null },
      { id:'s2', date:ago(1),  type:'expense', category:'food',      subcategory:'Mercado',           account:'nequi',       amount:320000,  note:'Éxito',             loanId:null },
      { id:'s3', date:ago(2),  type:'expense', category:'transport', subcategory:'Gasolina',          account:'cash',        amount:85000,   note:'Full tanque',       loanId:null },
      { id:'s4', date:ago(3),  type:'expense', category:'housing',   subcategory:'Arriendo',          account:'bbva',        amount:950000,  note:'Arriendo mes',      loanId:null },
      { id:'s5', date:ago(4),  type:'expense', category:'entertain', subcategory:'Streaming',         account:'nequi',       amount:52900,   note:'Netflix',           loanId:null },
      { id:'s6', date:ago(5),  type:'income',  category:'business',  subcategory:'Ventas',            account:'nequi',       amount:800000,  note:'Proyecto web',      loanId:null },
      { id:'s7', date:ago(14), type:'expense', category:'savings',   subcategory:'Fondo emergencia',  account:'savings_acc', amount:400000,  note:'Ahorro',            loanId:null },
      { id:'s8', date:ago(16), type:'expense', category:'debt',      subcategory:'Tarjeta crédito',   account:'bbva',        amount:650000,  note:'Pago tarjeta',      loanId:null },
    ],
    loans: [
      { id:'L1', debtor:'Carlos Rodríguez', amount:500000,  balance:500000, date:ago(45), account:'cash',  note:'Préstamo personal', status:'active', payments:[] },
      { id:'L2', debtor:'María González',   amount:1200000, balance:800000, date:ago(60), account:'nequi', note:'Auxilio médico',    status:'active',
        payments:[ {id:'P1',date:ago(30),amount:200000,note:'1er abono'}, {id:'P2',date:ago(10),amount:200000,note:'2do abono'} ] },
    ]
  }
}

// Convierte row de Supabase → formato interno de la app
function rowToTx(r) {
  return { id:r.id, date:r.date, type:r.type, category:r.category, subcategory:r.subcategory, account:r.account, amount:Number(r.amount), note:r.note, loanId:r.loan_id }
}
function rowToLoan(r) {
  return { id:r.id, debtor:r.debtor, amount:Number(r.amount), balance:Number(r.balance), date:r.date, account:r.account, note:r.note, status:r.status, payments: Array.isArray(r.payments) ? r.payments : (typeof r.payments === 'string' ? JSON.parse(r.payments) : []) }
}
// Convierte formato interno → row para Supabase
function txToRow(tx) {
  return { id:tx.id, date:tx.date, type:tx.type, category:tx.category, subcategory:tx.subcategory||null, account:tx.account, amount:tx.amount, note:tx.note||null, loan_id:tx.loanId||null }
}

export function useFinanzData() {
  const [transactions, setTransactions] = useState([])
  const [loans,        setLoans]        = useState([])
  const [accountBalances, setAccountBalances] = useState({
    cash:0, nequi:0, bbva:0, daviplata:0, bancolombia:0, savings_acc:0
  })
  const [loading,      setLoading]      = useState(true)
  const [online,       setOnline]       = useState(false)
  const onlineRef = useRef(false)
  const userIdRef = useRef(null)

  const setOnlineState = (val) => {
    onlineRef.current = val
    setOnline(val)
  }

  useEffect(() => {
    loadAll()

    // Suscribirse a cambios en tiempo real en transactions
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('[FinanzData] Nueva transacción en tiempo real:', payload.new.id)
          setTransactions(prev => {
            // Evitar duplicados
            if (prev.find(t => t.id === payload.new.id)) return prev
            return [rowToTx(payload.new), ...prev]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { console.warn("[Data] No userId — skipping load"); return; }
    userIdRef.current = userId;
    setLoading(true)
    try {
      // Carga TODAS las transacciones — historial completo disponible
      const [txRes, loanRes, balRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId)
          .order('date', { ascending: false }),
        supabase.from('loans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('account_balances').select('*').eq('user_id', userId),
      ])
      if (txRes.error)   throw new Error('transactions: ' + txRes.error.message)
      if (loanRes.error) throw new Error('loans: '        + loanRes.error.message)
      setTransactions((txRes.data   || []).map(rowToTx))
      setLoans(       (loanRes.data || []).map(rowToLoan))
      if (!balRes.error && balRes.data?.length > 0) {
        const balMap = {}
        balRes.data.forEach(r => { balMap[r.id] = Number(r.initial_balance) })
        setAccountBalances(prev => ({ ...prev, ...balMap }))
      }
      setOnlineState(true)
      console.log("[FinanzData] ✅ Online — "+(txRes.data?.length||0)+" txs, "+(loanRes.data?.length||0)+" loans")
    } catch (err) {
      console.warn('[FinanzData] ❌ Offline →', err.message)
      setTransactions([]); setLoans([])
      setOnlineState(false)
    } finally { setLoading(false) }
  }

  // Carga transacciones de un mes específico bajo demanda
  async function loadMonth(yearMonth) {
    const userId = userIdRef.current
    if (!userId) return
    try {
      const from = yearMonth + '-01'
      const d    = new Date(yearMonth + '-01')
      d.setMonth(d.getMonth()+1)
      const to   = d.toISOString().slice(0,10)
      const { data, error } = await supabase.from('transactions').select('*')
        .eq('user_id', userId)
        .gte('date', from).lt('date', to)
        .order('date', { ascending: false })
      if (error) { console.warn('[FinanzData] loadMonth:', error.message); return }
      const newTxs = (data || []).map(rowToTx)
      setTransactions(prev => {
        const others = prev.filter(t => !t.date.startsWith(yearMonth))
        return [...others, ...newTxs].sort((a,b) => b.date.localeCompare(a.date))
      })
      console.log("[FinanzData] Mes "+yearMonth+" — "+newTxs.length+" txs cargadas")
    } catch(e) { console.warn('[FinanzData] loadMonth catch:', e.message) }
  }

  async function updateAccountBalance(accountId, newBalance, meta = {}) {
    setAccountBalances(prev => ({
      ...prev,
      [accountId]: newBalance,
      [accountId+"_meta"]: meta
    }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id
    const row = {
      id: accountId,
      user_id: userId,
      initial_balance: newBalance,
      updated_at: new Date().toISOString(),
      ...(meta.label ? { label: meta.label } : {}),
      ...(meta.icon  ? { icon:  meta.icon  } : {}),
      ...(meta.color ? { color: meta.color } : {}),
    }
    const { error } = await supabase
      .from('account_balances')
      .upsert(row, { onConflict: 'id' })
    if (error) {
      console.error('[updateAccountBalance]', error.message)
      return { error: error.message }
    }
    console.log('[updateAccountBalance] ✅', accountId)
    return { data: true }
  }

  async function addTransaction(tx) {
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id
    const localId = 'local-' + Date.now()
    const newTx = { ...tx, id: localId }
    setTransactions(prev => [newTx, ...prev])

    if (!onlineRef.current) {
      setTransactions(prev => prev.filter(t => t.id !== localId))
      return { error: 'Sin conexión — verifica tu internet e intenta de nuevo' }
    }

    const { id: _skip, ...rowData } = txToRow(newTx)
    const { data, error } = await supabase
      .from('transactions').insert([{ ...rowData, user_id: userId }]).select().single()

    if (error) {
      console.error('[addTransaction] ❌', error.message)
      setTransactions(prev => prev.filter(t => t.id !== localId))
      return { error: error.message }
    }
    setTransactions(prev => prev.map(t => t.id === localId ? rowToTx(data) : t))
    console.log('[addTransaction] ✅', data.id)
    return { data }
  }

  async function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    await supabase.from('transactions').delete().eq('id', id)
  }

  async function updateTransaction(id, updates) {
    setTransactions(prev => prev.map(t => t.id !== id ? t : { ...t, ...updates }))
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { error } = await supabase.from('transactions').update({
      date:        updates.date,
      type:        updates.type,
      category:    updates.category,
      subcategory: updates.subcategory || null,
      account:     updates.account,
      amount:      updates.amount,
      note:        updates.note || null,
    }).eq('id', id)
    if (error) console.error('[updateTransaction]', error.message)
    else console.log('[updateTransaction] ✅', id)
  }

  // ── Transferencia entre cuentas (NO ingreso ni gasto) ──
  async function addTransfer(from, to, amount, date, note) {
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id
    if (!userId) return { error: 'No autenticado' }
    if (from === to) return { error: 'La cuenta origen y destino deben ser diferentes' }
    // Dos transacciones tipo 'transfer' — no cuentan como ingreso ni gasto
    const base = { user_id:userId, date, amount, category:'transfer', note: note||'Transferencia', type:'transfer' }
    const [r1, r2] = await Promise.all([
      supabase.from('transactions').insert([{ ...base, account:from, subcategory:'transfer_out' }]).select().single(),
      supabase.from('transactions').insert([{ ...base, account:to,   subcategory:'transfer_in'  }]).select().single(),
    ])
    if (r1.error) { console.error('[addTransfer out]', r1.error.message); return { error: r1.error.message } }
    if (r2.error) { console.error('[addTransfer in]',  r2.error.message); return { error: r2.error.message } }
    setTransactions(prev => [rowToTx(r1.data), rowToTx(r2.data), ...prev])
    console.log('[addTransfer] ✅')
    return { data: true }
  }

  // ── Editar préstamo ──
  async function editLoan(loanId, updates) {
    setLoans(prev => prev.map(l => l.id !== loanId ? l : { ...l, ...updates }))
    const { error } = await supabase.from('loans').update({
      debtor:  updates.debtor,
      amount:  updates.amount,
      balance: updates.balance,
      account: updates.account,
      note:    updates.note || '',
      status:  updates.status || 'active',
    }).eq('id', loanId)
    if (error) { console.error('[editLoan]', error.message); return { error: error.message } }
    console.log('[editLoan] ✅', loanId)
    return { data: true }
  }

  // ── Eliminar préstamo ──
  async function deleteLoan(loanId) {
    setLoans(prev => prev.filter(l => l.id !== loanId))
    const { error } = await supabase.from('loans').delete().eq('id', loanId)
    if (error) { console.error('[deleteLoan]', error.message); return { error: error.message } }
    console.log('[deleteLoan] ✅', loanId)
    return { data: true }
  }

  async function addLoan(loanData) {
    const userId = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id
    const localLoanId = 'local-L-'+Date.now()
    const localTxId   = 'local-tx-'+Date.now()
    const newLoan = { id:localLoanId, debtor:loanData.debtor, amount:loanData.amount, balance:loanData.amount, date:loanData.date, account:loanData.account, note:loanData.note||'', status:'active', payments:[] }
    const expTx   = { id:localTxId, date:loanData.date, type:'expense', category:'loans_out', subcategory:loanData.subcategory||'Préstamo personal', account:loanData.account, amount:loanData.amount, note:'Préstamo a '+loanData.debtor, loanId:null }
    setLoans(prev        => [newLoan, ...prev])
    setTransactions(prev => [expTx,   ...prev])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const { data:lRow, error:le } = await supabase.from('loans')
      .insert([{ user_id:userId, debtor:newLoan.debtor, amount:newLoan.amount, balance:newLoan.balance, date:newLoan.date, account:newLoan.account, note:newLoan.note, status:newLoan.status, payments:[] }])
      .select().single()
    const { data:tRow, error:te } = await supabase.from('transactions')
      .insert([{ user_id:userId, date:expTx.date, type:expTx.type, category:expTx.category, subcategory:expTx.subcategory, account:expTx.account, amount:expTx.amount, note:expTx.note, loan_id:lRow?.id||null }])
      .select().single()
    if (le) console.error('[addLoan]', le.message)
    if (te) console.error('[addLoan tx]', te.message)
    if (!le && lRow) {
      setLoans(prev => prev.map(l => l.id===localLoanId ? {...newLoan, id:lRow.id} : l))
    }
    if (!te && tRow) {
      setTransactions(prev => prev.map(t => t.id===localTxId ? rowToTx(tRow) : t))
    }
    console.log('[addLoan] ✓', lRow?.id)
  }

  async function addPayment(loan, payData) {
    const userId  = userIdRef.current || (await supabase.auth.getSession()).data?.session?.user?.id
    const amt     = Math.min(parseFloat(payData.amount), loan.balance)
    if (!amt || amt <= 0) return
    const newBalance = Math.max(0, loan.balance - amt)
    const updLoan    = { ...loan, balance:newBalance, status:newBalance===0?'paid':'active', payments:[...(loan.payments||[]), { date:payData.date, amount:amt, note:payData.note||'' }] }
    const localTxId  = 'local-tx-'+Date.now()
    const incomeTx   = { id:localTxId, date:payData.date, type:'income', category:'loan_pay', subcategory:payData.note||'Abono', account:payData.account, amount:amt, note:'Cobro a '+loan.debtor, loanId:loan.id }
    setLoans(prev        => prev.map(l => l.id !== loan.id ? l : updLoan))
    setTransactions(prev => [incomeTx, ...prev])
    if (!onlineRef.current) console.warn('[offline] intentando igualmente...')
    const [lr, tr] = await Promise.all([
      supabase.from('loans').update({ balance:newBalance, status:updLoan.status, payments:updLoan.payments }).eq('id', loan.id),
      supabase.from('transactions').insert([{ user_id:userId, date:incomeTx.date, type:incomeTx.type, category:incomeTx.category, subcategory:incomeTx.subcategory, account:incomeTx.account, amount:incomeTx.amount, note:incomeTx.note, loan_id:loan.id }]).select().single(),
    ])
    if (lr.error) console.error('[addPayment loan]', lr.error.message)
    if (tr.error) console.error('[addPayment tx]',   tr.error.message)
    if (!tr.error && tr.data) setTransactions(prev => prev.map(t => t.id===localTxId ? rowToTx(tr.data) : t))
    else console.log('[addPayment] ✓')
  }

  return {
    transactions, loans, accountBalances, loading, online,
    addTransaction, deleteTransaction, updateTransaction, addLoan, addPayment,
    updateAccountBalance, loadMonth, addTransfer, editLoan, deleteLoan, reload:loadAll
  }
}
