# Telegram authentication

The frontend sends the untouched `Telegram.WebApp.initData` to the `telegram-auth` Edge Function. The function verifies Telegram's HMAC signature and a five-minute `auth_date`, maps the Telegram ID to one confirmed Supabase Auth user, upserts `public.users`, and returns a one-time `token_hash`. The frontend exchanges it with `verifyOtp`; bot and service-role secrets never reach the browser.

## Configuration

Edge Function secrets:

- `TELEGRAM_BOT_TOKEN`
- `ALLOWED_ORIGINS` — comma-separated exact origins, for example `https://kngkczph94-sketch.github.io`

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically to hosted Edge Functions. Frontend deployment variables are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

For local UI work only, set `VITE_AUTH_PREVIEW=true`. Preview is ignored in production and never creates a session.

## Staging deployment

This authentication endpoint intentionally accepts unauthenticated gateway requests because the Telegram HMAC is its credential:

```sh
supabase functions deploy telegram-auth --project-ref <STAGING_REF> --no-verify-jwt
```

Deploy only to staging first. Open the Mini App from the configured bot, confirm login, close and reopen it, then verify that Supabase Auth and `public.users` each contain one record for the Telegram ID. Test browser access outside Telegram, an unlisted origin, altered `initData`, and data older than five minutes.
