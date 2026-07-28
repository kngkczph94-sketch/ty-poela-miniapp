const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean));
const openAiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const model = Deno.env.get('OPENAI_RECIPE_MODEL') ?? Deno.env.get('OPENAI_NUTRITION_MODEL') ?? 'gpt-4o-mini';
const MAX_IMAGE_LENGTH = 7_000_000;

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const json = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
});

const decodeJwtPayload = (token: string) => {
  const part = token.split('.')[1];
  if (!part) throw new Error('INVALID_TOKEN');
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  return JSON.parse(atob(normalized)) as { sub?: string; role?: string; exp?: number };
};

const outputText = (result: Record<string, unknown>) => {
  if (typeof result.output_text === 'string') return result.output_text;
  const output = Array.isArray(result.output) ? result.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') return (part as { text: string }).text;
    }
  }
  return '';
};

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = allowedOrigins.has(origin) ? origin : '';

  if (!allowedOrigin) return json({ error: 'ORIGIN_NOT_ALLOWED' }, 403, 'null');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405, allowedOrigin);

  const requestId = crypto.randomUUID();
  try {
    const authorization = request.headers.get('Authorization') ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const payload = decodeJwtPayload(token);
    if (!payload.sub || payload.role !== 'authenticated' || !payload.exp || payload.exp * 1000 <= Date.now()) {
      return json({ error: 'AUTHORIZATION_FAILED', requestId }, 401, allowedOrigin);
    }
    if (!openAiKey) return json({ error: 'AI_NOT_CONFIGURED', requestId }, 503, allowedOrigin);

    const body = await request.json() as { mode?: unknown; products?: unknown; imageDataUrl?: unknown };
    if (body.mode !== 'products' && body.mode !== 'photo') return json({ error: 'INVALID_MODE', requestId }, 400, allowedOrigin);

    const content: Array<Record<string, string>> = [{
      type: 'input_text',
      text: body.mode === 'products'
        ? `Пользователь перечислил продукты: ${String(body.products ?? '').slice(0, 2000)}`
        : 'Определи продукты на фотографии и предложи рецепты из них. Не утверждай, что видишь продукт, если не уверен.',
    }];

    if (body.mode === 'products') {
      if (typeof body.products !== 'string' || !body.products.trim()) return json({ error: 'PRODUCTS_REQUIRED', requestId }, 400, allowedOrigin);
    } else {
      if (typeof body.imageDataUrl !== 'string' || body.imageDataUrl.length > MAX_IMAGE_LENGTH || !/^data:image\/(jpeg|png|webp);base64,/.test(body.imageDataUrl)) {
        return json({ error: 'INVALID_IMAGE', requestId }, 400, allowedOrigin);
      }
      content.push({ type: 'input_image', image_url: body.imageDataUrl });
    }

    const schema = {
      type: 'object',
      additionalProperties: false,
      required: ['suggestions'],
      properties: {
        suggestions: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'title', 'description', 'calories', 'protein', 'fat', 'carbs', 'cookingTime', 'servings', 'ingredients', 'missingIngredients', 'steps'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              calories: { type: 'number', minimum: 0 },
              protein: { type: 'number', minimum: 0 },
              fat: { type: 'number', minimum: 0 },
              carbs: { type: 'number', minimum: 0 },
              cookingTime: { type: 'integer', minimum: 1 },
              servings: { type: 'integer', minimum: 1 },
              ingredients: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'amount', 'unit'], properties: { name: { type: 'string' }, amount: { type: 'number', minimum: 0 }, unit: { type: 'string' } } } },
              missingIngredients: { type: 'array', items: { type: 'string' } },
              steps: { type: 'array', minItems: 1, items: { type: 'string' } },
            },
          },
        },
      },
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        store: false,
        instructions: 'Ты помощник по домашней кухне. Верни ровно 3 реалистичных рецепта на русском. Значения КБЖУ указывай на одну порцию. Приоритет — продукты пользователя; недостающие обязательные продукты перечисляй отдельно. Не давай медицинских обещаний.',
        input: [{ role: 'user', content }],
        text: { format: { type: 'json_schema', name: 'recipe_suggestions', strict: true, schema } },
      }),
    });

    if (!response.ok) {
      console.error(JSON.stringify({ event: 'recipe-suggest-failed', code: 'OPENAI_ERROR', requestId, status: response.status }));
      return json({ error: 'AI_TEMPORARILY_UNAVAILABLE', requestId }, 502, allowedOrigin);
    }

    const result = await response.json() as Record<string, unknown>;
    const parsed = JSON.parse(outputText(result));
    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 3) throw new Error('INVALID_AI_RESPONSE');
    return json({ suggestions: parsed.suggestions }, 200, allowedOrigin);
  } catch (error) {
    console.error(JSON.stringify({ event: 'recipe-suggest-failed', code: error instanceof Error ? error.message : 'UNKNOWN', requestId }));
    return json({ error: 'RECIPE_SUGGEST_FAILED', requestId }, 500, allowedOrigin);
  }
});
