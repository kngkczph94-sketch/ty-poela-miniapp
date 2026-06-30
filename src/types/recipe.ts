export type MealType = 'завтрак' | 'обед' | 'ужин' | 'перекус' | 'десерт';

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

export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookingTime: number;
  servings: number;
  mealType: MealType;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  isPremium: boolean;
};
