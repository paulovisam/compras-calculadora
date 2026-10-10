import { track as vercelTrack } from '@vercel/analytics'

export type AppEvent =
  | 'product_added'
  | 'session_saved'
  | 'history_viewed'
  | 'price_comparison_used'
  | 'item_edited'
  | 'item_deleted'

export function track(event: AppEvent, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, props)
  } catch {
    // analytics nunca deve quebrar o app
  }
}
