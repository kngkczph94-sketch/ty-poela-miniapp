import type { Meal } from './recipe';

export type DailyRation = {
  id: string;
  rationNumber: number;
  title: string;
  description: string;
  isPremium: boolean;
  tags: string[];
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
  publishedAt: string;
  sortOrder: number;
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
