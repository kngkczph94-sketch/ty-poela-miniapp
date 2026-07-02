import type { Recipe } from '../types/recipe';

export const recipeCopiedMessage = 'Рецепт скопирован. Можно отправить его в чат.';

export const createRecipeShareText = (recipe: Recipe) =>
  [
    `Нашла рецепт в «Ты поела»: ${recipe.title}`,
    '',
    'КБЖУ:',
    `${recipe.calories} ккал`,
    `Б ${recipe.protein} / Ж ${recipe.fat} / У ${recipe.carbs}`,
  ].join('\n');

export const shareRecipe = async (recipe: Recipe) => {
  const shareText = createRecipeShareText(recipe);

  if (navigator.share) {
    await navigator.share({
      title: recipe.title,
      text: shareText,
    });
    return { status: 'shared' as const, shareText };
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    return { status: 'copied' as const, shareText };
  }

  return { status: 'manual' as const, shareText };
};
