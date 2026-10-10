import { AnimatePresence, motion } from 'motion/react'
import { formatMoney, formatQty } from '../lib/format'
import { itemTotal, type Item } from '../store'
import { EditIcon, TrashIcon } from './icons'
import { IconButton } from './ui'

interface Props {
  items: Item[]
  onEdit: (item: Item) => void
  onRemove: (item: Item) => void
}

export function ItemList({ items, onEdit, onRemove }: Props) {
  return (
    <ul className="divide-y divide-slate-100">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1 py-2 pl-1">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.name}</p>
                <p className="tabular text-sm text-slate-600">
                  {formatQty(item.quantity)} × {formatMoney(item.price)}
                </p>
              </div>
              <p className="tabular px-1 font-semibold text-slate-900">{formatMoney(itemTotal(item))}</p>
              <IconButton label={`Editar ${item.name}`} onClick={() => onEdit(item)}>
                <EditIcon width={20} height={20} />
              </IconButton>
              <IconButton
                label={`Remover ${item.name}`}
                onClick={() => onRemove(item)}
                className="-ml-1 hover:text-red-700"
              >
                <TrashIcon width={20} height={20} />
              </IconButton>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
