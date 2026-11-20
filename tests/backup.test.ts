import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BACKUP_INVALID_MESSAGE,
  backupFilename,
  canExportBackup,
  parseBackup,
  restoreMessage,
  serializeBackup,
} from '../src/lib/backup.ts'

const item = { id: 'i1', name: 'Arroz', price: 10.5, quantity: 2 }
const session = {
  id: 's1',
  supermarket: 'Mercado Bom',
  date: '2026-11-20',
  items: [item],
  createdAt: 1_700_000_000_000,
}

test('serializeBackup grava versão, data, carrinho e compras', () => {
  const raw = serializeBackup([item], [session], '2026-11-20T12:00:00.000Z')
  assert.deepEqual(JSON.parse(raw), {
    version: 1,
    exportedAt: '2026-11-20T12:00:00.000Z',
    current: [item],
    sessions: [session],
  })
})

test('parseBackup devolve a mesma foto, inclusive os ids', () => {
  const raw = serializeBackup([item], [session], '2026-11-20T12:00:00.000Z')
  const result = parseBackup(raw)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.backup.current, [item])
  assert.deepEqual(result.backup.sessions, [session])
})

test('backupFilename usa a data do dia', () => {
  assert.equal(backupFilename('2026-11-20'), 'compras-2026-11-20.json')
})

test('canExportBackup só quando há compra salva ou item no carrinho', () => {
  assert.equal(canExportBackup(0, 0), false)
  assert.equal(canExportBackup(1, 0), true)
  assert.equal(canExportBackup(0, 2), true)
})

test('restoreMessage descreve quantas compras saem e quantas entram', () => {
  assert.equal(
    restoreMessage(12, 40, 3),
    'As 12 compras deste aparelho vão sair. O arquivo traz 40 compras e 3 itens no carrinho.',
  )
  assert.equal(
    restoreMessage(1, 1, 1),
    'A compra deste aparelho vai sair. O arquivo traz 1 compra e 1 item no carrinho.',
  )
  assert.equal(
    restoreMessage(0, 0, 0),
    'Nenhuma compra deste aparelho vai sair. O arquivo traz 0 compras e nenhum item no carrinho.',
  )
})

test('parseBackup rejeita arquivo inválido, outra versão ou incompleto', () => {
  const invalid = [
    'não é json',
    'null',
    '{}',
    JSON.stringify({ version: 2, exportedAt: 'x', current: [], sessions: [] }),
    JSON.stringify({ version: '1', exportedAt: 'x', current: [], sessions: [] }),
    JSON.stringify({ version: 1, exportedAt: '', current: [], sessions: [] }),
    JSON.stringify({ version: 1, exportedAt: 'x', current: 'não', sessions: [] }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [{ id: '', name: 'A', price: 1, quantity: 1 }],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [{ id: 'i', name: '  ', price: 1, quantity: 1 }],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [{ id: 'i', name: 'A', price: -1, quantity: 1 }],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [{ id: 'i', name: 'A', price: 1, quantity: 0 }],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [{ id: 'i', name: 'A', price: '1', quantity: 1 }],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [
        { id: 'i', name: 'A', price: 1, quantity: 1 },
        { id: 'i', name: 'B', price: 1, quantity: 1 },
      ],
      sessions: [],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [],
      sessions: [{ id: 's', supermarket: 'M', date: '2026-13-40', items: [], createdAt: 1 }],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [],
      sessions: [{ id: 's', supermarket: '  ', date: '2026-11-20', items: [], createdAt: 1 }],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [],
      sessions: [
        { id: 's', supermarket: 'M', date: '2026-11-20', items: [], createdAt: 1 },
        { id: 's', supermarket: 'N', date: '2026-11-21', items: [], createdAt: 2 },
      ],
    }),
    JSON.stringify({
      version: 1,
      exportedAt: 'x',
      current: [],
      sessions: [
        {
          id: 's',
          supermarket: 'M',
          date: '2026-11-20',
          createdAt: 1,
          items: [
            { id: 'i', name: 'A', price: 1, quantity: 1 },
            { id: 'i', name: 'B', price: 1, quantity: 1 },
          ],
        },
      ],
    }),
  ]

  for (const raw of invalid) {
    const result = parseBackup(raw)
    assert.equal(result.ok, false, raw)
    if (result.ok) continue
    assert.equal(result.error, BACKUP_INVALID_MESSAGE)
  }
})

test('parseBackup ignora campos desconhecidos e não traz o tutorial', () => {
  const raw = JSON.stringify({
    version: 1,
    exportedAt: '2026-11-20T12:00:00.000Z',
    onboarded: false,
    current: [{ ...item, note: 'extra' }],
    sessions: [{ ...session, extra: true }],
  })
  const result = parseBackup(raw)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.backup.current, [item])
  assert.deepEqual(result.backup.sessions, [session])
  assert.equal('onboarded' in result.backup, false)
})
