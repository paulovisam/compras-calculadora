import { lazy, Suspense, useState, type ReactNode } from 'react'
import { storageAvailable } from './lib/storage'
import { useStore } from './store'
import Current from './pages/Current'
import { Onboarding } from './components/Onboarding'
import { CartIcon, ChartIcon, HistoryIcon } from './components/icons'

const History = lazy(() => import('./pages/History'))
const Prices = lazy(() => import('./pages/Prices'))

type Tab = 'current' | 'history' | 'prices'

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'current', label: 'Compra', icon: <CartIcon /> },
  { id: 'history', label: 'Histórico', icon: <HistoryIcon /> },
  { id: 'prices', label: 'Preços', icon: <ChartIcon /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('current')
  const onboarded = useStore((s) => s.onboarded)
  const finishOnboarding = useStore((s) => s.finishOnboarding)

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      {!storageAvailable && (
        <p role="alert" className="bg-amber-100 px-4 py-2 text-sm text-amber-900">
          O armazenamento do navegador está indisponível. Seus dados ficarão salvos apenas enquanto esta aba estiver
          aberta.
        </p>
      )}

      <main className="flex-1 px-4 pb-28">
        <Suspense
          fallback={
            <div className="flex justify-center py-16" role="status" aria-label="Carregando">
              <span className="size-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
            </div>
          }
        >
          {tab === 'current' && <Current onSaved={() => setTab('history')} />}
          {tab === 'history' && <History />}
          {tab === 'prices' && <Prices />}
        </Suspense>
      </main>

      <nav
        aria-label="Navegação principal"
        className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {tabs.map((t) => {
            const active = t.id === tab
            return (
              <li key={t.id}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    setTab(t.id)
                    window.scrollTo({ top: 0 })
                  }}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {!onboarded && <Onboarding onDone={finishOnboarding} />}
    </div>
  )
}
