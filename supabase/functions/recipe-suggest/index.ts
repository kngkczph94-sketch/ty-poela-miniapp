import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean));
const openAiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const model = Deno.env.get('OPENAI_RECIPE_MODEL') ?? Deno.env.get('OPENAI_NUTRITION_MODEL') ?? 'gpt-4o-mini';
const MAX_IMAGE_LENGTH = 7_000_000;
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT_RECIPE_SUGGEST') ?? '20');
const admin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

async function checkDailyLimit(userId: string, endpoint: string, limit: number) {
  if (!admin) return { allowed: true as const };
  const { data, error } = await admin.rpc('increment_ai_usage', { p_user_id: userId, p_endpoint: endpoint });
  if (error) return { allowed: false as const, code: 'RATE_LIMIT_UNAVAILABLE' as const };
  return (data ?? 0) > limit ? { allowed: false as const, code: 'DAILY_LIMIT_EXCEEDED' as const } : { allowed: true as const };
}

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

type Nutrition = { calories: number; protein: number; fat: number; carbs: number };

const roundMacro = (value: number) => Math.round(value * 10) / 10;
const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

const percentQualifierAllowed = /(?:творог|кефир|молоко|сметан|сливк|йогурт|сыр|ряженк|простокваш|масло сливоч)/i;

const cleanIngredientName = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (percentQualifierAllowed.test(normalized)) {
    return normalized;
  }

  return normalized
    .replace(/\s+\d+(?:[.,]\d+)?\s*%(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeNutrition = (value: unknown): Nutrition => {
  if (!value || typeof value !== 'object') throw new Error('INVALID_AI_RESPONSE');
  const candidate = value as Record<string, unknown>;
  if (![candidate.calories, candidate.protein, candidate.fat, candidate.carbs].every(finiteNonNegative)) {
    throw new Error('INVALID_AI_RESPONSE');
  }
  const nutrition = {
    calories: Math.round(candidate.calories as number),
    protein: roundMacro(candidate.protein as number),
    fat: roundMacro(candidate.fat as number),
    carbs: roundMacro(candidate.carbs as number),
  };
  const caloriesFromMacros = Math.round(4 * nutrition.protein + 9 * nutrition.fat + 4 * nutrition.carbs);
  if (Math.abs(nutrition.calories - caloriesFromMacros) > Math.max(50, nutrition.calories * 0.25)) {
    nutrition.calories = caloriesFromMacros;
  }
  return nutrition;
};

const normalizeSuggestion = (value: unknown) => {
  if (!value || typeof value !== 'object') throw new Error('INVALID_AI_RESPONSE');
  const recipe = value as Record<string, unknown>;
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) throw new Error('INVALID_AI_RESPONSE');
  const ingredients = recipe.ingredients.map((ingredient) => {
    if (!ingredient || typeof ingredient !== 'object') throw new Error('INVALID_AI_RESPONSE');
    const item = ingredient as Record<string, unknown>;
    if (typeof item.name !== 'string' || typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0 || (item.unit !== 'г' && item.unit !== 'мл')) {
      throw new Error('INVALID_AI_RESPONSE');
    }
    const name = cleanIngredientName(item.name);
    if (!name) {
      throw new Error('INVALID_AI_RESPONSE');
    }

    return { name, amount: roundMacro(item.amount), unit: item.unit, nutrition: normalizeNutrition(item.nutrition) };
  });
  if (typeof recipe.finishedWeightGrams !== 'number' || !Number.isFinite(recipe.finishedWeightGrams) || recipe.finishedWeightGrams <= 0) {
    throw new Error('INVALID_AI_RESPONSE');
  }
  const finishedWeightGrams = Math.round(recipe.finishedWeightGrams);
  normalizeNutrition(recipe.nutritionTotal);
  const nutritionTotal = ingredients.reduce<Nutrition>((total, ingredient) => ({
    calories: total.calories + ingredient.nutrition.calories,
    protein: roundMacro(total.protein + ingredient.nutrition.protein),
    fat: roundMacro(total.fat + ingredient.nutrition.fat),
    carbs: roundMacro(total.carbs + ingredient.nutrition.carbs),
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  nutritionTotal.calories = Math.round(nutritionTotal.calories);
  const servings = typeof recipe.servings === 'number' && recipe.servings > 0 ? recipe.servings : 1;
  const excessiveOil = ingredients.some((ingredient) => /(?:масло растительное|оливковое масло|подсолнечное масло)/i.test(ingredient.name) && ingredient.amount / servings > 10);
  if (excessiveOil) throw new Error('INVALID_AI_RESPONSE');
  const factor = 100 / finishedWeightGrams;
  const nutritionPer100g = {
    calories: Math.round(nutritionTotal.calories * factor),
    protein: roundMacro(nutritionTotal.protein * factor),
    fat: roundMacro(nutritionTotal.fat * factor),
    carbs: roundMacro(nutritionTotal.carbs * factor),
  };
  return {
    ...recipe,
    ingredients,
    finishedWeightGrams,
    nutritionTotal,
    nutritionPer100g,
    // Поля сохранены для совместимости с уже существующим сохранением рецептов.
    calories: nutritionTotal.calories,
    protein: nutritionTotal.protein,
    fat: nutritionTotal.fat,
    carbs: nutritionTotal.carbs,
  };
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

    const usage = await checkDailyLimit(payload.sub as string, 'recipe-suggest', DAILY_LIMIT);
    if (!usage.allowed) {
      const status = usage.code === 'DAILY_LIMIT_EXCEEDED' ? 429 : 503;
      return json({ error: usage.code, requestId }, status, allowedOrigin);
    }

    const body = await request.json() as { mode?: unknown; products?: unknown; imageDataUrl?: unknown };
    if (body.mode !== 'products' && body.mode !== 'photo') return json({ error: 'INVALID_MODE', requestId }, 400, allowedOrigin);

    const content: Array<Record<string, string>> = [{
      type: 'input_text',
      text: body.mode === 'products'
        ? [
          `Пользователь перечислил продукты: ${String(body.products ?? '').slice(0, 2000)}`,
          'Не добавляй проценты к продуктам, если пользователь не указал жирность сам.',
          'Проценты допустимы только для молочных и жиросодержащих продуктов вроде творога, кефира, сметаны, молока, сливок, йогурта, сыра или сливочного масла.',
        ].join(' ')
        : [
          'Рассмотри фотографию продуктов для приготовления еды.',
          'Если видишь отдельные продукты, перечисли только те, которые уверенно распознаны.',
          'Не выдумывай бренд, жирность, вес, скрытые ингредиенты или продукты, которых не видно.',
          'Не добавляй проценты к продуктам, если на упаковке не видна жирность; проценты допустимы только для молочных и жиросодержащих продуктов.',
          'Названия нормализуй на русском языке.',
          'Если на фото уже готовое блюдо, установи photoKind=prepared_dish.',
          'Если продукты нельзя уверенно распознать или на фото не еда, установи photoKind=unclear.',
        ].join(' '),
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
      required: ['photoKind', 'recognizedProducts', 'suggestions'],
      properties: {
        photoKind: { type: 'string', enum: ['products', 'prepared_dish', 'unclear'] },
        recognizedProducts: { type: 'array', maxItems: 30, items: { type: 'string' } },
        suggestions: {
          type: 'array',
          minItems: 0,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'title', 'description', 'finishedWeightGrams', 'nutritionTotal', 'cookingTime', 'servings', 'ingredients', 'missingIngredients', 'steps'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              finishedWeightGrams: { type: 'number', minimum: 0.1 },
              nutritionTotal: {
                type: 'object',
                additionalProperties: false,
                required: ['calories', 'protein', 'fat', 'carbs'],
                properties: {
                  calories: { type: 'number', minimum: 0 },
                  protein: { type: 'number', minimum: 0 },
                  fat: { type: 'number', minimum: 0 },
                  carbs: { type: 'number', minimum: 0 },
                },
              },
              cookingTime: { type: 'integer', minimum: 1 },
              servings: { type: 'integer', minimum: 1 },
              ingredients: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'amount', 'unit', 'nutrition'], properties: { name: { type: 'string' }, amount: { type: 'number', minimum: 0.1 }, unit: { type: 'string', enum: ['г', 'мл'] }, nutrition: { type: 'object', additionalProperties: false, required: ['calories', 'protein', 'fat', 'carbs'], properties: { calories: { type: 'number', minimum: 0 }, protein: { type: 'number', minimum: 0 }, fat: { type: 'number', minimum: 0 }, carbs: { type: 'number', minimum: 0 } } } } } },
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
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model,
        store: false,
        instructions: [
          'Ты помощник по домашней кухне.',
          'Верни результат строго по схеме.',
          'Для списка продуктов или фотографии отдельных продуктов верни ровно 3 реалистичных рецепта на русском.',
          'Для фото готового блюда или неясного фото не предлагай рецепты.',
          'Все количества ингредиентов указывай только в граммах (г) или миллилитрах (мл). Никогда не используй штуки, ложки, стаканы, пачки, щепотки или другие бытовые меры.',
          'Переводи яйца и штучные продукты в съедобную массу: одно среднее яйцо без скорлупы — примерно 50 г. Масло, сахар, соусы и другие калорийные добавки обязательно включай.',
          'nutritionTotal — КБЖУ всего готового блюда целиком, а не порции и не 100 г.',
          'finishedWeightGrams — реалистичная масса всего готового блюда после потери или поглощения воды при приготовлении.',
          'servings — только рекомендуемое количество порций и не меняет базу nutritionTotal.',
          'Рассчитай КБЖУ детально по каждому ингредиенту с учётом его точного количества и жирности; nutritionTotal должен быть арифметической суммой КБЖУ ингредиентов. КБЖУ одной порции получается только делением nutritionTotal на servings.',
          'Не оценивай КБЖУ «на глаз» и не округляй грубо: калории округляй максимум до 1 ккал, белки, жиры и углеводы — максимум до 0.1 г.',
          'Всегда включай значимую для КБЖУ жирность или характеристику прямо в name ингредиента: «творог 2%», молоко/кефир/йогурт с конкретным %, сыр с конкретным % или типом, «говядина нежирная 6–9%», «фарш нежирный 6–9%», курицу и индейку — преимущественно как филе или другую нежирную часть.',
          'По умолчанию составляй ПП-рецепты из менее жирных продуктов. Не используй без обоснованной кулинарной необходимости творог 9%, жирный фарш, сливки, майонез или большое количество сыра.',
          'Растительного масла используй не более 10 г на одну порцию, предпочтительно 3–5 г или вовсе без масла. Проверь этот лимит после выбора servings.',
          'Предпочитай запекание, тушение, варку, приготовление на пару, сухую или антипригарную сковороду с минимальным количеством масла.',
          'Проверяй энергетическую согласованность: калории должны быть близки к 4 × белки + 9 × жиры + 4 × углеводы.',
          'Приоритет — уверенно распознанные продукты пользователя; недостающие обязательные продукты перечисляй отдельно.',
          'Не давай медицинских обещаний.',
        ].join(' '),
        input: [{ role: 'user', content }],
        text: { format: { type: 'json_schema', name: 'recipe_suggestions', strict: true, schema } },
      }),
    });

    if (!response.ok) {
      console.error(JSON.stringify({ event: 'recipe-suggest-failed', code: 'OPENAI_ERROR', requestId, status: response.status }));
      return json({ error: 'AI_TEMPORARILY_UNAVAILABLE', requestId }, 502, allowedOrigin);
    }

    const result = await response.json() as Record<string, unknown>;
    const parsed = JSON.parse(outputText(result)) as {
      photoKind?: string;
      recognizedProducts?: unknown[];
      suggestions?: unknown[];
    };
    if (body.mode === 'photo' && parsed.photoKind === 'prepared_dish') {
      return json({ error: 'PHOTO_IS_PREPARED_DISH', requestId }, 422, allowedOrigin);
    }
    if (body.mode === 'photo' && (parsed.photoKind !== 'products' || !Array.isArray(parsed.recognizedProducts) || parsed.recognizedProducts.length === 0)) {
      return json({ error: 'PHOTO_PRODUCTS_NOT_RECOGNIZED', requestId }, 422, allowedOrigin);
    }
    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 3) throw new Error('INVALID_AI_RESPONSE');
    const suggestions = parsed.suggestions.map(normalizeSuggestion);
    return json({
      recognizedProducts: body.mode === 'photo' ? parsed.recognizedProducts : [],
      suggestions,
    }, 200, allowedOrigin);
  } catch (error) {
    const code = error instanceof DOMException && error.name === 'TimeoutError'
      ? 'AI_TIMEOUT'
      : error instanceof Error ? error.message : 'UNKNOWN';
    console.error(JSON.stringify({ event: 'recipe-suggest-failed', code, requestId }));
    if (code === 'AI_TIMEOUT') return json({ error: 'AI_TEMPORARILY_UNAVAILABLE', requestId }, 504, allowedOrigin);
    return json({ error: 'RECIPE_SUGGEST_FAILED', requestId }, 500, allowedOrigin);
  }
});
