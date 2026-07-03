import type { Meal } from './recipe';

export type DailyRation = {
  id: string;
  number: number;
  rationNumber: number;
  title: string;
  description: string;
  isPremium: boolean;
  tags: string[];
  imageUrl?: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
  publishedAt: string;
  sortOrder: number;
  adaptedFrom?: {
    originalCalories: number;
    targetCalories: number;
    scaleFactor: number;
    originalMeals: DailyRation['meals'];
  };
};

export const calculateMealsNutrition = (meals: Partial<Record<keyof DailyRation['meals'], Meal | null>>) =>
  Object.values(meals).reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal?.calories ?? 0),
      protein: totals.protein + (meal?.protein ?? 0),
      fat: totals.fat + (meal?.fat ?? 0),
      carbs: totals.carbs + (meal?.carbs ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );


export const adaptRationToCalories = (ration: DailyRation, targetCalories: number): DailyRation => {
  const originalCalories = calculateMealsNutrition(ration.meals).calories;
  const scaleFactor = targetCalories / originalCalories;
  const scaleNumber = (value: number) => Math.round(value * scaleFactor);
  const meals = Object.fromEntries(
    Object.entries(ration.meals).map(([slot, meal]) => [
      slot,
      {
        ...meal,
        calories: scaleNumber(meal.calories),
        protein: scaleNumber(meal.protein),
        fat: scaleNumber(meal.fat),
        carbs: scaleNumber(meal.carbs),
        ingredients: meal.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: scaleNumber(ingredient.amount),
        })),
      },
    ]),
  ) as DailyRation['meals'];

  return {
    ...ration,
    meals,
    adaptedFrom: {
      originalCalories,
      targetCalories,
      scaleFactor,
      originalMeals: ration.meals,
    },
  };
};
