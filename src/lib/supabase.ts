import { createClient, type Session } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!url || !publishableKey) {
  throw new Error('Не настроены публичные параметры подключения к Supabase.');
}

export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

async function sessionIsAccepted(session: Session) {
  const { data, error } = await supabase.auth.getUser(session.access_token);
  return !error && Boolean(data.user);
}

async function clearInvalidSession() {
  await supabase.auth.signOut({ scope: 'local' });
}

export async function ensureFreshSession(force = false) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error('Сессия входа отсутствует. Закройте и снова откройте приложение из Telegram.');
  }

  const expiresAt = (data.session.expires_at ?? 0) * 1000;
  const expiresSoon = expiresAt <= Date.now() + 60_000;

  if (!force && !expiresSoon && await sessionIsAccepted(data.session)) {
    return data.session;
  }

  refreshPromise ??= supabase.auth.refreshSession();
  try {
    const refreshed = await refreshPromise;
    if (
      refreshed.error
      || !refreshed.data.session
      || !await sessionIsAccepted(refreshed.data.session)
    ) {
      await clearInvalidSession();
      throw new Error('Сессия истекла. Закройте и снова откройте приложение из Telegram.');
    }
    return refreshed.data.session;
  } finally {
    refreshPromise = null;
  }
}
