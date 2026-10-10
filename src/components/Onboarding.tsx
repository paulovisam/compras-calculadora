import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CartIcon, ChartIcon, HistoryIcon, SaveIcon } from './icons'
import { Button } from './ui'

const steps = [
  {
    icon: <CartIcon width={32} height={32} />,
    title: 'Some enquanto compra',
    text: 'Adicione produtos com nome, preço e quantidade. O formulário fica aberto para você lançar um item atrás do outro.',
  },
  {
    icon: <SaveIcon width={32} height={32} />,
    title: 'Salve cada compra',
    text: 'No caixa, toque em “Salvar compra” e informe o supermercado. A data é preenchida automaticamente.',
  },
  {
    icon: <HistoryIcon width={32} height={32} />,
    title: 'Consulte o histórico',
    text: 'Veja suas compras anteriores e filtre por supermercado ou período.',
  },
  {
    icon: <ChartIcon width={32} height={32} />,
    title: 'Compare preços',
    text: 'Acompanhe como o preço de cada produto muda ao longo do tempo e em cada mercado. Seus dados ficam só no seu aparelho.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === steps.length - 1
  const s = steps[step]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-48 flex-col items-center text-center"
          >
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              {s.icon}
            </div>
            <h2 id="onb-title" className="mb-2 text-xl font-bold">
              {s.title}
            </h2>
            <p className="text-slate-600">{s.text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="my-5 flex justify-center gap-2" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-700' : 'w-2 bg-slate-300'}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={onDone}>
            Pular
          </Button>
          <Button autoFocus onClick={() => (last ? onDone() : setStep(step + 1))}>
            {last ? 'Começar' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
