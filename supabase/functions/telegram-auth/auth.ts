export type TelegramUser = { id: number; username?: string; first_name?: string; last_name?: string; language_code?: string };

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function hmac(key: Uint8Array | string, message: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', typeof key === 'string' ? encoder.encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message)));
}

export function timingSafeHexEqual(left: string, right: string) {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function validateInitData(initData: string, botToken: string, nowSeconds = Math.floor(Date.now() / 1000), maxAgeSeconds = 300) {
  const params = new URLSearchParams(initData);
  const suppliedHash = params.get('hash') ?? '';
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secretKey = await hmac('WebAppData', botToken);
  const expectedHash = toHex((await hmac(secretKey, dataCheckString)).buffer);
  if (!timingSafeHexEqual(suppliedHash, expectedHash)) throw new Error('INVALID_SIGNATURE');

  const authDate = Number(params.get('auth_date'));
  if (!Number.isInteger(authDate) || authDate > nowSeconds + 30 || nowSeconds - authDate > maxAgeSeconds) throw new Error('EXPIRED_AUTH_DATE');
  const rawUser = params.get('user');
  if (!rawUser) throw new Error('MISSING_USER');
  let user: TelegramUser;
  try { user = JSON.parse(rawUser) as TelegramUser; } catch { throw new Error('INVALID_USER'); }
  if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('INVALID_USER');
  return user;
}

export const technicalEmail = (telegramId: number) => `telegram_${telegramId}@auth.ty-poela.app`;
export const parseOrigins = (value: string) => new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean));
