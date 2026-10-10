import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './lib/storage'
import { uid } from './lib/format'
import { track } from './lib/analytics'

export interface Item {
  id: string
  name: string
  /** Preço unitário */
  price: number
  quantity: number
}

export interface Session {
  id: string
  supermarket: string
  /** YYYY-MM-DD */
  date: string
  items: Item[]
  createdAt: number
}

export type ItemInput = Omit<Item, 'id'>

/** null = compra atual; string = id de uma compra salva */
export type SessionRef = string | null

interface State {
  current: Item[]
  sessions: Session[]
  onboarded: boolean
  addItem: (input: ItemInput) => void
  updateItem: (ref: SessionRef, id: string, input: ItemInput) => void
  removeItem: (ref: SessionRef, id: string) => void
  clearCurrent: () => void
  saveSession: (supermarket: string, date: string) => void
  updateSession: (id: string, patch: Partial<Pick<Session, 'supermarket' | 'date'>>) => void
  deleteSession: (id: string) => void
  finishOnboarding: () => void
}

export const itemTotal = (i: Item) => i.price * i.quantity
export const sumItems = (items: Item[]) => items.reduce((acc, i) => acc + itemTotal(i), 0)

function mapItems(state: State, ref: SessionRef, fn: (items: Item[]) => Item[]): Partial<State> {
  if (ref === null) return { current: fn(state.current) }
  return {
    sessions: state.sessions.map((s) => (s.id === ref ? { ...s, items: fn(s.items) } : s)),
  }
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      current: [],
      sessions: [],
      onboarded: false,

      addItem: (input) => {
        set((s) => ({ current: [{ ...input, id: uid() }, ...s.current] }))
        track('product_added')
      },

      updateItem: (ref, id, input) => {
        set((s) => mapItems(s, ref, (items) => items.map((i) => (i.id === id ? { ...i, ...input } : i))))
        track('item_edited', { past: ref !== null })
      },

      removeItem: (ref, id) => {
        set((s) => mapItems(s, ref, (items) => items.filter((i) => i.id !== id)))
        track('item_deleted', { past: ref !== null })
      },

      clearCurrent: () => set({ current: [] }),

      saveSession: (supermarket, date) => {
        set((s) => ({
          sessions: [
            { id: uid(), supermarket: supermarket.trim(), date, items: s.current, createdAt: Date.now() },
            ...s.sessions,
          ],
          current: [],
        }))
        track('session_saved')
      },

      updateSession: (id, patch) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      finishOnboarding: () => set({ onboarded: true }),
    }),
    {
      name: 'compras-calculadora',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ current, sessions, onboarded }) => ({ current, sessions, onboarded }),
    },
  ),
)

/** Ordena compras da mais recente para a mais antiga. */
export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}
