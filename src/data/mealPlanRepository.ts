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
};

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

const manualMealFromRow = (item: MealPlanItemRow): Meal | null => {
  if (item.entry_source === 'recipe' || !item.custom_title) return null;
  const products = Array.isArray(item.custom_products) ? item.custom_products.filter(isPlanProduct) : [];
  return {
    id: `${item.entry_source}-${item.meal_plan_id}-${item.meal_type}`,
    title: item.custom_title,
    description: item.entry_source === 'ai' ? 'Блюдо распознано ИИ' : 'Продукты добавлены вручную',
    mealType: item.meal_type,
    calories: Number(item.custom_calories),
    protein: Number(item.custom_protein_g),
    fat: Number(item.custom_fat_g),
    carbs: Number(item.custom_carbs_g),
    ingredients: products.map(({ name, amount, unit }) => ({ name, amount, unit, category: 'прочее' })),
    steps: [],
    tags: [item.entry_source === 'ai' ? 'ИИ' : 'вручную'],
    allergens: [],
    isPremium: false,
    source: 'manual',
    entrySource: item.entry_source,
    planProducts: products,
    cookingTime: 0,
    servings: 1,
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
    .select('meal_plan_id, meal_type, planned_recipe_id, entry_source, custom_title, custom_products, custom_calories, custom_protein_g, custom_fat_g, custom_carbs_g')
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
        if (recipe) result[day].meals[item.meal_type] = recipe;
        return;
      }
      result[day].meals[item.meal_type] = manualMealFromRow(item);
    });
  });

  return result;
}

export async function persistPlanDay(day: MenuDay, planDay: PlanDay) {
  const userId = await requireProfileId();
  const meals = menuMealSlots.flatMap((slot) => planDay.meals[slot] ? [{ slot, recipe: planDay.meals[slot]! }] : []);

  if (meals.length === 0) {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId)
      .eq('plan_date', dateForMenuDay(day));
    if (error) throw error;
    return;
  }

  const catalogMeals = meals.filter(({ recipe }) => !recipe.entrySource || recipe.entrySource === 'recipe');
  const recipeLegacyIds = catalogMeals.map(({ recipe }) => recipe.id);
  const [recipesResult, rationResult] = await Promise.all([
    recipeLegacyIds.length
      ? supabase.from('recipes').select('id, legacy_id').in('legacy_id', recipeLegacyIds)
      : Promise.resolve({ data: [], error: null }),
    planDay.rationId
      ? supabase.from('rations').select('id').eq('legacy_id', planDay.rationId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (recipesResult.error) throw recipesResult.error;
  if (rationResult.error) throw rationResult.error;

  const recipeIds = new Map((recipesResult.data ?? []).map((recipe) => [recipe.legacy_id as string, recipe.id as string]));
  const missingRecipeIds = [...new Set(recipeLegacyIds)].filter((legacyId) => !recipeIds.has(legacyId));
  if (missingRecipeIds.length > 0) {
    throw new Error(`Блюда рациона недоступны: ${missingRecipeIds.join(', ')}. Проверьте доступ к Premium.`);
  }
  if (planDay.rationId && !rationResult.data?.id) {
    throw new Error('Рацион недоступен для текущего уровня подписки.');
  }

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .upsert({
      user_id: userId,
      plan_date: dateForMenuDay(day),
      source_ration_id: rationResult.data?.id ?? null,
    }, { onConflict: 'user_id,plan_date' })
    .select('id')
    .single();
  if (planError || !plan?.id) throw planError ?? new Error('Не удалось сохранить день плана.');

  const { error: deleteError } = await supabase
    .from('meal_plan_items')
    .delete()
    .eq('meal_plan_id', plan.id);
  if (deleteError) throw deleteError;

  const { error: itemsError } = await supabase.from('meal_plan_items').insert(
    meals.map(({ slot, recipe }) => {
      const entrySource = recipe.entrySource ?? 'recipe';
      const isCatalogRecipe = entrySource === 'recipe';
      return {
        meal_plan_id: plan.id,
        meal_type: slot,
        planned_recipe_id: isCatalogRecipe ? recipeIds.get(recipe.id) : null,
        planned_servings: 1,
        entry_source: entrySource,
        custom_title: isCatalogRecipe ? null : recipe.title,
        custom_products: isCatalogRecipe ? [] : recipe.planProducts ?? [],
        custom_calories: isCatalogRecipe ? 0 : recipe.calories,
        custom_protein_g: isCatalogRecipe ? 0 : recipe.protein,
        custom_fat_g: isCatalogRecipe ? 0 : recipe.fat,
        custom_carbs_g: isCatalogRecipe ? 0 : recipe.carbs,
      };
    }),
  );
  if (itemsError) throw itemsError;
}
