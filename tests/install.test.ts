import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DISMISS_FOR_MS, parseDismissedAt, shouldOfferInstall } from '../src/lib/install.ts'

const now = 1_700_000_000_000

test('shouldOfferInstall aparece com o prompt nativo ou no Safari do iPhone', () => {
  assert.equal(offer({ canPrompt: true }), true)
  assert.equal(offer({ ios: true }), true)
  assert.equal(offer({}), false)
})

test('shouldOfferInstall some quando já está instalado ou foi dispensado há pouco', () => {
  assert.equal(offer({ canPrompt: true, standalone: true }), false)
  assert.equal(offer({ canPrompt: true, dismissedAt: now - 1000 }), false)
  assert.equal(offer({ ios: true, dismissedAt: now - DISMISS_FOR_MS + 1 }), false)
  assert.equal(offer({ canPrompt: true, dismissedAt: now - DISMISS_FOR_MS }), true)
})

test('parseDismissedAt ignora valor vazio ou inválido', () => {
  assert.equal(parseDismissedAt(null), null)
  assert.equal(parseDismissedAt(''), null)
  assert.equal(parseDismissedAt('amanhã'), null)
  assert.equal(parseDismissedAt('0'), null)
  assert.equal(parseDismissedAt(String(now)), now)
})

function offer(patch: Partial<Parameters<typeof shouldOfferInstall>[0]>) {
  return shouldOfferInstall({
    standalone: false,
    dismissedAt: null,
    now,
    canPrompt: false,
    ios: false,
    ...patch,
  })
}
