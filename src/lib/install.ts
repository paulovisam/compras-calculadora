export const DISMISS_KEY = 'compras-pwa-dismissed-at'
/** Quanto tempo o convite fica em silêncio depois de "Agora não". */
export const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000

export interface InstallOffer {
  standalone: boolean
  dismissedAt: number | null
  now: number
  canPrompt: boolean
  ios: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = () => void

const listeners = new Set<Listener>()
let deferred: BeforeInstallPromptEvent | null = null

export function parseDismissedAt(raw: string | null): number | null {
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function shouldOfferInstall(input: InstallOffer): boolean {
  if (input.standalone) return false
  if (input.dismissedAt !== null && input.now - input.dismissedAt < DISMISS_FOR_MS) return false
  return input.canPrompt || input.ios
}

let memoryDismissedAt: number | null = null

export function readDismissedAt(): number | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = parseDismissedAt(localStorage.getItem(DISMISS_KEY))
      if (stored !== null) return stored
    }
  } catch {
    // modo privado ou cota cheia: vale a memória desta aba
  }
  return memoryDismissedAt
}

export function dismissInstall(now = Date.now()) {
  memoryDismissedAt = now
  try {
    localStorage.setItem(DISMISS_KEY, String(now))
  } catch {
    // preferência é só um lembrete; falhar aqui não impede o uso
  }
}

export function hasInstallPrompt(): boolean {
  return deferred !== null
}

export function onInstallAvailable(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred
  if (!event) return 'unavailable'
  deferred = null
  try {
    await event.prompt()
    const choice = await event.userChoice
    return choice.outcome
  } catch {
    return 'unavailable'
  } finally {
    notify()
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  const ios = /iPad|iPhone|iPod/.test(ua) || iPadOs
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/.test(ua)
  return ios && /WebKit/.test(ua) && !otherBrowser
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // sem service worker o app segue no navegador; o convite nativo é que não aparece
    })
  })
}

function notify() {
  listeners.forEach((listener) => listener())
}

function isPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  const candidate = event as BeforeInstallPromptEvent
  return typeof candidate.prompt === 'function' && typeof candidate.userChoice?.then === 'function'
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', ((event: Event) => {
    if (!isPromptEvent(event)) return
    event.preventDefault()
    deferred = event
    notify()
  }) as EventListener)

  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}
