import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

// ─── Datos de ejemplo para cuando no hay conexión ────────────────────────────
function seedTx() {
  const now = new Date(); let id = 1; const tx = [];
  const add = (days, type, cat, sub, acc, amount, note, loanId = null) => {
    const d = new Date(now); d.setDate(d.getDate() - days);
    tx.push({ id: 'seed-' + id++, date: d.toISOString().slice(0,10), type, category: cat, subcategory: sub, account: acc, amount, note, loan_id: loanId });
  };
  add(0,"income","salary","Empresa","bancolombia",4200000,"Sueldo mensual");
  add(1,"expense","food","Mercado","nequi",320000,"Éxito");
  add(2,"expense","transport","Gasolina","cash",85000,"Full tanque");
  add(3,"expense","housing","Arriendo","bbva",950000,"Arriendo mes");
  add(5,"income","business","Ventas","nequi",800000,"Proyecto web");
  add(14,"expense","savings","Fondo emergencia","savings_acc",400000,"Ahorro");
  add(16,"expense","debt","Tarjeta crédito","bbva",650000,"Pago tarjeta");
  return tx;
}

function seedLoans() {
  const now = new Date();
  const d = days => { const x = new Date(now); x.setDate(x.getDate()-days); return x.toISOString().slice(0,10); };
  return [
    { id:"L1", debtor:"Carlos Rodríguez", amount:500000, balance:500000, date:d(45), account:"cash", note:"Préstamo personal", status:"active", payments:[] },
    { id:"L2", debtor:"María González", amount:1200000, balance:800000, date:d(60), account:"nequi", note:"Auxilio médico", status:"active", payments:[
      { id:"P1", date:d(30), amount:200000, note:"Primer abono" },
      { id:"P2", date:d(10), amount:200000, note:"Segundo abono" },
    ]},
  ];
}

export function useFinanzData() {
  const [transactions, setTransactions] = useState([])
  const [loans, setLoans]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [online, setOnline]             = useState(true)

  // ── Cargar datos ──
  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [{ data: txData, error: txErr }, { data: loanData, error: loanErr }] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('loans').select('*').order('created_at', { ascending: false }),
      ])
      if (txErr || loanErr) throw txErr || loanErr
      setTransactions(txData || [])
      setLoans((loanData || []).map(l => ({ ...l, payments: l.payments || [] })))
      setOnline(true)
    } catch (err) {
      console.warn('Supabase no disponible, usando datos locales:', err.message)
      setTransactions(seedTx())
      setLoans(seedLoans())
      setOnline(false)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Agregar transacción ──
  async function addTransaction(tx) {
    const newTx = { ...tx, id: 'tx-' + Date.now() }
    setTransactions(prev => [newTx, ...prev]) // optimistic update
    if (!online) return
    const { error } = await supabase.from('transactions').insert([{
      id: newTx.id,
      date: newTx.date,
      type: newTx.type,
      category: newTx.category,
      subcategory: newTx.subcategory || null,
      account: newTx.account,
      amount: newTx.amount,
      note: newTx.note || null,
      loan_id: newTx.loanId || null,
    }])
    if (error) console.error('Error guardando transacción:', error)
  }

  // ── Eliminar transacción ──
  async function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    if (!online) return
    await supabase.from('transactions').delete().eq('id', id)
  }

  // ── Agregar préstamo ──
  async function addLoan(data) {
    const loanId = 'L' + Date.now()
    const newLoan = {
      id: loanId, debtor: data.debtor, amount: data.amount,
      balance: data.amount, date: data.date, account: data.account,
      note: data.note || '', status: 'active', payments: []
    }
    const expTx = {
      id: 'tx-' + Date.now(), date: data.date, type: 'expense',
      category: 'loans_out', subcategory: data.subcategory || 'Préstamo personal',
      account: data.account, amount: data.amount,
      note: `Préstamo a ${data.debtor}`, loan_id: loanId
    }
    setLoans(prev => [newLoan, ...prev])
    setTransactions(prev => [expTx, ...prev])
    if (!online) return
    await Promise.all([
      supabase.from('loans').insert([{ ...newLoan, payments: JSON.stringify([]) }]),
      supabase.from('transactions').insert([{ ...expTx, loan_id: loanId }]),
    ])
  }

  // ── Registrar pago de préstamo ──
  async function addPayment(loan, payData) {
    const amt = Math.min(parseFloat(payData.amount), loan.balance)
    if (!amt || amt <= 0) return
    const newBalance = Math.max(0, loan.balance - amt)
    const newPayment = { id: 'P' + Date.now(), date: payData.date, amount: amt, note: payData.note || '' }
    const updatedLoan = {
      ...loan,
      balance: newBalance,
      status: newBalance === 0 ? 'paid' : 'active',
      payments: [...(loan.payments || []), newPayment]
    }
    const incomeTx = {
      id: 'tx-' + Date.now(), date: payData.date, type: 'income',
      category: 'loan_pay', subcategory: payData.note || 'Abono',
      account: payData.account, amount: amt,
      note: `Cobro a ${loan.debtor}`, loan_id: loan.id
    }
    setLoans(prev => prev.map(l => l.id !== loan.id ? l : updatedLoan))
    setTransactions(prev => [incomeTx, ...prev])
    if (!online) return
    await Promise.all([
      supabase.from('loans').update({
        balance: newBalance,
        status: updatedLoan.status,
        payments: JSON.stringify(updatedLoan.payments)
      }).eq('id', loan.id),
      supabase.from('transactions').insert([{ ...incomeTx, loan_id: loan.id }]),
    ])
  }

  return {
    transactions, loans, loading, error, online,
    addTransaction, deleteTransaction, addLoan, addPayment,
    reload: loadAll,
  }
}
