import type { StateStorage } from 'zustand/middleware'

function detectLocalStorage(): boolean {
  try {
    const key = '__cc_test__'
    window.localStorage.setItem(key, key)
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export const storageAvailable = typeof window !== 'undefined' && detectLocalStorage()

const memory = new Map<string, string>()

/** localStorage com fallback em memória quando indisponível (modo privado, cota cheia etc.). */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    if (!storageAvailable) return memory.get(name) ?? null
    try {
      return window.localStorage.getItem(name)
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    memory.set(name, value)
    if (!storageAvailable) return
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // cota cheia: mantém em memória
    }
  },
  removeItem: (name) => {
    memory.delete(name)
    if (!storageAvailable) return
    try {
      window.localStorage.removeItem(name)
    } catch {
      // ignora
    }
  },
}
