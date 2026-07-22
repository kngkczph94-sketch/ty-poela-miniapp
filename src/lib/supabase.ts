import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!url || !publishableKey) {
  throw new Error('Не настроены публичные параметры подключения к Supabase.');
}

export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});


let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

export async function ensureFreshSession(force = false) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error('Сессия входа отсутствует. Закройте и снова откройте приложение из Telegram.');
  }

  const expiresAt = (data.session.expires_at ?? 0) * 1000;
  if (!force && expiresAt > Date.now() + 60_000) return data.session;

  refreshPromise ??= supabase.auth.refreshSession();
  try {
    const refreshed = await refreshPromise;
    if (refreshed.error || !refreshed.data.session) {
      throw new Error('Сессия истекла. Закройте и снова откройте приложение из Telegram.');
    }
    return refreshed.data.session;
  } finally {
    refreshPromise = null;
  }
}
