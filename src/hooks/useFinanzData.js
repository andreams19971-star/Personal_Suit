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

  const setOnlineState = (val) => {
    onlineRef.current = val
    setOnline(val)
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [txRes, loanRes, balRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('loans').select('*').order('created_at', { ascending: false }),
        supabase.from('account_balances').select('*'),
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
      console.log(`[FinanzData] ✅ Online — ${txRes.data?.length||0} txs, ${loanRes.data?.length||0} loans`)
    } catch (err) {
      console.warn('[FinanzData] ❌ Offline →', err.message)
      const s = seed()
      setTransactions(s.transactions)
      setLoans(s.loans)
      setOnlineState(false)
    } finally {
      setLoading(false)
    }
  }

  async function updateAccountBalance(accountId, newBalance, meta = {}) {
    setAccountBalances(prev => ({
      ...prev,
      [accountId]: newBalance,
      [`${accountId}_meta`]: meta
    }))
    if (!onlineRef.current) return
    const row = {
      id: accountId,
      initial_balance: newBalance,
      updated_at: new Date().toISOString(),
      ...(meta.label ? { label: meta.label } : {}),
      ...(meta.icon  ? { icon:  meta.icon  } : {}),
      ...(meta.color ? { color: meta.color } : {}),
    }
    const { error } = await supabase
      .from('account_balances')
      .upsert(row)
    if (error) console.error('[updateAccountBalance]', error.message)
    else console.log('[updateAccountBalance] ✅', accountId)
  }

  async function addTransaction(tx) {
    const newTx = { ...tx, id:'tx-'+Date.now() }
    setTransactions(prev => [newTx, ...prev])
    if (!onlineRef.current) {
      console.warn('[addTransaction] ⚠️ offline — solo local')
      return
    }
    console.log('[addTransaction] Enviando a Supabase...', txToRow(newTx))
    const { error } = await supabase.from('transactions').insert([txToRow(newTx)])
    if (error) {
      console.error('[addTransaction] ❌ ERROR:', error.message, error.code, error.details)
    } else {
      console.log('[addTransaction] ✅ Guardado en Supabase')
    }
  }

  async function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    if (!onlineRef.current) return
    await supabase.from('transactions').delete().eq('id', id)
  }

  async function addLoan(data) {
    const loanId = 'L'+Date.now()
    const newLoan = { id:loanId, debtor:data.debtor, amount:data.amount, balance:data.amount, date:data.date, account:data.account, note:data.note||'', status:'active', payments:[] }
    const expTx   = { id:'tx-'+Date.now(), date:data.date, type:'expense', category:'loans_out', subcategory:data.subcategory||'Préstamo personal', account:data.account, amount:data.amount, note:'Préstamo a '+data.debtor, loanId }
    setLoans(prev        => [newLoan, ...prev])
    setTransactions(prev => [expTx,   ...prev])
    if (!onlineRef.current) return
    const [lr, tr] = await Promise.all([
      supabase.from('loans').insert([{ id:newLoan.id, debtor:newLoan.debtor, amount:newLoan.amount, balance:newLoan.balance, date:newLoan.date, account:newLoan.account, note:newLoan.note, status:newLoan.status, payments:[] }]),
      supabase.from('transactions').insert([txToRow(expTx)]),
    ])
    if (lr.error) console.error('[addLoan]', lr.error.message)
    if (tr.error) console.error('[addLoan tx]', tr.error.message)
    else console.log('[addLoan] ✓ guardado')
  }

  async function addPayment(loan, payData) {
    const amt = Math.min(parseFloat(payData.amount), loan.balance)
    if (!amt || amt <= 0) return
    const newBalance = Math.max(0, loan.balance - amt)
    const newPay     = { id:'P'+Date.now(), date:payData.date, amount:amt, note:payData.note||'' }
    const updLoan    = { ...loan, balance:newBalance, status:newBalance===0?'paid':'active', payments:[...(loan.payments||[]), newPay] }
    const incomeTx   = { id:'tx-'+Date.now(), date:payData.date, type:'income', category:'loan_pay', subcategory:payData.note||'Abono', account:payData.account, amount:amt, note:'Cobro a '+loan.debtor, loanId:loan.id }
    setLoans(prev        => prev.map(l => l.id !== loan.id ? l : updLoan))
    setTransactions(prev => [incomeTx, ...prev])
    if (!onlineRef.current) return
    const [lr, tr] = await Promise.all([
      supabase.from('loans').update({ balance:newBalance, status:updLoan.status, payments:updLoan.payments }).eq('id', loan.id),
      supabase.from('transactions').insert([txToRow(incomeTx)]),
    ])
    if (lr.error) console.error('[addPayment loan]', lr.error.message)
    if (tr.error) console.error('[addPayment tx]',   tr.error.message)
    else console.log('[addPayment] ✓ guardado')
  }

  return {
    transactions, loans, accountBalances, loading, online,
    addTransaction, deleteTransaction, addLoan, addPayment,
    updateAccountBalance, reload:loadAll
  }
}
