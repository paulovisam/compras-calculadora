import { useRef, useState, type PointerEvent } from 'react'
import { formatDate, formatDateShort, formatMoney } from '../lib/format'
import type { PricePoint } from '../lib/prices'

const W = 340
const H = 180
const PAD = { top: 10, right: 8, bottom: 24, left: 60 }

/** Linha de preço ao longo das compras (uma série), com tooltip por toque/hover. */
export function PriceChart({ points, title }: { points: PricePoint[]; title: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<number | null>(null)

  const prices = points.map((p) => p.price)
  let min = Math.min(...prices)
  let max = Math.max(...prices)
  if (min === max) {
    min = min * 0.9
    max = max * 1.1 || 1
  }
  const span = max - min
  min = Math.max(0, min - span * 0.1)
  max = max + span * 0.1

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH
  const ticks = [min, (min + max) / 2, max]
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ')

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    })
    setActive(best)
  }

  const a = active !== null ? points[active] : null
  const labelEvery = Math.ceil(points.length / 5)

  return (
    <figure>
      <figcaption className="tabular mb-1 h-5 text-sm text-slate-600" aria-live="polite">
        {a ? (
          <>
            <strong className="text-slate-900">{formatMoney(a.price)}</strong> · {a.supermarket} · {formatDate(a.date)}
          </>
        ) : (
          'Toque no gráfico para ver cada registro'
        )}
      </figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`Gráfico do preço de ${title} ao longo do tempo`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-slate-200" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[10px] tabular">
              {formatMoney(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={points.length > 1 && i === 0 ? 'start' : i === points.length - 1 && i > 0 ? 'end' : 'middle'}
              className="fill-slate-500 text-[10px] tabular"
            >
              {formatDateShort(p.date)}
            </text>
          ) : null,
        )}
        {a && (
          <line
            x1={x(active!)}
            x2={x(active!)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            className="stroke-slate-400"
            strokeDasharray="3 3"
          />
        )}
        <path d={path} fill="none" className="stroke-emerald-700" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.price)}
            r={active === i ? 6 : 4}
            className="fill-emerald-700 stroke-white"
            strokeWidth={2}
          />
        ))}
      </svg>
    </figure>
  )
}
