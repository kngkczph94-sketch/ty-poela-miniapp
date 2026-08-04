import { ensureFreshSession, supabase } from '../lib/supabase';
import { findRecipeWithRationImage } from './recipesWithRationImages';
import {
  createEmptyWeeklyMenu,
  menuDays,
  menuMealSlots,
  type MenuDay,
  type PlanDay,
  type WeeklyMenu,
} from '../types/menu';
import type { Meal, MealEntrySource, PlanProduct } from '../types/recipe';

type MealPlanRow = {
  id: string;
  plan_date: string;
  source_ration_id: string | null;
};

type MealPlanItemRow = {
  meal_plan_id: string;
  meal_type: keyof PlanDay['meals'];
  planned_recipe_id: string | null;
  entry_source: MealEntrySource;
  custom_title: string | null;
  custom_products: unknown;
  custom_calories: number | string;
  custom_protein_g: number | string;
  custom_fat_g: number | string;
  custom_carbs_g: number | string;
  planned_servings: number | string;
  portion_amount: number | string | null;
  portion_unit: 'serving' | 'g' | null;
  custom_recipe_data: Partial<Meal> | null;
  custom_image_url: string | null;
};

type PersistedPlanItem = Omit<MealPlanItemRow, 'meal_plan_id'>;

const supabaseError = (context: string, error: { message: string; code?: string; details?: string; hint?: string }) =>
  new Error(`${context}: message=${error.message}; code=${error.code ?? 'n/a'}; details=${error.details ?? 'n/a'}; hint=${error.hint ?? 'n/a'}`);

const localDateAtOffset = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateForMenuDay = (day: MenuDay) => localDateAtOffset(menuDays.indexOf(day));

const isPlanProduct = (value: unknown): value is PlanProduct => {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<PlanProduct>;
  return typeof product.id === 'string'
    && typeof product.name === 'string'
    && typeof product.unit === 'string'
    && ['amount', 'calories', 'protein', 'fat', 'carbs'].every((key) => typeof product[key as keyof PlanProduct] === 'number');
};

const portionLabelFromRow = (item: MealPlanItemRow) => item.portion_unit === 'g'
  ? `${Number(item.portion_amount)} г`
  : `${Number(item.portion_amount ?? item.planned_servings) || 1} порц.`;

const nutritionValue = (value: number | string, fallback: number) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
};

const manualMealFromRow = (item: MealPlanItemRow): Meal | null => {
  if (item.entry_source === 'recipe' || !item.custom_title) return null;
  const products = Array.isArray(item.custom_products) ? item.custom_products.filter(isPlanProduct) : [];
  return {
    ...(item.custom_recipe_data ?? {}),
    id: `${item.entry_source}-${item.meal_plan_id}-${item.meal_type}`,
    title: item.custom_title,
    description: item.entry_source === 'ai' ? 'Блюдо распознано ИИ' : 'Продукты добавлены вручную',
    mealType: item.meal_type,
    calories: Number(item.custom_calories),
    protein: Number(item.custom_protein_g),
    fat: Number(item.custom_fat_g),
    carbs: Number(item.custom_carbs_g),
    ingredients: products.map(({ name, amount, unit }) => ({ name, amount, unit, category: 'прочее' })),
    steps: item.custom_recipe_data?.steps ?? [],
    tags: [item.entry_source === 'ai' ? 'ИИ' : 'вручную'],
    allergens: [],
    isPremium: false,
    source: 'manual',
    entrySource: item.entry_source,
    planProducts: products,
    imageUrl: item.custom_image_url ?? item.custom_recipe_data?.imageUrl,
    cookingTime: 0,
    servings: 1,
    plannedServings: Number(item.planned_servings) || 1,
    portionLabel: portionLabelFromRow(item),
  };
};

const requireProfileId = async () => {
  await ensureFreshSession();

  let result = await supabase.rpc('current_app_user_id');
  if (result.error?.message.toLowerCase().includes('jwt expired')) {
    await ensureFreshSession(true);
    result = await supabase.rpc('current_app_user_id');
  }

  if (result.error) throw new Error(`Не удалось определить профиль пользователя: ${result.error.message}`);
  if (typeof result.data !== 'string' || !result.data) {
    throw new Error('Профиль пользователя не связан с текущей авторизацией.');
  }
  return result.data;
};

export async function loadWeeklyMenu(): Promise<WeeklyMenu> {
  const dates = menuDays.map((_, index) => localDateAtOffset(index));
  const { data: plansData, error: plansError } = await supabase
    .from('meal_plans')
    .select('id, plan_date, source_ration_id')
    .in('plan_date', dates);
  if (plansError) throw plansError;

  const plans = (plansData ?? []) as MealPlanRow[];
  if (plans.length === 0) return createEmptyWeeklyMenu();

  const planIds = plans.map((plan) => plan.id);
  const rationIds = plans.flatMap((plan) => plan.source_ration_id ? [plan.source_ration_id] : []);
  const { data: itemsData, error: itemsError } = await supabase
    .from('meal_plan_items')
    .select('meal_plan_id, meal_type, planned_recipe_id, planned_servings, portion_amount, portion_unit, entry_source, custom_title, custom_products, custom_calories, custom_protein_g, custom_fat_g, custom_carbs_g, custom_recipe_data, custom_image_url')
    .in('meal_plan_id', planIds);
  if (itemsError) throw itemsError;

  const items = (itemsData ?? []) as MealPlanItemRow[];
  const recipeIds = items.flatMap((item) => item.planned_recipe_id ? [item.planned_recipe_id] : []);
  const [recipesResult, rationsResult] = await Promise.all([
    recipeIds.length
      ? supabase.from('recipes').select('id, legacy_id').in('id', recipeIds)
      : Promise.resolve({ data: [], error: null }),
    rationIds.length
      ? supabase.from('rations').select('id, legacy_id, ration_number').in('id', rationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (recipesResult.error) throw recipesResult.error;
  if (rationsResult.error) throw rationsResult.error;

  const recipeLegacyIds = new Map((recipesResult.data ?? []).map((recipe) => [recipe.id as string, recipe.legacy_id as string]));
  const rations = new Map((rationsResult.data ?? []).map((ration) => [ration.id as string, ration]));
  const result = createEmptyWeeklyMenu();

  plans.forEach((plan) => {
    const dayIndex = dates.indexOf(plan.plan_date);
    if (dayIndex < 0) return;
    const day = menuDays[dayIndex];
    const ration = plan.source_ration_id ? rations.get(plan.source_ration_id) : undefined;
    if (ration) {
      result[day].rationId = ration.legacy_id as string;
      result[day].rationNumber = ration.ration_number as number;
    }
    items.filter((item) => item.meal_plan_id === plan.id).forEach((item) => {
      if (item.planned_recipe_id) {
        const legacyId = recipeLegacyIds.get(item.planned_recipe_id);
        const recipe = legacyId ? findRecipeWithRationImage(legacyId) : undefined;
        if (recipe) {
          const servings = Number(item.planned_servings) || 1;
          result[day].meals[item.meal_type] = {
            ...recipe,
            calories: nutritionValue(item.custom_calories, Math.round(recipe.calories * servings)),
            protein: nutritionValue(item.custom_protein_g, Math.round(recipe.protein * servings * 10) / 10),
            fat: nutritionValue(item.custom_fat_g, Math.round(recipe.fat * servings * 10) / 10),
            carbs: nutritionValue(item.custom_carbs_g, Math.round(recipe.carbs * servings * 10) / 10),
            plannedServings: servings,
            portionLabel: portionLabelFromRow(item),
          };
        }
        return;
      }
      result[day].meals[item.meal_type] = manualMealFromRow(item);
    });
  });

  return result;
}

export async function persistPlanDay(day: MenuDay, planDay: PlanDay) {
  await requireProfileId();
  const meals = menuMealSlots.flatMap((slot) => planDay.meals[slot] ? [{ slot, recipe: planDay.meals[slot]! }] : []);

  const catalogMeals = meals.filter(({ recipe }) => !recipe.entrySource || recipe.entrySource === 'recipe');
  const catalogRecipeIds = [...new Set(catalogMeals.map(({ recipe }) => recipe.id))];
  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const supabaseRecipeIds = catalogRecipeIds.filter(isUuid);
  const recipeLegacyIds = catalogRecipeIds;
  const [recipesByLegacyResult, recipesByIdResult, rationResult] = await Promise.all([
    recipeLegacyIds.length
      ? supabase.from('recipes').select('id, legacy_id').in('legacy_id', recipeLegacyIds)
      : Promise.resolve({ data: [], error: null }),
    supabaseRecipeIds.length
      ? supabase.from('recipes').select('id, legacy_id').in('id', supabaseRecipeIds)
      : Promise.resolve({ data: [], error: null }),
    planDay.rationId
      ? supabase.from('rations').select('id').eq('legacy_id', planDay.rationId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (recipesByLegacyResult.error) throw supabaseError('Не удалось найти рецепты по legacy_id', recipesByLegacyResult.error);
  if (recipesByIdResult.error) throw supabaseError('Не удалось найти рецепты по id', recipesByIdResult.error);
  if (rationResult.error) throw supabaseError('Не удалось найти готовый рацион', rationResult.error);

  const resolvedRecipes = [...(recipesByLegacyResult.data ?? []), ...(recipesByIdResult.data ?? [])];
  const recipeIds = new Map<string, string>();
  // Legacy matches are registered first; an exact recipes.id match always wins.
  resolvedRecipes.forEach((resolved) => {
    recipeIds.set(resolved.legacy_id as string, resolved.id as string);
  });
  (recipesByIdResult.data ?? []).forEach((resolved) => recipeIds.set(resolved.id as string, resolved.id as string));
  if (planDay.rationId && !rationResult.data?.id) {
    throw new Error('Рацион недоступен для текущего уровня подписки.');
  }

  const missingRecipe = catalogMeals.find(({ recipe }) => !recipeIds.has(recipe.id));
  if (missingRecipe) {
    throw new Error(`Каталоговый рецепт не найден: название="${missingRecipe.recipe.title}"; исходный ID="${missingRecipe.recipe.id}"; entrySource="${missingRecipe.recipe.entrySource ?? 'recipe'}".`);
  }

  const items: PersistedPlanItem[] = meals.map(({ slot, recipe }) => {
      const entrySource = recipe.entrySource ?? 'recipe';
      const resolvedRecipeId = entrySource === 'recipe' ? recipeIds.get(recipe.id) ?? null : null;
      const isCatalogRecipe = entrySource === 'recipe';
      return {
        meal_type: slot,
        // The FK must always receive recipes.id (UUID), never a local/legacy identifier.
        planned_recipe_id: resolvedRecipeId,
        planned_servings: recipe.plannedServings ?? 1,
        portion_amount: Number.parseFloat(recipe.portionLabel ?? '') || recipe.plannedServings || 1,
        portion_unit: recipe.portionLabel?.endsWith(' г') ? 'g' : 'serving',
        entry_source: entrySource,
        custom_title: isCatalogRecipe ? null : recipe.title,
        custom_products: isCatalogRecipe ? [] : recipe.planProducts ?? recipe.ingredients.map((ingredient, index) => ({
          id: `${recipe.id}-ingredient-${index}`,
          ...ingredient,
          calories: 0, protein: 0, fat: 0, carbs: 0,
        })),
        custom_calories: recipe.calories,
        custom_protein_g: recipe.protein,
        custom_fat_g: recipe.fat,
        custom_carbs_g: recipe.carbs,
        custom_recipe_data: isCatalogRecipe ? null : recipe,
        custom_image_url: isCatalogRecipe ? null : recipe.imageUrl ?? null,
      };
    });

  const { error } = await supabase.rpc('replace_meal_plan_day', {
    p_plan_date: dateForMenuDay(day),
    p_source_ration_id: rationResult.data?.id ?? null,
    p_items: items,
  });
  if (error) throw supabaseError('Не удалось атомарно сохранить план питания', error);
}
