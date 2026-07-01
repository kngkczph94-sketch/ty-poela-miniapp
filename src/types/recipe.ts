export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSource = 'ration' | 'recipe_book' | 'manual';

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
  cookingTime: number;
  servings: number;
};

export type Recipe = Meal;

export const recipeToMeal = (recipe: Recipe): Meal => recipe;
