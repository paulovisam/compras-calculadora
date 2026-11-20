import { useRef, useState, type ChangeEvent } from 'react'
import {
  BACKUP_INVALID_MESSAGE,
  backupFilename,
  canExportBackup,
  parseBackup,
  restoreMessage,
  serializeBackup,
  type BackupFile,
} from '../lib/backup'
import { todayISO } from '../lib/format'
import { useStore } from '../store'
import { ConfirmDialog } from './ConfirmDialog'
import { Button } from './ui'

const SHARE_FAILED = 'O arquivo foi baixado, mas o compartilhamento não abriu.'

export function BackupActions({ onRestored }: { onRestored?: () => void }) {
  const current = useStore((s) => s.current)
  const sessions = useStore((s) => s.sessions)
  const replaceBackup = useStore((s) => s.replaceBackup)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState<BackupFile | null>(null)
  const exportable = canExportBackup(sessions.length, current.length)

  const onExport = async () => {
    setError(undefined)
    const filename = backupFilename(todayISO())
    const json = serializeBackup(current, sessions, new Date().toISOString())
    const file = new File([json], filename, { type: 'application/json' })
    const sharePromise = startShare(file)
    downloadBackup(filename, json)
    if (!sharePromise) return
    try {
      await sharePromise
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(SHARE_FAILED)
    }
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    let text: string
    try {
      text = await file.text()
    } catch {
      setPending(null)
      setError(BACKUP_INVALID_MESSAGE)
      return
    }
    const result = parseBackup(text)
    if (!result.ok) {
      setPending(null)
      setError(result.error)
      return
    }
    setError(undefined)
    setPending(result.backup)
  }

  return (
    <div>
      <div className={exportable ? 'grid grid-cols-2 gap-3' : undefined}>
        {exportable && (
          <Button variant="secondary" onClick={onExport}>
            Fazer backup
          </Button>
        )}
        <Button variant="secondary" className={exportable ? undefined : 'w-full'} onClick={() => fileRef.current?.click()}>
          Restaurar backup
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Arquivo de backup"
        onChange={onFile}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={!!pending}
        title="Restaurar backup?"
        message={pending ? restoreMessage(sessions.length, pending.sessions.length, pending.current.length) : ''}
        confirmLabel="Substituir"
        onConfirm={() => {
          if (!pending) return
          replaceBackup(pending)
          onRestored?.()
        }}
        onClose={() => setPending(null)}
      />
    </div>
  )
}

function downloadBackup(filename: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function startShare(file: File): Promise<void> | null {
  if (!canShareFile(file)) return null
  try {
    return navigator.share({ files: [file], title: 'Backup das compras' })
  } catch (caught) {
    return Promise.reject(caught)
  }
}

function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}
