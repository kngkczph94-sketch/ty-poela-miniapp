export const MAX_AUTH_AGE_SECONDS = 300;

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

const encoder = new TextEncoder();

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const hmac = async (key: Uint8Array, message: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message)));
};

const constantTimeHexEqual = (actual: string, expected: string) => {
  if (!/^[0-9a-f]{64}$/i.test(actual) || expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.toLowerCase().charCodeAt(index);
  }
  return difference === 0;
};

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<TelegramUser> {
  const params = new URLSearchParams(initData);
  const hashes = params.getAll('hash');
  if (hashes.length !== 1) throw new Error('invalid_signature');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = await hmac(encoder.encode('WebAppData'), botToken);
  const expectedHash = toHex(await hmac(secretKey, dataCheckString));
  if (!constantTimeHexEqual(hashes[0], expectedHash)) throw new Error('invalid_signature');

  const authDateValue = params.get('auth_date');
  if (!authDateValue || !/^\d+$/.test(authDateValue)) throw new Error('invalid_auth_date');
  const authDate = Number(authDateValue);
  if (!Number.isSafeInteger(authDate) || authDate > nowSeconds + 30 || nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new Error('expired_auth_date');
  }

  const rawUser = params.get('user');
  if (!rawUser) throw new Error('missing_user');
  let user: TelegramUser;
  try {
    user = JSON.parse(rawUser) as TelegramUser;
  } catch {
    throw new Error('invalid_user');
  }
  if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('invalid_user');
  return user;
}

export const getAllowedOrigin = (origin: string | null, allowedOrigins: string) => {
  if (!origin) return null;
  const allowlist = allowedOrigins.split(',').map((value) => value.trim()).filter(Boolean);
  return allowlist.includes(origin) ? origin : null;
};

export const telegramEmail = (telegramId: number) =>
  `telegram_${telegramId}@auth.ty-poela.local`;
