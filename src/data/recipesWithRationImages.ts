import { recipes } from './recipes';
import { dailyRations } from './rations';
import type { Recipe } from '../types/recipe';

const rationMealImageUrlByRecipeId = new Map(
  dailyRations.flatMap((ration) =>
    Object.values(ration.meals)
      .filter((meal) => meal.imageUrl)
      .map((meal) => [meal.id, meal.imageUrl] as const),
  ),
);

export const recipesWithRationImages: Recipe[] = recipes.map((recipe) => ({
  ...recipe,
  imageUrl: recipe.imageUrl || rationMealImageUrlByRecipeId.get(recipe.id),
}));

export const findRecipeWithRationImage = (recipeId: string) =>
  recipesWithRationImages.find((recipe) => recipe.id === recipeId);
