import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { getAllowedOrigin, telegramEmail, verifyTelegramInitData } from './auth.ts';

const token = '123456:test-token';
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
async function signedData(now: number, includeUser = true) {
  const params = new URLSearchParams({ auth_date: String(now), query_id: 'test' });
  if (includeUser) params.set('user', JSON.stringify({ id: 42, first_name: 'Test' }));
  const check = [...params].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const key = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', key, encoder.encode(token));
  const hashKey = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  params.set('hash', hex(await crypto.subtle.sign('HMAC', hashKey, encoder.encode(check))));
  return params.toString();
}

Deno.test('accepts a valid Telegram signature', async () => assertEquals((await verifyTelegramInitData(await signedData(1_000), token, 1_000)).id, 42));
Deno.test('rejects expired auth_date', async () => await assertRejects(() => verifyTelegramInitData(await signedData(600), token, 1_000), Error, 'expired_auth_date'));
Deno.test('rejects a modified hash', async () => await assertRejects(() => verifyTelegramInitData(`${await signedData(1_000)}x`, token, 1_000), Error, 'invalid_signature'));
Deno.test('rejects missing user', async () => await assertRejects(() => verifyTelegramInitData(await signedData(1_000, false), token, 1_000), Error, 'missing_user'));
Deno.test('uses an explicit CORS allowlist', () => {
  assertEquals(getAllowedOrigin('https://app.example', 'https://app.example, http://localhost:5173'), 'https://app.example');
  assertEquals(getAllowedOrigin('https://evil.example', 'https://app.example'), null);
  assertEquals(getAllowedOrigin(null, 'https://app.example'), null);
});
Deno.test('stable identity prevents duplicate conflict keys', () => assertEquals(telegramEmail(42), telegramEmail(42)));
