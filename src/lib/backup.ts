import type { Item, Session } from '../store'

export const BACKUP_INVALID_MESSAGE = 'Esse arquivo não é um backup válido desta calculadora.'

export interface BackupFile {
  version: 1
  exportedAt: string
  current: Item[]
  sessions: Session[]
}

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string }

export function backupFilename(dateISO: string): string {
  return `compras-${dateISO}.json`
}

export function canExportBackup(sessionCount: number, cartCount: number): boolean {
  return sessionCount > 0 || cartCount > 0
}

export function serializeBackup(current: Item[], sessions: Session[], exportedAt: string): string {
  const backup: BackupFile = {
    version: 1,
    exportedAt,
    current: current.map(copyItem),
    sessions: sessions.map(copySession),
  }
  return JSON.stringify(backup)
}

export function restoreMessage(localSessions: number, fileSessions: number, fileCartItems: number): string {
  const leaving =
    localSessions === 0
      ? 'Nenhuma compra deste aparelho vai sair.'
      : localSessions === 1
        ? 'A compra deste aparelho vai sair.'
        : `As ${localSessions} compras deste aparelho vão sair.`
  const compras = fileSessions === 1 ? '1 compra' : `${fileSessions} compras`
  const itens =
    fileCartItems === 0
      ? 'nenhum item no carrinho'
      : fileCartItems === 1
        ? '1 item no carrinho'
        : `${fileCartItems} itens no carrinho`
  return `${leaving} O arquivo traz ${compras} e ${itens}.`
}

export function parseBackup(raw: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return invalid()
  }
  if (!isRecord(data) || data.version !== 1) return invalid()
  if (typeof data.exportedAt !== 'string' || data.exportedAt.length === 0) return invalid()
  const current = parseItems(data.current)
  const sessions = parseSessions(data.sessions)
  if (!current || !sessions) return invalid()
  return { ok: true, backup: { version: 1, exportedAt: data.exportedAt, current, sessions } }
}

function invalid(): ParseResult {
  return { ok: false, error: BACKUP_INVALID_MESSAGE }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function copyItem(item: Item): Item {
  return { id: item.id, name: item.name, price: item.price, quantity: item.quantity }
}

function copySession(session: Session): Session {
  return {
    id: session.id,
    supermarket: session.supermarket,
    date: session.date,
    createdAt: session.createdAt,
    items: session.items.map(copyItem),
  }
}

function parseItems(value: unknown): Item[] | null {
  if (!Array.isArray(value)) return null
  const items: Item[] = []
  const ids = new Set<string>()
  for (const entry of value) {
    const item = parseItem(entry)
    if (!item || ids.has(item.id)) return null
    ids.add(item.id)
    items.push(item)
  }
  return items
}

function parseItem(value: unknown): Item | null {
  if (!isRecord(value)) return null
  const { id, name, price, quantity } = value
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof name !== 'string' || name.trim().length === 0) return null
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) return null
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) return null
  return { id, name, price, quantity }
}

function parseSessions(value: unknown): Session[] | null {
  if (!Array.isArray(value)) return null
  const sessions: Session[] = []
  const ids = new Set<string>()
  for (const entry of value) {
    const session = parseSession(entry)
    if (!session || ids.has(session.id)) return null
    ids.add(session.id)
    sessions.push(session)
  }
  return sessions
}

function parseSession(value: unknown): Session | null {
  if (!isRecord(value)) return null
  const { id, supermarket, date, createdAt, items } = value
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof supermarket !== 'string' || supermarket.trim().length === 0) return null
  if (typeof date !== 'string' || !isISODate(date)) return null
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) return null
  const parsedItems = parseItems(items)
  if (!parsedItems) return null
  return { id, supermarket, date, createdAt, items: parsedItems }
}

function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
