import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseOrigins, technicalEmail, validateInitData } from './auth.ts';

const json = (origin: string, status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'vary': 'Origin' },
});

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  const allowed = parseOrigins(Deno.env.get('ALLOWED_ORIGINS') ?? '');
  if (!origin || !allowed.has(origin)) return new Response(JSON.stringify({ error: 'Origin is not allowed' }), { status: 403, headers: { 'content-type': 'application/json', 'vary': 'Origin' } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-max-age': '86400', 'vary': 'Origin' } });
  if (request.method !== 'POST') return json(origin, 405, { error: 'Method not allowed' });

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!botToken || !supabaseUrl || !serviceRoleKey) return json(origin, 500, { error: 'Server authentication is not configured' });
    const body = await request.json();
    if (typeof body?.initData !== 'string' || !body.initData.trim()) return json(origin, 400, { error: 'initData is required' });
    const telegram = await validateInitData(body.initData, botToken);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: technicalEmail(telegram.id) });
    if (linkError || !link.user || !link.properties?.hashed_token) throw new Error('AUTH_LINK_FAILED');
    const { error: profileError } = await admin.from('users').upsert({
      auth_user_id: link.user.id,
      telegram_user_id: telegram.id,
      telegram_username: telegram.username ?? null,
      first_name: telegram.first_name ?? null,
      last_name: telegram.last_name ?? null,
      locale: telegram.language_code ?? 'ru',
    }, { onConflict: 'telegram_user_id' });
    if (profileError) throw new Error('PROFILE_UPSERT_FAILED');
    return json(origin, 200, { token_hash: link.properties.hashed_token, type: 'email' });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN';
    if (['INVALID_SIGNATURE', 'EXPIRED_AUTH_DATE', 'MISSING_USER', 'INVALID_USER'].includes(code)) return json(origin, 401, { error: 'Invalid or expired Telegram authorization' });
    console.error('telegram-auth failed', code);
    return json(origin, 500, { error: 'Authentication failed' });
  }
});
