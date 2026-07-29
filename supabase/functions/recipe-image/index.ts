import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const openAiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
const imageModel = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1-mini';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const bucket = Deno.env.get('RECIPE_IMAGE_BUCKET') ?? 'content-images';
const signedUrlSeconds = 60 * 60 * 24 * 365;
const imageStyleVersion = 'ty-poela-food-v2';

type Ingredient = { name?: unknown; amount?: unknown; unit?: unknown };
type RecipeInput = { id?: unknown; title?: unknown; description?: unknown; ingredients?: unknown };

class RecipeImageError extends Error {
  constructor(
    message: string,
    readonly diagnostics: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

function corsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function validateJwt(authorization: string | null) {
  if (!authorization?.startsWith('Bearer ')) throw new Error('AUTHORIZATION_FAILED');
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('AUTHORIZATION_FAILED');
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (!payload.sub || payload.role !== 'authenticated' || Number(payload.exp) * 1000 <= Date.now()) {
    throw new Error('AUTHORIZATION_FAILED');
  }
}

function normalizeRecipe(recipe: RecipeInput) {
  const title = typeof recipe.title === 'string' ? recipe.title.trim().slice(0, 120) : '';
  const description = typeof recipe.description === 'string' ? recipe.description.trim().slice(0, 600) : '';
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.slice(0, 30).map((item: Ingredient) => ({
        name: typeof item?.name === 'string' ? item.name.trim().slice(0, 100) : '',
        amount: Number(item?.amount) || 0,
        unit: typeof item?.unit === 'string' ? item.unit.trim().slice(0, 30) : '',
      })).filter((item) => item.name)
    : [];
  if (!title || ingredients.length === 0) throw new Error('INVALID_RECIPE');
  return { title, description, ingredients };
}

async function cacheKey(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function buildImagePrompt(recipe: ReturnType<typeof normalizeRecipe>) {
  const ingredients = recipe.ingredients
    .map((item) => `${item.name} ${item.amount} ${item.unit}`)
    .join(', ');

  return [
    'Create one photorealistic premium editorial food photograph for the nutrition app "Ты поела?".',
    `Finished dish: ${recipe.title}.`,
    recipe.description ? `Dish description: ${recipe.description}.` : '',
    `Use these ingredients faithfully: ${ingredients}.`,
    'Visual style is fixed: a single finished serving centered on one elegant ceramic plate;',
    '45-degree three-quarter camera angle; square 1:1 composition; close editorial crop;',
    'soft natural side daylight; warm cream and light beige matte table surface;',
    'gentle realistic shadows; fresh natural colors; appetizing but believable texture;',
    'minimal premium cookbook styling with at most two subtle neutral props kept away from the food.',
    'Keep portion size and visible ingredients realistic. The dish must be the only visual subject.',
    'Do not show people, hands, faces, text, letters, labels, logos, watermarks, packaging,',
    'menus, collages, multiple plates, duplicate food, surreal objects, excessive garnish,',
    'harsh flash, dark restaurant lighting, extreme saturation, illustration, CGI, or cartoon style.',
  ].filter(Boolean).join(' ');
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  const requestId = crypto.randomUUID();
  if (request.method === 'OPTIONS') {
    return allowedOrigins.includes(origin ?? '')
      ? new Response('ok', { headers: corsHeaders(origin) })
      : json(origin, { error: 'Origin not allowed', requestId }, 403);
  }
  if (request.method !== 'POST' || !allowedOrigins.includes(origin ?? '')) {
    return json(origin, { error: 'Request not allowed', requestId }, 403);
  }

  try {
    validateJwt(request.headers.get('Authorization'));
    console.log(JSON.stringify({ event: 'recipe-image-invoked', requestId }));
    if (!openAiKey || !supabaseUrl || !serviceRoleKey) throw new Error('SERVER_NOT_CONFIGURED');

    const body = await request.json();
    const recipe = normalizeRecipe(body?.recipe ?? {});
    const key = await cacheKey({ imageStyleVersion, recipe });
    const objectPath = `ai-recipes/${key}.webp`;
    const storage = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }).storage.from(bucket);

    const cached = await storage.createSignedUrl(objectPath, signedUrlSeconds);
    if (cached.data?.signedUrl) {
      console.log(JSON.stringify({
        event: 'recipe-image-cache-hit',
        requestId,
        cacheKey: key.slice(0, 12),
        style: imageStyleVersion,
      }));
      return json(origin, { imageUrl: cached.data.signedUrl, cached: true, requestId });
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: buildImagePrompt(recipe),
        n: 1,
        size: '1024x1024',
        quality: 'low',
        output_format: 'webp',
      }),
    });
    const openAiBody = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      throw new RecipeImageError('IMAGE_PROVIDER_FAILED', {
        providerStatus: openAiResponse.status,
        providerCode: openAiBody?.error?.code ?? openAiBody?.error?.type ?? 'unknown',
      });
    }
    const base64 = openAiBody?.data?.[0]?.b64_json;
    if (typeof base64 !== 'string' || base64.length === 0) {
      throw new RecipeImageError('IMAGE_RESPONSE_INVALID');
    }

    const upload = await storage.upload(objectPath, decodeBase64(base64), {
      contentType: 'image/webp',
      upsert: true,
    });
    if (upload.error) {
      throw new RecipeImageError('IMAGE_UPLOAD_FAILED', {
        storageError: upload.error.name || 'upload_error',
      });
    }
    const signed = await storage.createSignedUrl(objectPath, signedUrlSeconds);
    if (!signed.data?.signedUrl) throw new RecipeImageError('SIGNED_URL_FAILED');

    console.log(JSON.stringify({
      event: 'recipe-image-created',
      requestId,
      cacheKey: key.slice(0, 12),
      model: imageModel,
      style: imageStyleVersion,
    }));
    return json(origin, { imageUrl: signed.data.signedUrl, cached: false, requestId });
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : 'UNKNOWN_ERROR';
    const status = code === 'AUTHORIZATION_FAILED' ? 401 : code === 'INVALID_RECIPE' ? 400 : 502;
    const diagnostics = cause instanceof RecipeImageError ? cause.diagnostics : {};
    console.error(JSON.stringify({
      event: 'recipe-image-failed',
      requestId,
      code,
      ...diagnostics,
    }));
    return json(origin, { error: code, requestId }, status);
  }
});
