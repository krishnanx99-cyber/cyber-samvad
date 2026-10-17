type Route = 'entry' | 'exit' | 'both'

interface AlertPayload {
  alertId: string
  level: 'warning' | 'critical'
  title: string
  detail: string
  zoneId?: string
  source: 'simulation' | 'observation' | 'system'
  at: string
  route: Route
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'content-type': 'application/json' }
})

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function readTargets(route: Route) {
  const targets: Array<{ token: string; chatId: string }> = []
  const entryToken = Deno.env.get('TELEGRAM_ENTRY_BOT_TOKEN')
  const entryChatId = Deno.env.get('TELEGRAM_ENTRY_CHAT_ID')
  const exitToken = Deno.env.get('TELEGRAM_EXIT_BOT_TOKEN')
  const exitChatId = Deno.env.get('TELEGRAM_EXIT_CHAT_ID')

  if ((route === 'entry' || route === 'both') && entryToken && entryChatId) targets.push({ token: entryToken, chatId: entryChatId })
  if ((route === 'exit' || route === 'both') && exitToken && exitChatId) targets.push({ token: exitToken, chatId: exitChatId })
  return targets
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405)

  let payload: AlertPayload
  try {
    payload = await request.json() as AlertPayload
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (!payload?.alertId || !payload.title || !payload.detail || !payload.at) return json({ error: 'Missing alert fields' }, 400)
  if (!['warning', 'critical'].includes(payload.level)) return json({ error: 'Invalid alert level' }, 400)
  if (!['simulation', 'observation', 'system'].includes(payload.source)) return json({ error: 'Invalid alert source' }, 400)
  if (!['entry', 'exit', 'both'].includes(payload.route)) return json({ error: 'Invalid alert route' }, 400)

  const targets = readTargets(payload.route)
  if (!targets.length) return json({ error: 'No Telegram target is configured for this route' }, 503)

  const icon = payload.level === 'critical' ? '🔴' : '🟠'
  const message = [
    `${icon} <b>DarshanFlow ${payload.level.toUpperCase()}</b>`,
    `<b>${escapeHtml(payload.title)}</b>`,
    escapeHtml(payload.detail),
    `Zone: ${escapeHtml(payload.zoneId ?? 'system')}`,
    `Source: ${escapeHtml(payload.source)}`,
    `Time: ${escapeHtml(payload.at)}`,
    '<i>Review by authorised staff. Synthetic/demo alert unless source says observation.</i>'
  ].join('\n')

  const results = await Promise.all(targets.map(async ({ token, chatId }) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true })
    })
    return response.ok
  }))

  if (!results.every(Boolean)) return json({ error: 'One or more Telegram deliveries failed', delivered: results.filter(Boolean).length }, 502)
  return json({ sent: true, delivered: results.length })
})
