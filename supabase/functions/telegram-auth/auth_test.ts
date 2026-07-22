import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { validateInitData } from './auth.ts';

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
async function sign(params: URLSearchParams, token: string) {
  const importHmac = (key: BufferSource) => crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', await importHmac(encoder.encode('WebAppData')), encoder.encode(token));
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  params.set('hash', toHex(await crypto.subtle.sign('HMAC', await importHmac(secret), encoder.encode(check))));
  return params.toString();
}

Deno.test('accepts valid Telegram initData', async () => {
  const now = 1_800_000_000;
  const data = await sign(new URLSearchParams({ auth_date: String(now), user: JSON.stringify({ id: 42, first_name: 'Test' }) }), '123:test');
  assertEquals((await validateInitData(data, '123:test', now)).id, 42);
});

Deno.test('rejects an altered hash', async () => {
  const now = 1_800_000_000;
  const params = new URLSearchParams(await sign(new URLSearchParams({ auth_date: String(now), user: JSON.stringify({ id: 42 }) }), '123:test'));
  params.set('hash', '0'.repeat(64));
  await assertRejects(() => validateInitData(params.toString(), '123:test', now), Error, 'INVALID_SIGNATURE');
});

Deno.test('rejects expired data and missing user', async () => {
  const now = 1_800_000_000;
  const expired = await sign(new URLSearchParams({ auth_date: String(now - 301), user: JSON.stringify({ id: 42 }) }), '123:test');
  await assertRejects(() => validateInitData(expired, '123:test', now), Error, 'EXPIRED_AUTH_DATE');
  const missing = await sign(new URLSearchParams({ auth_date: String(now) }), '123:test');
  await assertRejects(() => validateInitData(missing, '123:test', now), Error, 'MISSING_USER');
});
