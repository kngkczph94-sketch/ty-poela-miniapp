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
let loginPromise: Promise<Session> | null = null;

// A stalled request in an embedded WebView (Telegram Desktop in particular)
// must not leave the caller's "saving…" state stuck forever: every exported
// auth call below is bounded, so callers always get a resolution to react to.
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (reason) => { clearTimeout(timer); reject(reason); },
    );
  });
}

const NETWORK_TIMEOUT_MESSAGE = 'Не удалось подключиться к серверу авторизации. Проверьте интернет-соединение и попробуйте ещё раз.';

async function sessionIsAccepted(session: Session) {
  const { data, error } = await supabase.auth.getUser(session.access_token);
  return !error && Boolean(data.user);
}

async function clearInvalidSession() {
  await supabase.auth.signOut({ scope: 'local' });
}

type TelegramAuthErrorResponse = { error?: string };

const authErrorMessages: Record<string, string> = {
  'Authentication failed': 'Сервер авторизации не смог выполнить вход. Проверьте Edge Function telegram-auth и секреты Supabase/Telegram.',
  'Invalid or expired Telegram authorization': 'Данные Telegram устарели. Закройте приложение и откройте его заново из меню бота.',
  'Origin is not allowed': 'Этот адрес приложения не разрешён на сервере авторизации. Проверьте ALLOWED_ORIGINS у Edge Function telegram-auth.',
  'Server authentication is not configured': 'На сервере авторизации не настроены TELEGRAM_BOT_TOKEN, SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.',
  'initData is required': 'Telegram не передал данные входа. Откройте приложение из меню бота внутри Telegram.',
};

async function readableAuthError(error: unknown) {
  if (!error || typeof error !== 'object' || !('context' in error)) return null;
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return null;
  try {
    const body = await context.clone().json() as TelegramAuthErrorResponse;
    if (!body.error) return null;
    return new Error(authErrorMessages[body.error] ?? body.error);
  } catch {
    return null;
  }
}

/**
 * Signs in again from scratch using the Telegram WebApp's initData. Telegram
 * keeps initData available for the whole WebView lifetime (not just at
 * launch), so this can recover a session that died mid-visit — e.g. when
 * refreshSession() fails because the stored refresh token was invalidated —
 * without asking the user to close and reopen the app.
 */
export async function loginWithTelegram(): Promise<Session> {
  loginPromise ??= withTimeout((async () => {
    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData?.trim();
    if (!webApp || !initData) {
      throw new Error('Откройте приложение из меню бота внутри Telegram.');
    }

    const { data: authData, error: invokeError } = await supabase.functions.invoke('telegram-auth', {
      body: { initData },
    });
    if (invokeError) throw (await readableAuthError(invokeError)) ?? invokeError;
    if (!authData?.token_hash || authData.type !== 'email') throw new Error('Некорректный ответ сервера авторизации.');

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: authData.token_hash,
      type: 'email',
    });
    if (otpError) throw otpError;
    if (!otpData.session) throw new Error('Не удалось создать сессию.');
    return otpData.session;
  })(), 15_000, NETWORK_TIMEOUT_MESSAGE);
  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
}

export async function ensureFreshSession(force = false) {
  return withTimeout(ensureFreshSessionUnbounded(force), 15_000, NETWORK_TIMEOUT_MESSAGE);
}

async function ensureFreshSessionUnbounded(force: boolean) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return loginWithTelegram();
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
      return loginWithTelegram();
    }
    return refreshed.data.session;
  } finally {
    refreshPromise = null;
  }
}
