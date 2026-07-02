import type { Recipe } from '../types/recipe';

const defaultAppUrl = 'https://kngkczph94-sketch.github.io/ty-poela-miniapp/';

export const recipeCopiedMessage = 'Рецепт скопирован. Можно отправить его в чат.';

export const createRecipeLink = (recipeId: string) => {
  const recipeUrl = new URL(defaultAppUrl);
  recipeUrl.searchParams.set('recipe', recipeId);

  return recipeUrl.toString();
};

const formatIngredient = (ingredient: Recipe['ingredients'][number]) => {
  if (typeof ingredient === 'string') {
    return `- ${ingredient}`;
  }

  return `- ${[ingredient.name, ingredient.amount, ingredient.unit].filter(Boolean).join(' ')}`;
};

const formatRecipeSteps = (steps: Recipe['steps']) => {
  if (Array.isArray(steps)) {
    return steps.map((step, index) => `${index + 1}. ${step}`);
  }

  return [steps];
};

export const createRecipeShareText = (recipe: Recipe, recipeLink = createRecipeLink(recipe.id)) => {
  const lines = [
    `Рецепт из «Ты поела»: ${recipe.title}`,
  ];

  if (recipe.description.trim()) {
    lines.push('', recipe.description.trim());
  }

  lines.push(
    '',
    'КБЖУ:',
    `${recipe.calories} ккал`,
    `Б ${recipe.protein} / Ж ${recipe.fat} / У ${recipe.carbs}`,
    '',
    'Ингредиенты:',
    ...recipe.ingredients.map(formatIngredient),
    '',
    'Приготовление:',
    ...formatRecipeSteps(recipe.steps),
    '',
    'Открыть рецепт полностью:',
    recipeLink,
  );

  return lines.join('\n');
};

export const shareRecipe = async (recipe: Recipe) => {
  const recipeLink = createRecipeLink(recipe.id);
  const shareText = createRecipeShareText(recipe, recipeLink);

  if (navigator.share) {
    await navigator.share({
      title: recipe.title,
      text: shareText,
      url: recipeLink,
    });
    return { status: 'shared' as const, shareText };
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    return { status: 'copied' as const, shareText };
  }

  return { status: 'manual' as const, shareText };
};
