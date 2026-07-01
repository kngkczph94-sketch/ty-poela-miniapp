import { recipes } from './recipes';
import type { DailyRation } from '../types/ration';
import type { Meal } from '../types/recipe';

const mealById = (id: string): Meal => {
  const meal = recipes.find((recipe) => recipe.id === id);
  if (!meal) throw new Error(`Meal ${id} not found`);
  return { ...meal, source: 'ration' };
};

export const dailyRations: DailyRation[] = [
  { id: 'ration-1', rationNumber: 1, title: 'Рацион №1', description: 'Спокойный базовый день с понятными блюдами и плотным обедом.', isPremium: false, tags: ['старт', 'сбалансировано'], meals: { breakfast: mealById('breakfast-1'), lunch: mealById('lunch-1'), dinner: mealById('dinner-2'), snack: mealById('snack-1') }, publishedAt: '2026-07-01', sortOrder: 1 },
  { id: 'ration-2', rationNumber: 2, title: 'Рацион №2', description: 'День с сырниками, рыбой и мягким творожным перекусом.', isPremium: false, tags: ['рыба', 'творог'], meals: { breakfast: mealById('breakfast-3'), lunch: mealById('lunch-3'), dinner: mealById('dinner-4'), snack: mealById('snack-2') }, publishedAt: '2026-07-01', sortOrder: 2 },
  { id: 'ration-3', rationNumber: 3, title: 'Рацион №3', description: 'Premium-день с тостом, боулом и креветками.', isPremium: true, tags: ['premium', 'боул'], meals: { breakfast: mealById('breakfast-4'), lunch: mealById('lunch-2'), dinner: mealById('dinner-1'), snack: mealById('snack-3') }, publishedAt: '2026-07-01', sortOrder: 3 },
  { id: 'ration-4', rationNumber: 4, title: 'Рацион №4', description: 'Сытный день с гречкой, пастой и лососем без привязки к целевой калорийности.', isPremium: true, tags: ['premium', 'сытно'], meals: { breakfast: mealById('breakfast-5'), lunch: mealById('lunch-4'), dinner: mealById('dinner-3'), snack: mealById('snack-5') }, publishedAt: '2026-07-01', sortOrder: 4 },
  { id: 'ration-5', rationNumber: 5, title: 'Рацион №5', description: 'Лёгкий день с омлетом, супом, запеканкой и сладким перекусом.', isPremium: false, tags: ['лёгкий', 'домашний'], meals: { breakfast: mealById('breakfast-2'), lunch: mealById('lunch-5'), dinner: mealById('dinner-5'), snack: mealById('snack-4') }, publishedAt: '2026-07-01', sortOrder: 5 },
];
