import { useMemo, useState } from 'react'
import { track } from '../lib/analytics'
import { formatDate, formatMoney, productKey } from '../lib/format'
import { buildPriceIndex, bySupermarket, stats, type ProductHistory } from '../lib/prices'
import { useStore } from '../store'
import { PriceChart } from '../components/PriceChart'
import { ChartIcon, ChevronIcon, SearchIcon } from '../components/icons'
import { Button, EmptyState } from '../components/ui'

function Change({ value }: { value: number }) {
  if (Math.abs(value) < 0.005) return <span className="text-slate-600">estável</span>
  const up = value > 0
  return (
    <span className={up ? 'text-red-700' : 'text-emerald-700'}>
      {up ? '▲' : '▼'} {Math.abs(value * 100).toFixed(0)}%
    </span>
  )
}

export default function Prices() {
  const sessions = useStore((s) => s.sessions)
  const index = useMemo(() => buildPriceIndex(sessions), [sessions])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const products = useMemo(() => {
    const q = productKey(query)
    return [...index.values()]
      .filter((p) => !q || p.key.includes(q))
      .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name))
  }, [index, query])

  const product = selected ? index.get(selected) : undefined
  if (product) return <ProductDetail product={product} onBack={() => setSelected(null)} />

  if (index.size === 0) {
    return (
      <EmptyState icon={<ChartIcon width={32} height={32} />} title="Sem preços para comparar">
        Salve algumas compras e os preços de cada produto aparecerão aqui.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-2xl font-bold">Comparar preços</h1>
      <div className="relative">
        <label htmlFor="p-search" className="sr-only">
          Buscar produto
        </label>
        <SearchIcon className="pointer-events-none absolute top-3 left-3 text-slate-400" />
        <input
          id="p-search"
          type="search"
          placeholder="Buscar produto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block h-12 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-11 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
        />
      </div>
      {products.length === 0 ? (
        <p className="py-8 text-center text-slate-600">Nenhum produto encontrado.</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {products.map((p) => {
            const st = stats(p.points)
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(p.key)
                    track('price_comparison_used')
                  }}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-sm text-slate-600">
                      {p.points.length} {p.points.length === 1 ? 'registro' : 'registros'}
                      {p.points.length > 1 && (
                        <>
                          {' · '}
                          <Change value={st.change} />
                        </>
                      )}
                    </p>
                  </div>
                  <p className="tabular font-semibold">{formatMoney(st.last)}</p>
                  <ChevronIcon className="-rotate-90 text-slate-400" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ProductDetail({ product, onBack }: { product: ProductHistory; onBack: () => void }) {
  const st = stats(product.points)
  const markets = bySupermarket(product.points)

  return (
    <div className="space-y-4 pt-4">
      <Button variant="ghost" className="-ml-3" onClick={onBack}>
        <ChevronIcon className="rotate-90" /> Produtos
      </Button>
      <h1 className="text-2xl font-bold break-words">{product.name}</h1>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Menor', st.min],
          ['Média', st.avg],
          ['Maior', st.max],
        ].map(([label, v]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="tabular font-bold">{formatMoney(v as number)}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 font-semibold">Evolução do preço</h2>
        <p className="mb-2 text-sm text-slate-600">
          Último: <strong className="tabular">{formatMoney(st.last)}</strong>
          {product.points.length > 1 && (
            <>
              {' · desde o 1º registro '}
              <Change value={st.change} />
            </>
          )}
        </p>
        {product.points.length > 1 ? (
          <PriceChart points={product.points} title={product.name} />
        ) : (
          <p className="py-4 text-center text-sm text-slate-600">Registre este produto em mais compras para ver a evolução.</p>
        )}
      </section>

      {markets.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Por supermercado</h2>
          <ul className="divide-y divide-slate-100">
            {markets.map((m, i) => (
              <li key={m.supermarket} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.supermarket}
                    {i === 0 && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        mais barato
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-600">
                    último em {formatDate(m.last.date)}
                    {m.count > 1 && ` · média ${formatMoney(m.avg)}`}
                  </p>
                </div>
                <p className="tabular font-semibold">{formatMoney(m.last.price)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Todos os registros</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-1 font-medium">Data</th>
              <th className="py-1 font-medium">Supermercado</th>
              <th className="py-1 text-right font-medium">Preço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...product.points].reverse().map((p, i) => (
              <tr key={`${p.sessionId}-${i}`}>
                <td className="py-2 whitespace-nowrap">{formatDate(p.date)}</td>
                <td className="max-w-0 truncate px-2 py-2">{p.supermarket}</td>
                <td className="tabular py-2 text-right font-medium">{formatMoney(p.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
