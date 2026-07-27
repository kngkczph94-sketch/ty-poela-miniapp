import { createClient } from 'npm:@supabase/supabase-js@2';

type ProductInput = { id: string; name: string; amount: number; unit: string };

const corsHeaders = (origin: string) => ({
  'access-control-allow-origin': origin,
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
  'vary': 'Origin',
});

const json = (origin: string, status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
});

const allowedOrigins = () => new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const isProduct = (value: unknown): value is ProductInput => {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<ProductInput>;
  return typeof product.id === 'string'
    && product.id.length <= 100
    && typeof product.name === 'string'
    && product.name.trim().length > 0
    && product.name.trim().length <= 120
    && typeof product.amount === 'number'
    && Number.isFinite(product.amount)
    && product.amount > 0
    && product.amount <= 10000
    && typeof product.unit === 'string'
    && product.unit.trim().length > 0
    && product.unit.trim().length <= 24;
};

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  if (!origin || !allowedOrigins().has(origin)) {
    return new Response(JSON.stringify({ error: 'Origin is not allowed' }), {
      status: 403,
      headers: { 'content-type': 'application/json', 'vary': 'Origin' },
    });
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json(origin, 405, { error: 'Method not allowed' });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const authorization = request.headers.get('authorization');
    if (!supabaseUrl || !anonKey || !openAiKey) return json(origin, 500, { error: 'Nutrition service is not configured' });
    if (!authorization) return json(origin, 401, { error: 'Authentication is required' });

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return json(origin, 401, { error: 'Authentication is required' });

    const body = await request.json();
    if (!Array.isArray(body?.products) || body.products.length < 1 || body.products.length > 20 || !body.products.every(isProduct)) {
      return json(origin, 400, { error: 'Provide 1–20 valid products' });
    }
    const products = (body.products as ProductInput[]).map((product) => ({
      ...product,
      name: product.name.trim(),
      unit: product.unit.trim(),
    }));

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${openAiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        store: false,
        input: [
          {
            role: 'developer',
            content: 'Ты рассчитываешь ориентировочные КБЖУ продуктов. Для каждого продукта рассчитай калории, белки, жиры и углеводы именно для указанного количества и единицы. Используй типичные справочные значения для готового к употреблению продукта. Не меняй id и не объединяй продукты. Округляй ккал до целого, БЖУ до 0.1 г. Все значения должны быть неотрицательными.',
          },
          { role: 'user', content: JSON.stringify(products) },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'nutrition_estimate',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['products'],
              properties: {
                products: {
                  type: 'array',
                  minItems: products.length,
                  maxItems: products.length,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'calories', 'protein', 'fat', 'carbs'],
                    properties: {
                      id: { type: 'string' },
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
      console.error('OpenAI nutrition request failed', response.status);
      return json(origin, 502, { error: 'Nutrition calculation is temporarily unavailable' });
    }
    const result = await response.json();
    const outputText = result.output
      ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .find((item: { type?: string; text?: string }) => item.type === 'output_text')?.text;
    if (typeof outputText !== 'string') throw new Error('MISSING_OUTPUT');

    const parsed = JSON.parse(outputText);
    if (!Array.isArray(parsed?.products) || parsed.products.length !== products.length) throw new Error('INVALID_OUTPUT');
    const expectedIds = new Set(products.map((product) => product.id));
    if (!parsed.products.every((product: Record<string, unknown>) =>
      typeof product.id === 'string'
      && expectedIds.has(product.id)
      && ['calories', 'protein', 'fat', 'carbs'].every((key) => typeof product[key] === 'number' && Number.isFinite(product[key]) && Number(product[key]) >= 0)
    )) throw new Error('INVALID_OUTPUT');

    return json(origin, 200, parsed);
  } catch (error) {
    console.error('nutrition-estimate failed', error instanceof Error ? error.message : 'UNKNOWN');
    return json(origin, 500, { error: 'Nutrition calculation failed' });
  }
});
