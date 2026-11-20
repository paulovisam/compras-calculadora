import { useMemo, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDate, formatMoney, productKey } from '../lib/format'
import { buildPriceIndex } from '../lib/prices'
import { sumItems, useStore, type Item } from '../store'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EditItemDialog } from '../components/EditItemDialog'
import { emptyDraft, ItemFields, validateDraft, type ItemDraft, type ItemErrors } from '../components/ItemFields'
import { ItemList } from '../components/ItemList'
import { SaveSessionDialog } from '../components/SaveSessionDialog'
import { CartIcon, PlusIcon, SaveIcon } from '../components/icons'
import { Button, EmptyState } from '../components/ui'

export default function Current({ onSaved }: { onSaved: () => void }) {
  const current = useStore((s) => s.current)
  const sessions = useStore((s) => s.sessions)
  const addItem = useStore((s) => s.addItem)
  const removeItem = useStore((s) => s.removeItem)
  const clearCurrent = useStore((s) => s.clearCurrent)

  const [formOpen, setFormOpen] = useState(current.length === 0)
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)
  const [errors, setErrors] = useState<ItemErrors>({})
  const [editing, setEditing] = useState<Item | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const flashTimer = useRef<number | undefined>(undefined)

  const priceIndex = useMemo(() => buildPriceIndex(sessions), [sessions])
  const suggestions = useMemo(() => [...priceIndex.values()].map((p) => p.name).sort(), [priceIndex])
  const lastSeen = priceIndex.get(productKey(draft.name))?.points.at(-1)

  const total = sumItems(current)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const { errors, value } = validateDraft(draft)
    setErrors(errors)
    if (!value) {
      const firstInvalid = (['name', 'price', 'quantity'] as const).find((k) => errors[k])
      document.getElementById(`add-${firstInvalid === 'quantity' ? 'qty' : firstInvalid}`)?.focus()
      return
    }
    addItem(value)
    setDraft(emptyDraft)
    setFlash(`${value.name} adicionado`)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1800)
    nameRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      {/* Total fixo no topo */}
      <section
        aria-live="polite"
        className="sticky top-0 z-10 -mx-4 bg-emerald-700 px-4 py-4 text-white shadow-md"
      >
        <p className="text-sm text-emerald-50">Total da compra</p>
        <div className="flex items-end justify-between gap-2">
          <p className="tabular text-4xl font-bold tracking-tight">{formatMoney(total)}</p>
          <p className="tabular pb-1 text-sm text-emerald-50">
            {current.length} {current.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
      </section>

      {!formOpen && (
        <Button className="w-full text-lg" onClick={() => setFormOpen(true)}>
          <PlusIcon /> Adicionar produto
        </Button>
      )}

      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.form
            key="form"
            onSubmit={submit}
            noValidate
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            aria-label="Adicionar produto"
          >
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Adicionar produto</h2>
                <button
                  type="button"
                  className="min-h-12 px-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setFormOpen(false)}
                >
                  Ocultar
                </button>
              </div>
              <ItemFields
                idPrefix="add"
                draft={draft}
                errors={errors}
                onChange={setDraft}
                suggestions={suggestions}
                nameRef={nameRef}
              />
              {lastSeen && (
                <p className="tabular rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Última vez: <strong>{formatMoney(lastSeen.price)}</strong> em {lastSeen.supermarket} (
                  {formatDate(lastSeen.date)})
                </p>
              )}
              <Button type="submit" className="w-full">
                <PlusIcon /> Adicionar
              </Button>
              <p className="h-5 text-center text-sm text-emerald-700" role="status">
                {flash}
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <section aria-labelledby="list-title" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <h2 id="list-title" className="sr-only">
          Produtos adicionados
        </h2>
        {current.length === 0 ? (
          <EmptyState icon={<CartIcon width={32} height={32} />} title="Seu carrinho está vazio">
            Adicione o primeiro produto para começar a somar.
          </EmptyState>
        ) : (
          <ItemList items={current} onEdit={setEditing} onRemove={(i) => removeItem(null, i.id)} />
        )}
      </section>

      {current.length > 0 && (
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Button variant="secondary" onClick={() => setClearOpen(true)}>
            Limpar
          </Button>
          <Button onClick={() => setSaveOpen(true)}>
            <SaveIcon /> Salvar compra
          </Button>
        </div>
      )}

      <EditItemDialog
        target={editing ? { ref: null, item: editing } : null}
        onClose={() => setEditing(null)}
      />
      <SaveSessionDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSaved={() => {
          setFormOpen(true)
          onSaved()
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        title="Limpar compra atual?"
        message="Todos os produtos adicionados serão removidos. Compras já salvas não são afetadas."
        confirmLabel="Limpar"
        onConfirm={clearCurrent}
        onClose={() => setClearOpen(false)}
      />

      <section aria-labelledby="guide-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
        <h2 id="guide-title" className="mb-2 text-base font-bold text-slate-900">
          Calculadora de Compras de Supermercado
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          Some os produtos no carrinho em tempo real pelo celular para manter o controle dos gastos e evitar surpresas no caixa.
        </p>

        <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
          <details className="group cursor-pointer">
            <summary className="font-semibold text-slate-800 hover:text-emerald-700">
              Como usar a calculadora no mercado?
            </summary>
            <p className="mt-1 pl-2 leading-relaxed text-slate-600">
              Ao colocar um item no carrinho, informe o nome, preço unitário e quantidade. O valor total é somado instantaneamente no topo.
            </p>
          </details>
          <details className="group cursor-pointer">
            <summary className="font-semibold text-slate-800 hover:text-emerald-700">
              Onde meus dados são salvos?
            </summary>
            <p className="mt-1 pl-2 leading-relaxed text-slate-600">
              Seus registros ficam salvos com total privacidade no armazenamento local do seu próprio aparelho, funcionando mesmo sem internet.
            </p>
          </details>
          <details className="group cursor-pointer">
            <summary className="font-semibold text-slate-800 hover:text-emerald-700">
              Como comparar preços entre supermercados?
            </summary>
            <p className="mt-1 pl-2 leading-relaxed text-slate-600">
              Ao concluir a compra, clique em &quot;Salvar compra&quot; e selecione o supermercado. Na aba &quot;Preços&quot;, você pode consultar onde cada item esteve mais barato.
            </p>
          </details>
        </div>
      </section>
    </div>
  )
}
