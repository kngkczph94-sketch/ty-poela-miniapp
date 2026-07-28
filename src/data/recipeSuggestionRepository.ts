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
};

type SuggestionResponse = { suggestions?: RecipeSuggestion[] };

export type RecipeSuggestionRequest =
  | { mode: 'products'; products: string }
  | { mode: 'photo'; imageDataUrl: string };

export async function suggestRecipes(input: RecipeSuggestionRequest): Promise<RecipeSuggestion[]> {
  const session = await ensureFreshSession();
  const { data, error } = await supabase.functions.invoke<SuggestionResponse>('recipe-suggest', {
    body: input,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    if (/401|jwt|unauthorized/i.test(error.message)) {
      const refreshed = await ensureFreshSession(true);
      const retry = await supabase.functions.invoke<SuggestionResponse>('recipe-suggest', {
        body: input,
        headers: { Authorization: `Bearer ${refreshed.access_token}` },
      });
      if (retry.error) throw retry.error;
      if (retry.data?.suggestions?.length === 3) return retry.data.suggestions;
    }
    throw error;
  }

  if (!data?.suggestions || data.suggestions.length !== 3) {
    throw new Error('ИИ вернул неполный список рецептов.');
  }

  return data.suggestions;
}
