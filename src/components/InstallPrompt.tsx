import { useEffect, useState } from 'react'
import {
  dismissInstall,
  hasInstallPrompt,
  isIosSafari,
  isStandalone,
  onInstallAvailable,
  promptInstall,
  readDismissedAt,
  shouldOfferInstall,
} from '../lib/install'
import { CartIcon } from './icons'
import { Modal } from './Modal'
import { Button } from './ui'

const SHOW_DELAY_MS = 2000

export function InstallPrompt({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [ios, setIos] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let timer = 0
    const schedule = () => {
      window.clearTimeout(timer)
      const offer = shouldOfferInstall({
        standalone: isStandalone(),
        dismissedAt: readDismissedAt(),
        now: Date.now(),
        canPrompt: hasInstallPrompt(),
        ios: isIosSafari(),
      })
      setIos(isIosSafari())
      if (!offer) {
        setOpen(false)
        return
      }
      timer = window.setTimeout(() => {
        if (
          shouldOfferInstall({
            standalone: isStandalone(),
            dismissedAt: readDismissedAt(),
            now: Date.now(),
            canPrompt: hasInstallPrompt(),
            ios: isIosSafari(),
          })
        ) {
          setIos(isIosSafari())
          setOpen(true)
        }
      }, SHOW_DELAY_MS)
    }
    schedule()
    const stop = onInstallAvailable(schedule)
    return () => {
      window.clearTimeout(timer)
      stop()
    }
  }, [enabled])

  const dismiss = () => {
    dismissInstall()
    setOpen(false)
  }

  const install = async () => {
    setBusy(true)
    const outcome = await promptInstall()
    setBusy(false)
    if (outcome === 'accepted') {
      setOpen(false)
      return
    }
    dismiss()
  }

  return (
    <Modal open={open} onClose={dismiss} title="Instalar o app">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <CartIcon width={28} height={28} />
      </div>
      {ios ? <IosInstructions /> : <ChromeInstructions />}
      <div className={`mt-5 grid gap-3 ${ios ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {ios ? (
          <Button autoFocus onClick={dismiss}>
            Entendi
          </Button>
        ) : (
          <>
            <Button autoFocus className="order-2" onClick={install} disabled={busy}>
              Instalar
            </Button>
            <Button variant="ghost" className="order-1" onClick={dismiss} disabled={busy}>
              Agora não
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}

function ChromeInstructions() {
  return (
    <p className="text-slate-600">
      Abra a calculadora direto da tela inicial. Ela continua somando suas compras mesmo quando o supermercado estiver sem
      sinal.
    </p>
  )
}

function IosInstructions() {
  return (
    <div className="text-slate-600">
      <p>No Safari, adicione a calculadora à tela inicial:</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Toque em Compartilhar na barra do Safari.</li>
        <li>Role a lista e toque em Adicionar à Tela de Início.</li>
        <li>Confirme em Adicionar.</li>
      </ol>
    </div>
  )
}
