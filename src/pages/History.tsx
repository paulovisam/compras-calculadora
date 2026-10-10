import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { track } from '../lib/analytics'
import { formatDate, formatMoney } from '../lib/format'
import { sortSessions, sumItems, useStore, type Item, type Session } from '../store'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EditItemDialog } from '../components/EditItemDialog'
import { ItemList } from '../components/ItemList'
import { Modal } from '../components/Modal'
import { ChevronIcon, HistoryIcon } from '../components/icons'
import { Button, EmptyState, Field } from '../components/ui'

const selectClass =
  'block h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'

export default function History() {
  const sessions = useStore((s) => s.sessions)
  const removeItem = useStore((s) => s.removeItem)
  const deleteSession = useStore((s) => s.deleteSession)

  const [market, setMarket] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ ref: string; item: Item } | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState<Session | null>(null)

  useEffect(() => track('history_viewed'), [])

  const markets = useMemo(() => [...new Set(sessions.map((s) => s.supermarket))].sort(), [sessions])
  const filtered = useMemo(
    () =>
      sortSessions(sessions).filter(
        (s) => (!market || s.supermarket === market) && (!from || s.date >= from) && (!to || s.date <= to),
      ),
    [sessions, market, from, to],
  )
  const totalSpent = filtered.reduce((acc, s) => acc + sumItems(s.items), 0)
  const hasFilters = market || from || to

  if (sessions.length === 0) {
    return (
      <EmptyState icon={<HistoryIcon width={32} height={32} />} title="Nenhuma compra salva ainda">
        Ao terminar suas compras, toque em “Salvar compra” para guardá-las aqui.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-2xl font-bold">Histórico</h1>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" open={!!hasFilters}>
        <summary className="flex min-h-8 cursor-pointer items-center justify-between font-semibold">
          Filtros {hasFilters && <span className="text-sm font-normal text-emerald-700">ativos</span>}
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="f-market" className="mb-1 block text-sm font-medium text-slate-700">
              Supermercado
            </label>
            <select id="f-market" className={selectClass} value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="">Todos</option>
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <Field id="f-from" label="De" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <Field id="f-to" label="Até" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          {hasFilters && (
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => {
                setMarket('')
                setFrom('')
                setTo('')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </details>

      <p className="tabular text-sm text-slate-600" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'compra' : 'compras'} · {formatMoney(totalSpent)} no total
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={<HistoryIcon width={32} height={32} />} title="Nenhuma compra encontrada">
          Ajuste os filtros para ver outras compras.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => {
            const open = expanded === s.id
            return (
              <li key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`session-${s.id}`}
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="flex min-h-16 w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.supermarket}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(s.date)} · {s.items.length} {s.items.length === 1 ? 'produto' : 'produtos'}
                    </p>
                  </div>
                  <p className="tabular font-bold">{formatMoney(sumItems(s.items))}</p>
                  <ChevronIcon className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`session-${s.id}`}
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-3 pb-3">
                        {s.items.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-600">Esta compra não tem produtos.</p>
                        ) : (
                          <ItemList
                            items={s.items}
                            onEdit={(item) => setEditingItem({ ref: s.id, item })}
                            onRemove={(item) => removeItem(s.id, item.id)}
                          />
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <Button variant="secondary" onClick={() => setEditingSession(s)}>
                            Editar dados
                          </Button>
                          <Button variant="secondary" className="text-red-700" onClick={() => setDeleting(s)}>
                            Excluir compra
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}

      <EditItemDialog target={editingItem} onClose={() => setEditingItem(null)} />
      <EditSessionDialog session={editingSession} markets={markets} onClose={() => setEditingSession(null)} />
      <ConfirmDialog
        open={!!deleting}
        title="Excluir compra?"
        message={deleting ? `A compra em ${deleting.supermarket} de ${formatDate(deleting.date)} será excluída permanentemente.` : ''}
        confirmLabel="Excluir"
        onConfirm={() => deleting && deleteSession(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

function EditSessionDialog({
  session,
  markets,
  onClose,
}: {
  session: Session | null
  markets: string[]
  onClose: () => void
}) {
  const updateSession = useStore((s) => s.updateSession)
  const [supermarket, setSupermarket] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (session) {
      setSupermarket(session.supermarket)
      setDate(session.date)
      setError(undefined)
    }
  }, [session])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!session) return
    if (!supermarket.trim()) return setError('Informe o nome do supermercado')
    updateSession(session.id, { supermarket: supermarket.trim(), date: date || session.date })
    onClose()
  }

  return (
    <Modal open={!!session} onClose={onClose} title="Editar compra">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field
          id="es-market"
          label="Supermercado"
          list="es-market-list"
          autoComplete="off"
          value={supermarket}
          error={error}
          onChange={(e) => setSupermarket(e.target.value)}
        />
        <datalist id="es-market-list">
          {markets.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <Field id="es-date" label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
