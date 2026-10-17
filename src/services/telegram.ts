export type TelegramRoute = 'entry' | 'exit' | 'both'

export interface TelegramAlertPayload {
  alertId: string
  level: 'warning' | 'critical'
  title: string
  detail: string
  zoneId?: string
  source: 'simulation' | 'observation' | 'system'
  at: string
  route: TelegramRoute
}

export interface TelegramAlertResult {
  sent: boolean
  reason?: string
  delivered?: number
}

/**
 * Calls the Supabase Edge Function relay. Bot tokens must never be placed in
 * Vite variables or sent to the browser; they belong in Supabase secrets.
 */
export async function sendTelegramAlert(payload: TelegramAlertPayload): Promise<TelegramAlertResult> {
  const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  const endpoint = runtimeEnv?.VITE_TELEGRAM_ALERT_FUNCTION_URL
  const anonKey = runtimeEnv?.VITE_SUPABASE_ANON_KEY

  if (!endpoint || !anonKey) return { sent: false, reason: 'Telegram relay is not configured' }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${anonKey}`
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json().catch(() => ({})) as TelegramAlertResult & { error?: string }
    if (!response.ok) return { sent: false, reason: result.error ?? `Relay failed (${response.status})` }
    return result
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : 'Relay request failed' }
  }
}
