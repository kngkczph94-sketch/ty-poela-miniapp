export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSource = 'ration' | 'recipe_book' | 'manual';
export type MealEntrySource = 'recipe' | 'manual' | 'ai';

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export type IngredientCategory =
  | 'овощи'
  | 'фрукты'
  | 'белок'
  | 'молочные'
  | 'крупы'
  | 'бакалея'
  | 'специи'
  | 'прочее';

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
};

export type PlanProduct = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type Meal = {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  allergens: string[];
  imageUrl?: string;
  videoUrl?: string;
  isPremium: boolean;
  source: MealSource;
  entrySource?: MealEntrySource;
  planProducts?: PlanProduct[];
  cookingTime: number;
  servings: number;
  plannedServings?: number;
  totalWeightGrams?: number;
  portionLabel?: string;
};

export type Recipe = Meal;

export const recipeToMeal = (recipe: Recipe): Meal => recipe;

const roundMacro = (value: number) => Math.round(value * 10) / 10;

/** plannedServings is a multiplier (for a gram portion it is weight / 100). */
export const recipeWithPlannedPortion = (recipe: Recipe, plannedServings: number, portionLabel?: string): Recipe => {
  const factor = plannedServings > 0 ? plannedServings : 1;
  const currentFactor = recipe.plannedServings ?? 1;
  return {
    ...recipe,
    calories: Math.round(recipe.calories / currentFactor * factor),
    protein: roundMacro(recipe.protein / currentFactor * factor),
    fat: roundMacro(recipe.fat / currentFactor * factor),
    carbs: roundMacro(recipe.carbs / currentFactor * factor),
    plannedServings: factor,
    portionLabel: portionLabel ?? `${factor} порц.`,
  };
};
