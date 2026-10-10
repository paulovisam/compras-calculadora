import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatMoney, todayISO } from '../lib/format'
import { sortSessions, sumItems, useStore } from '../store'
import { Modal } from './Modal'
import { Button, Field } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function SaveSessionDialog({ open, onClose, onSaved }: Props) {
  const current = useStore((s) => s.current)
  const sessions = useStore((s) => s.sessions)
  const saveSession = useStore((s) => s.saveSession)
  const [supermarket, setSupermarket] = useState('')
  const [date, setDate] = useState(todayISO())
  const [errors, setErrors] = useState<{ supermarket?: string; date?: string }>({})

  const markets = useMemo(() => [...new Set(sessions.map((s) => s.supermarket))].sort(), [sessions])

  useEffect(() => {
    if (open) {
      setSupermarket(sortSessions(sessions)[0]?.supermarket ?? '')
      setDate(todayISO())
      setErrors({})
    }
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!supermarket.trim()) next.supermarket = 'Informe o nome do supermercado'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Data inválida'
    setErrors(next)
    if (Object.keys(next).length) return
    saveSession(supermarket, date)
    onClose()
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Salvar compra">
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="tabular text-slate-700">
          {current.length} {current.length === 1 ? 'produto' : 'produtos'} · Total{' '}
          <strong className="text-slate-900">{formatMoney(sumItems(current))}</strong>
        </p>
        <Field
          id="save-market"
          label="Supermercado"
          placeholder="Ex.: Mercado Central"
          autoComplete="off"
          list="save-market-list"
          value={supermarket}
          error={errors.supermarket}
          onChange={(e) => setSupermarket(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <datalist id="save-market-list">
          {markets.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <Field
          id="save-date"
          label="Data"
          type="date"
          value={date}
          max={todayISO()}
          error={errors.date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
