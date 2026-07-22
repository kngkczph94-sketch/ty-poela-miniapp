import { supabase } from '../lib/supabase';
import { findRecipeWithRationImage } from './recipesWithRationImages';
import {
  createEmptyWeeklyMenu,
  menuDays,
  menuMealSlots,
  type MenuDay,
  type PlanDay,
  type WeeklyMenu,
} from '../types/menu';

type MealPlanRow = {
  id: string;
  plan_date: string;
  source_ration_id: string | null;
};

type MealPlanItemRow = {
  meal_plan_id: string;
  meal_type: keyof PlanDay['meals'];
  planned_recipe_id: string | null;
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

const requireProfileId = async () => {
  const { data, error } = await supabase.from('users').select('id').single();
  if (error || !data?.id) throw new Error('Не удалось определить профиль пользователя.');
  return data.id as string;
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
    .select('meal_plan_id, meal_type, planned_recipe_id')
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
      if (!item.planned_recipe_id) return;
      const legacyId = recipeLegacyIds.get(item.planned_recipe_id);
      const recipe = legacyId ? findRecipeWithRationImage(legacyId) : undefined;
      if (recipe) result[day].meals[item.meal_type] = recipe;
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

  const recipeLegacyIds = meals.map(({ recipe }) => recipe.id);
  const [recipesResult, rationResult] = await Promise.all([
    supabase.from('recipes').select('id, legacy_id').in('legacy_id', recipeLegacyIds),
    planDay.rationId
      ? supabase.from('rations').select('id').eq('legacy_id', planDay.rationId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (recipesResult.error) throw recipesResult.error;
  if (rationResult.error) throw rationResult.error;

  const recipeIds = new Map((recipesResult.data ?? []).map((recipe) => [recipe.legacy_id as string, recipe.id as string]));
  if (recipeIds.size !== new Set(recipeLegacyIds).size) throw new Error('Не удалось найти один из рецептов плана.');

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
    meals.map(({ slot, recipe }) => ({
      meal_plan_id: plan.id,
      meal_type: slot,
      planned_recipe_id: recipeIds.get(recipe.id),
      planned_servings: 1,
    })),
  );
  if (itemsError) throw itemsError;
}
