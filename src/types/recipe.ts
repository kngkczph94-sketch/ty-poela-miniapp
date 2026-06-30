export type MealType = 'завтрак' | 'обед' | 'ужин' | 'перекус' | 'десерт';

export type Recipe = {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookingTime: number;
  servings: number;
  mealType: MealType;
  ingredients: string[];
  steps: string[];
  tags: string[];
  isPremium: boolean;
};
