import { ensureFreshSession, supabase } from '../lib/supabase';

export type RecipeNutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type RecipeSuggestionIngredient = {
  name: string;
  amount: number;
  unit: 'г' | 'мл';
  nutrition: RecipeNutrition;
};

export type RecipeSuggestion = {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  /** Примерный вес всего готового блюда после приготовления. */
  finishedWeightGrams?: number;
  /** КБЖУ всего готового рецепта. Старые поля выше дублируют эти значения для совместимости. */
  nutritionTotal?: RecipeNutrition;
  /** КБЖУ на 100 г готового блюда. */
  nutritionPer100g?: RecipeNutrition;
  cookingTime: number;
  servings: number;
  ingredients: RecipeSuggestionIngredient[];
  missingIngredients: string[];
  steps: string[];
  imageUrl?: string;
};

export type RecipeSuggestionResult = {
  suggestions: RecipeSuggestion[];
  recognizedProducts: string[];
};

type SuggestionResponse = {
  suggestions?: RecipeSuggestion[];
  recognizedProducts?: string[];
};
type RecipeImageResponse = { imageUrl?: string; cached?: boolean; requestId?: string };
type FunctionErrorResponse = { error?: string; requestId?: string };

export type RecipeSuggestionRequest =
  | { mode: 'products'; products: string }
  | { mode: 'photo'; imageDataUrl: string };

const functionErrorMessages: Record<string, string> = {
  AI_NOT_CONFIGURED: 'ИИ-подбор ещё не настроен.',
  AI_TEMPORARILY_UNAVAILABLE: 'ИИ сейчас не отвечает. Попробуйте ещё раз через минуту.',
  AUTHORIZATION_FAILED: 'Сессия устарела. Закройте и снова откройте приложение в Telegram.',
  DAILY_LIMIT_EXCEEDED: 'Дневной лимит запросов к ИИ исчерпан. Попробуйте завтра.',
  RATE_LIMIT_UNAVAILABLE: 'Сервис временно недоступен. Попробуйте ещё раз через минуту.',
  IMAGE_PROVIDER_FAILED: 'Сервис создания фото временно недоступен.',
  IMAGE_RESPONSE_INVALID: 'Сервис не смог создать корректное фото блюда.',
  IMAGE_UPLOAD_FAILED: 'Фото создано, но не удалось сохранить его.',
  INVALID_IMAGE: 'Не удалось обработать фотографию. Выберите другое фото.',
  ORIGIN_NOT_ALLOWED: 'Откройте приложение из меню Telegram-бота.',
  PHOTO_IS_PREPARED_DISH: 'На фото похоже готовое блюдо. Для подбора рецептов сфотографируйте отдельные продукты.',
  PHOTO_PRODUCTS_NOT_RECOGNIZED: 'Не удалось уверенно распознать продукты. Сделайте фото при хорошем освещении, чтобы продукты были видны отдельно.',
  RECIPE_SUGGEST_FAILED: 'Не удалось подобрать рецепты. Попробуйте ещё раз.',
  SIGNED_URL_FAILED: 'Фото сохранено, но не удалось открыть его.',
  SERVER_NOT_CONFIGURED: 'Сервис изображений ещё не настроен.',
};

async function readableFunctionError(error: unknown) {
  if (!error || typeof error !== 'object' || !('context' in error)) return null;
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return null;
  try {
    const body = await context.clone().json() as FunctionErrorResponse;
    const message = body.error ? functionErrorMessages[body.error] : '';
    if (!message) return null;
    return new Error(body.requestId ? `${message} Код запроса: ${body.requestId}` : message);
  } catch {
    return null;
  }
}

async function invokeWithSession<T>(functionName: string, body: unknown): Promise<T> {
  const session = await ensureFreshSession();
  const invoke = (accessToken: string) => supabase.functions.invoke<T>(functionName, {
    body: body as Record<string, unknown>,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let result = await invoke(session.access_token);
  if (result.error && /401|jwt|unauthorized/i.test(result.error.message)) {
    const refreshed = await ensureFreshSession(true);
    result = await invoke(refreshed.access_token);
  }
  if (result.error) {
    throw (await readableFunctionError(result.error)) ?? result.error;
  }
  if (!result.data) throw new Error('Сервис не вернул данные.');
  return result.data;
}

export async function suggestRecipes(input: RecipeSuggestionRequest): Promise<RecipeSuggestionResult> {
  const data = await invokeWithSession<SuggestionResponse>('recipe-suggest', input);
  if (!data.suggestions || data.suggestions.length !== 3) {
    throw new Error('ИИ вернул неполный список рецептов.');
  }
  return {
    suggestions: data.suggestions,
    recognizedProducts: Array.isArray(data.recognizedProducts) ? data.recognizedProducts : [],
  };
}

export async function generateRecipeImage(recipe: RecipeSuggestion): Promise<string> {
  console.info('[recipe-image] invoke', { recipeId: recipe.id });
  const data = await invokeWithSession<RecipeImageResponse>('recipe-image', {
    recipe: {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
    },
  });
  if (!data.imageUrl) {
    throw new Error(data.requestId
      ? `Не удалось получить изображение блюда. Код запроса: ${data.requestId}`
      : 'Не удалось получить изображение блюда.');
  }
  return data.imageUrl;
}
