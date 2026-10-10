import { useState } from 'react'
import { formatMoney, parseNumber } from '../lib/format'
import type { ItemInput } from '../store'
import { Field } from './ui'

export interface ItemDraft {
  name: string
  price: string
  quantity: string
}

export type ItemErrors = Partial<Record<keyof ItemDraft, string>>

export const emptyDraft: ItemDraft = { name: '', price: '', quantity: '1' }

export function draftFromItem(i: ItemInput): ItemDraft {
  return {
    name: i.name,
    price: i.price.toFixed(2).replace('.', ','),
    quantity: String(i.quantity).replace('.', ','),
  }
}

export function validateDraft(d: ItemDraft): { errors: ItemErrors; value?: ItemInput } {
  const errors: ItemErrors = {}
  const trimmed = d.name.trim().replace(/\s+/g, ' ')
  const name = trimmed.charAt(0).toLocaleUpperCase('pt-BR') + trimmed.slice(1)
  const price = parseNumber(d.price)
  const quantity = parseNumber(d.quantity)
  if (!name) errors.name = 'Informe o nome do produto'
  else if (name.length > 80) errors.name = 'Nome muito longo (máx. 80)'
  if (!d.price.trim()) errors.price = 'Informe o preço'
  else if (Number.isNaN(price) || price < 0) errors.price = 'Preço inválido'
  else if (price > 1_000_000) errors.price = 'Preço muito alto'
  if (!d.quantity.trim()) errors.quantity = 'Informe a quantidade'
  else if (Number.isNaN(quantity) || quantity <= 0) errors.quantity = 'Quantidade inválida'
  else if (quantity > 10_000) errors.quantity = 'Quantidade muito alta'
  if (Object.keys(errors).length) return { errors }
  return { errors, value: { name, price: Math.round(price * 100) / 100, quantity } }
}

interface Props {
  idPrefix: string
  draft: ItemDraft
  errors: ItemErrors
  onChange: (d: ItemDraft) => void
  suggestions?: string[]
  nameRef?: React.Ref<HTMLInputElement>
}

export function ItemFields({ idPrefix, draft, errors, onChange, suggestions, nameRef }: Props) {
  const [listId] = useState(() => `${idPrefix}-suggestions`)
  const price = parseNumber(draft.price)
  const qty = parseNumber(draft.quantity)
  const subtotal = !Number.isNaN(price) && !Number.isNaN(qty) ? price * qty : null

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field
        ref={nameRef}
        id={`${idPrefix}-name`}
        label="Produto"
        className="col-span-2"
        placeholder="Ex.: Arroz 5kg"
        autoComplete="off"
        enterKeyHint="next"
        list={suggestions?.length ? listId : undefined}
        value={draft.name}
        error={errors.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
      />
      {suggestions && suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      <Field
        id={`${idPrefix}-price`}
        label="Preço unitário (R$)"
        inputMode="decimal"
        placeholder="0,00"
        autoComplete="off"
        enterKeyHint="next"
        value={draft.price}
        error={errors.price}
        onChange={(e) => onChange({ ...draft, price: e.target.value })}
      />
      <Field
        id={`${idPrefix}-qty`}
        label="Quantidade"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        value={draft.quantity}
        error={errors.quantity}
        onChange={(e) => onChange({ ...draft, quantity: e.target.value })}
      />
      {subtotal !== null && subtotal > 0 && qty !== 1 && (
        <p className="tabular col-span-2 -mt-1 text-sm text-slate-600">
          Subtotal: <strong>{formatMoney(subtotal)}</strong>
        </p>
      )}
    </div>
  )
}
