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
  selectedWeightGrams?: number;
  fullRecipeNutrition?: Pick<Meal, 'calories' | 'protein' | 'fat' | 'carbs'>;
  nutritionPer100Grams?: Pick<Meal, 'calories' | 'protein' | 'fat' | 'carbs'>;
  fullRecipeIngredients?: Ingredient[];
  portionLabel?: string;
};

export type Recipe = Meal;

export const recipeToMeal = (recipe: Recipe): Meal => recipe;

const roundMacro = (value: number) => Math.round(value * 10) / 10;

export const recipeWithSelectedWeight = (recipe: Recipe, selectedWeightGrams?: number): Recipe => {
  const totalWeightGrams = recipe.totalWeightGrams;
  if (!totalWeightGrams || !Number.isFinite(totalWeightGrams) || totalWeightGrams <= 0) {
    throw new Error('Для рецепта не указан полный вес готового блюда. Добавление в план невозможно.');
  }
  const selectedWeight = selectedWeightGrams ?? totalWeightGrams;
  if (!Number.isFinite(selectedWeight) || selectedWeight <= 0) {
    throw new Error('Количество блюда должно быть положительным числом.');
  }
  const factor = selectedWeight / totalWeightGrams;
  const fullNutrition = recipe.fullRecipeNutrition ?? {
    calories: recipe.calories,
    protein: recipe.protein,
    fat: recipe.fat,
    carbs: recipe.carbs,
  };
  const fullIngredients = recipe.fullRecipeIngredients ?? recipe.ingredients;
  return {
    ...recipe,
    calories: Math.round(fullNutrition.calories * factor),
    protein: roundMacro(fullNutrition.protein * factor),
    fat: roundMacro(fullNutrition.fat * factor),
    carbs: roundMacro(fullNutrition.carbs * factor),
    ingredients: fullIngredients.map((ingredient) => ({ ...ingredient, amount: roundMacro(ingredient.amount * factor) })),
    planProducts: recipe.planProducts?.map((product) => ({
      ...product,
      amount: roundMacro(product.amount * factor),
      calories: roundMacro(product.calories * factor),
      protein: roundMacro(product.protein * factor),
      fat: roundMacro(product.fat * factor),
      carbs: roundMacro(product.carbs * factor),
    })),
    fullRecipeNutrition: fullNutrition,
    nutritionPer100Grams: {
      calories: Math.round(fullNutrition.calories * 100 / totalWeightGrams),
      protein: roundMacro(fullNutrition.protein * 100 / totalWeightGrams),
      fat: roundMacro(fullNutrition.fat * 100 / totalWeightGrams),
      carbs: roundMacro(fullNutrition.carbs * 100 / totalWeightGrams),
    },
    fullRecipeIngredients: fullIngredients,
    selectedWeightGrams: selectedWeight,
    plannedServings: 1,
    portionLabel: `${selectedWeight} г`,
  };
};
