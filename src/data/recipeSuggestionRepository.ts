import { ensureFreshSession, supabase } from '../lib/supabase';

export type RecipeSuggestionIngredient = {
  name: string;
  amount: number;
  unit: string;
};

export type RecipeSuggestion = {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookingTime: number;
  servings: number;
  ingredients: RecipeSuggestionIngredient[];
  missingIngredients: string[];
  steps: string[];
  imageUrl?: string;
};

type SuggestionResponse = { suggestions?: RecipeSuggestion[] };
type RecipeImageResponse = { imageUrl?: string; cached?: boolean };

export type RecipeSuggestionRequest =
  | { mode: 'products'; products: string }
  | { mode: 'photo'; imageDataUrl: string };

async function invokeWithSession<T>(functionName: string, body: unknown): Promise<T> {
  const session = await ensureFreshSession();
  const invoke = (accessToken: string) => supabase.functions.invoke<T>(functionName, {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let result = await invoke(session.access_token);
  if (result.error && /401|jwt|unauthorized/i.test(result.error.message)) {
    const refreshed = await ensureFreshSession(true);
    result = await invoke(refreshed.access_token);
  }
  if (result.error) throw result.error;
  if (!result.data) throw new Error('Сервис не вернул данные.');
  return result.data;
}

export async function suggestRecipes(input: RecipeSuggestionRequest): Promise<RecipeSuggestion[]> {
  const data = await invokeWithSession<SuggestionResponse>('recipe-suggest', input);
  if (!data.suggestions || data.suggestions.length !== 3) {
    throw new Error('ИИ вернул неполный список рецептов.');
  }
  return data.suggestions;
}

export async function generateRecipeImage(recipe: RecipeSuggestion): Promise<string> {
  const data = await invokeWithSession<RecipeImageResponse>('recipe-image', {
    recipe: {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
    },
  });
  if (!data.imageUrl) throw new Error('Не удалось получить изображение блюда.');
  return data.imageUrl;
}
