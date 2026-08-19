import { createClient } from 'npm:@supabase/supabase-js@2';

type PhotoProduct = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type JwtPayload = { sub?: unknown; role?: unknown };
type FailureDetails = Record<string, string | number | boolean | null | undefined>;

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT_NUTRITION_PHOTO_ESTIMATE') ?? '20');
const admin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

async function checkDailyLimit(userId: string, endpoint: string, limit: number) {
  if (!admin) return { allowed: true as const };
  const { data, error } = await admin.rpc('increment_ai_usage', { p_user_id: userId, p_endpoint: endpoint });
  if (error) return { allowed: false as const, code: 'RATE_LIMIT_UNAVAILABLE' as const };
  return (data ?? 0) > limit ? { allowed: false as const, code: 'DAILY_LIMIT_EXCEEDED' as const } : { allowed: true as const };
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' ? parsed as JwtPayload : null;
  } catch {
    return null;
  }
};

const allowedOrigins = () => new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean),
);

const corsHeaders = (origin: string) => ({
  'access-control-allow-origin': origin,
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
  vary: 'Origin',
});

const json = (origin: string, status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
});

const fail = (origin: string, status: number, code: string, message: string, requestId: string) =>
  json(origin, status, { error: message, code, requestId });

const logFailure = (code: string, requestId: string, details: FailureDetails = {}) => {
  console.error(JSON.stringify({ event: 'nutrition-photo-estimate-failed', code, requestId, ...details }));
};

const isPhotoProduct = (value: unknown): value is PhotoProduct => {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<PhotoProduct>;
  return typeof product.id === 'string'
    && product.id.length > 0
    && product.id.length <= 100
    && typeof product.name === 'string'
    && product.name.trim().length > 0
    && product.name.trim().length <= 120
    && typeof product.unit === 'string'
    && product.unit.trim().length > 0
    && ['amount', 'calories', 'protein', 'fat', 'carbs'].every((key) => {
      const number = product[key as keyof PhotoProduct];
      return typeof number === 'number' && Number.isFinite(number) && number >= 0;
    })
    && product.amount! > 0
    && product.amount! <= 10000;
};

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get('origin') ?? '';
  if (!origin || !allowedOrigins().has(origin)) {
    logFailure('ORIGIN_NOT_ALLOWED', requestId);
    return new Response(JSON.stringify({ error: 'Origin is not allowed', code: 'ORIGIN_NOT_ALLOWED', requestId }), {
      status: 403,
      headers: { 'content-type': 'application/json', vary: 'Origin' },
    });
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return fail(origin, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed', requestId);

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) return fail(origin, 500, 'SERVICE_NOT_CONFIGURED', 'Photo recognition is not configured', requestId);

    const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const claims = accessToken ? decodeJwtPayload(accessToken) : null;
    if (!claims || typeof claims.sub !== 'string' || !claims.sub || claims.role !== 'authenticated') {
      logFailure('AUTHORIZATION_FAILED', requestId);
      return fail(origin, 401, 'AUTHORIZATION_FAILED', 'Authentication is required', requestId);
    }

    const usage = await checkDailyLimit(claims.sub, 'nutrition-photo-estimate', DAILY_LIMIT);
    if (!usage.allowed) {
      logFailure(usage.code, requestId);
      return fail(
        origin,
        usage.code === 'DAILY_LIMIT_EXCEEDED' ? 429 : 503,
        usage.code,
        usage.code === 'DAILY_LIMIT_EXCEEDED' ? 'Daily AI usage limit reached' : 'Rate limiting is temporarily unavailable',
        requestId,
      );
    }

    const body = await request.json();
    const imageDataUrl = body?.imageDataUrl;
    if (
      typeof imageDataUrl !== 'string'
      || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(imageDataUrl)
      || imageDataUrl.length > 8_000_000
    ) {
      return fail(origin, 400, 'INVALID_IMAGE', 'Provide a valid JPEG, PNG or WebP image', requestId);
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${openAiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        store: false,
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Распознай еду на фотографии и оцени съедобный вес и КБЖУ. Явно разделимые продукты верни отдельными строками. Смешанное готовое блюдо, например плов, суп или макароны по-флотски, верни одной строкой и не выдумывай невидимые ингредиенты. Значения должны быть суммарными для указанного веса. Названия дай по-русски, единицу укажи "г". Округли вес и ккал до целого, БЖУ до 0.1 г. Это ориентировочная оценка.',
            },
            { type: 'input_image', image_url: imageDataUrl, detail: 'low' },
          ],
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'photo_nutrition_estimate',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['products', 'notice'],
              properties: {
                notice: { type: 'string' },
                products: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 12,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'name', 'amount', 'unit', 'calories', 'protein', 'fat', 'carbs'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      amount: { type: 'number', minimum: 1 },
                      unit: { type: 'string' },
                      calories: { type: 'number', minimum: 0 },
                      protein: { type: 'number', minimum: 0 },
                      fat: { type: 'number', minimum: 0 },
                      carbs: { type: 'number', minimum: 0 },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      let providerCode: string | null = null;
      try {
        const providerBody = await response.json() as { error?: { code?: unknown } };
        providerCode = typeof providerBody.error?.code === 'string' ? providerBody.error.code : null;
      } catch {
        // Do not log provider bodies: they may contain request details.
      }
      logFailure('OPENAI_REQUEST_FAILED', requestId, { providerStatus: response.status, providerCode });
      return fail(origin, 502, 'OPENAI_REQUEST_FAILED', 'Photo recognition is temporarily unavailable', requestId);
    }

    const result = await response.json();
    const outputText = result.output
      ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .find((item: { type?: string; text?: string }) => item.type === 'output_text')?.text;
    if (typeof outputText !== 'string') throw new Error('MISSING_OUTPUT');
    const parsed = JSON.parse(outputText);
    if (
      !Array.isArray(parsed?.products)
      || parsed.products.length < 1
      || parsed.products.length > 12
      || !parsed.products.every(isPhotoProduct)
    ) throw new Error('INVALID_OUTPUT');

    return json(origin, 200, {
      products: parsed.products.map((product: PhotoProduct) => ({
        ...product,
        id: crypto.randomUUID(),
        name: product.name.trim(),
        unit: 'г',
      })),
      notice: typeof parsed.notice === 'string' && parsed.notice.trim()
        ? parsed.notice.trim()
        : 'Распознавание по фото приблизительное. Проверьте состав, вес и КБЖУ перед сохранением.',
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN';
    logFailure('UNEXPECTED_FAILURE', requestId, { reason });
    return fail(origin, 500, 'UNEXPECTED_FAILURE', 'Photo recognition failed', requestId);
  }
});
