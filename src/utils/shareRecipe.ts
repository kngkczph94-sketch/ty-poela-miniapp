import type { Ingredient, Recipe } from '../types/recipe';

const defaultAppUrl = 'https://kngkczph94-sketch.github.io/ty-poela-miniapp/';

export const recipeCopiedMessage = 'Рецепт скопирован. Можно отправить его в чат.';

export const createRecipeLink = (recipeId: string) => {
  const recipeUrl = new URL(defaultAppUrl);
  recipeUrl.searchParams.set('recipe', recipeId);

  return recipeUrl.toString();
};

type ShareableRecipe = Recipe & Partial<Record<'ingredientList' | 'products' | 'items' | 'instructions' | 'method' | 'cookingSteps' | 'preparation', unknown>>;

type IngredientLike = Ingredient | string | Record<string, unknown>;

const ingredientFieldNames = ['ingredients', 'ingredientList', 'products', 'items'] as const;
const stepFieldNames = ['steps', 'instructions', 'method', 'cookingSteps', 'preparation'] as const;

const stringifyAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  return String(value);
};

const getFirstFilledField = (recipe: ShareableRecipe, fieldNames: readonly string[]) => {
  for (const fieldName of fieldNames) {
    const value = recipe[fieldName as keyof ShareableRecipe];

    if (Array.isArray(value) && value.length > 0) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return [];
};

const formatIngredient = (ingredient: IngredientLike) => {
  if (typeof ingredient === 'string') {
    return `- ${ingredient}`;
  }

  const ingredientData = ingredient as Record<string, unknown>;
  const name = stringifyAmount(ingredientData.name ?? ingredientData.title ?? ingredientData.product ?? ingredientData.label);
  const amount = stringifyAmount(ingredientData.amount ?? ingredientData.quantity ?? ingredientData.count);
  const unit = stringifyAmount(ingredientData.unit ?? ingredientData.measure ?? ingredientData.units);
  const ingredientText = [name, amount, unit].filter(Boolean).join(' ').trim();

  return `- ${ingredientText || 'ингредиент не указан'}`;
};

const formatRecipeSteps = (steps: unknown) => {
  if (Array.isArray(steps)) {
    return steps.map((step, index) => `${index + 1}. ${String(step)}`);
  }

  if (typeof steps === 'string' && steps.trim()) {
    return steps
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step, index) => `${index + 1}. ${step.replace(/^\d+[.)]\s*/, '')}`);
  }

  return [];
};

export const createRecipeShareText = (recipe: Recipe, recipeLink = createRecipeLink(recipe.id)) => {
  const shareableRecipe = recipe as ShareableRecipe;
  const ingredients = getFirstFilledField(shareableRecipe, ingredientFieldNames);
  const steps = getFirstFilledField(shareableRecipe, stepFieldNames);
  const ingredientLines = Array.isArray(ingredients) ? ingredients.map((ingredient) => formatIngredient(ingredient as IngredientLike)) : [formatIngredient(ingredients)];
  const stepLines = formatRecipeSteps(steps);

  const lines = [
    `Рецепт из «Ты поела»: ${recipe.title}`,
    '',
    'КБЖУ:',
    `${recipe.calories} ккал`,
    `Б ${recipe.protein} / Ж ${recipe.fat} / У ${recipe.carbs}`,
    '',
    'Ингредиенты:',
    ...(ingredientLines.length > 0 ? ingredientLines : ['- ингредиенты не указаны']),
    '',
    'Приготовление:',
    ...(stepLines.length > 0 ? stepLines : ['1. шаги приготовления не указаны']),
    '',
    'Открыть рецепт полностью:',
    recipeLink,
  ];

  return lines.join('\n');
};

export const shareRecipe = async (recipe: Recipe) => {
  const recipeLink = createRecipeLink(recipe.id);
  const shareText = createRecipeShareText(recipe, recipeLink);

  console.log("shareText", shareText);

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
