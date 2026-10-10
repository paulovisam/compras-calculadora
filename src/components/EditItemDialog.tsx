import { useEffect, useState, type FormEvent } from 'react'
import { useStore, type Item, type SessionRef } from '../store'
import { draftFromItem, emptyDraft, ItemFields, validateDraft, type ItemDraft, type ItemErrors } from './ItemFields'
import { Modal } from './Modal'
import { Button } from './ui'

interface Props {
  target: { ref: SessionRef; item: Item } | null
  onClose: () => void
}

export function EditItemDialog({ target, onClose }: Props) {
  const updateItem = useStore((s) => s.updateItem)
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)
  const [errors, setErrors] = useState<ItemErrors>({})

  const item = target?.item
  useEffect(() => {
    if (item) {
      setDraft(draftFromItem(item))
      setErrors({})
    }
  }, [item])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!target) return
    const { errors, value } = validateDraft(draft)
    setErrors(errors)
    if (!value) return
    updateItem(target.ref, target.item.id, value)
    onClose()
  }

  return (
    <Modal open={!!target} onClose={onClose} title="Editar produto">
      <form onSubmit={submit} noValidate className="space-y-4">
        <ItemFields idPrefix="edit" draft={draft} errors={errors} onChange={setDraft} />
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
