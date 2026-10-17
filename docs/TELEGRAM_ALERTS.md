# Telegram alert setup

Telegram bot tokens are secrets. The two tokens previously pasted into chat must be revoked and regenerated in BotFather before use. Do not put bot tokens in `.env`, `VITE_*` variables, GitHub, or browser code.

The app calls the `send-telegram-alert` Supabase Edge Function. The function keeps the bot tokens server-side and routes alerts to the entry officer, exit officer, or both.

## Required Supabase secrets

Set these after rotating the tokens:

```text
TELEGRAM_ENTRY_BOT_TOKEN=<rotated entry bot token>
TELEGRAM_ENTRY_CHAT_ID=<entry officer/group chat id>
TELEGRAM_EXIT_BOT_TOKEN=<rotated exit bot token>
TELEGRAM_EXIT_CHAT_ID=<exit officer/group chat id>
```

The bot must be added to each target group and given permission to send messages. A bot token alone is not enough; Telegram also requires the destination chat ID.

## Browser configuration

```text
VITE_SUPABASE_ANON_KEY=<Supabase publishable/anon key>
VITE_TELEGRAM_ALERT_FUNCTION_URL=https://skvwzcwbahqrdqoidqec.supabase.co/functions/v1/send-telegram-alert
```

The current integration sends each newly detected alert once, using the existing alert-ID deduplication. The manual “Queue staff notification” button remains available. Delivery is optional: when the relay is not configured, the app continues to record the alert locally.

This is a hackathon notification relay, not a certified emergency-alert system. Keep the human-review disclaimer and test with non-sensitive demo messages first.
