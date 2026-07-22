import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllowedOrigin, telegramEmail, verifyTelegramInitData } from './auth.ts';

const json = (body: Record<string, unknown>, status: number, origin?: string) => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(origin ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        Vary: 'Origin',
      } : {}),
    },
  },
);

Deno.serve(async (request) => {
  const origin = getAllowedOrigin(request.headers.get('Origin'), Deno.env.get('ALLOWED_ORIGINS') ?? '');
  if (!origin) return json({ error: 'Origin is not allowed' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  } });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

  try {
    const payload: unknown = await request.json();
    const initData = typeof payload === 'object' && payload !== null && 'initData' in payload
      ? (payload as { initData?: unknown }).initData : null;
    if (typeof initData !== 'string' || initData.trim() === '') {
      return json({ error: 'initData must be a non-empty string' }, 400, origin);
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      console.error('telegram-auth: required server configuration is missing');
      return json({ error: 'Authentication service is not configured' }, 500, origin);
    }

    const telegramUser = await verifyTelegramInitData(initData, botToken);
    const email = telegramEmail(telegramUser.id);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let authUserId: string | undefined;
    for (let page = 1; page <= 10 && !authUserId; page += 1) {
      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (usersError) throw new Error('auth_user_failed');
      authUserId = usersPage.users.find((user) => user.email === email)?.id;
      if (usersPage.users.length < 1000) break;
    }
    if (!authUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (createError || !created.user) throw new Error('auth_user_failed');
      authUserId = created.user.id;
    }

    // A magic link supplies a one-time token hash without exposing an admin credential.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink', email,
    });
    if (linkError || !link.properties?.hashed_token) throw new Error('auth_user_failed');

    const { error: profileError } = await admin.from('users').upsert({
      auth_user_id: authUserId,
      telegram_user_id: telegramUser.id,
      telegram_username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
    }, { onConflict: 'telegram_user_id' });
    if (profileError) throw new Error('profile_failed');

    return json({ token_hash: link.properties.hashed_token, type: 'email' }, 200, origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'unknown';
    if (['invalid_signature', 'invalid_auth_date', 'expired_auth_date', 'missing_user', 'invalid_user'].includes(code)) {
      return json({ error: 'Telegram authorization data is invalid or expired' }, 401, origin);
    }
    console.error('telegram-auth: authentication failed', { code });
    return json({ error: 'Unable to authenticate' }, 500, origin);
  }
});
