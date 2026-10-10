import { productKey } from './format'
import type { Session } from '../store'

export interface PricePoint {
  sessionId: string
  date: string
  supermarket: string
  price: number
}

export interface ProductHistory {
  key: string
  /** Nome mais recente usado para exibir */
  name: string
  points: PricePoint[] // ordenado por data crescente
}

/** Agrupa os preços de todos os produtos salvos, pelo nome normalizado. */
export function buildPriceIndex(sessions: Session[]): Map<string, ProductHistory> {
  const index = new Map<string, ProductHistory>()
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
  for (const s of ordered) {
    for (const item of s.items) {
      const key = productKey(item.name)
      if (!key) continue
      let entry = index.get(key)
      if (!entry) {
        entry = { key, name: item.name, points: [] }
        index.set(key, entry)
      }
      entry.name = item.name
      entry.points.push({ sessionId: s.id, date: s.date, supermarket: s.supermarket, price: item.price })
    }
  }
  return index
}

export function stats(points: PricePoint[]) {
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const first = points[0].price
  const last = points[points.length - 1].price
  const change = first > 0 ? (last - first) / first : 0
  return { min, max, avg, last, change }
}

/** Último preço e média por supermercado, ordenados do mais barato. */
export function bySupermarket(points: PricePoint[]) {
  const map = new Map<string, { supermarket: string; last: PricePoint; sum: number; count: number }>()
  for (const p of points) {
    const e = map.get(p.supermarket)
    if (!e) map.set(p.supermarket, { supermarket: p.supermarket, last: p, sum: p.price, count: 1 })
    else {
      e.last = p
      e.sum += p.price
      e.count++
    }
  }
  return [...map.values()]
    .map((e) => ({ supermarket: e.supermarket, last: e.last, avg: e.sum / e.count, count: e.count }))
    .sort((a, b) => a.last.price - b.last.price)
}
