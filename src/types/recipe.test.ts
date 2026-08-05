import assert from 'node:assert/strict';
import test from 'node:test';
import { recipeWithSelectedServings, recipeWithSelectedWeight, type Recipe } from './recipe.ts';

const recipe = (entrySource: 'recipe' | 'ai', totalWeightGrams?: number): Recipe => ({
  id: entrySource, title: 'Сырники', description: '', mealType: 'breakfast',
  calories: 800, protein: 80, fat: 40, carbs: 120,
  ingredients: [
    { name: 'мука', amount: 120, unit: 'г', category: 'бакалея' },
    { name: 'творог', amount: 300, unit: 'г', category: 'молочные' },
  ],
  planProducts: [
    { id: 'flour', name: 'мука', amount: 120, unit: 'г', calories: 400, protein: 10, fat: 2, carbs: 90 },
  ],
  steps: [], tags: [], allergens: [], isPremium: false, source: entrySource === 'ai' ? 'manual' : 'recipe_book',
  entrySource, cookingTime: 10, servings: 4, totalWeightGrams,
});

test('a 600 g recipe is added whole, then scales to 150 g', () => {
  const whole = recipeWithSelectedWeight(recipe('recipe', 600));
  assert.equal(whole.selectedWeightGrams, 600);
  assert.equal(whole.calories, 800);
  const selected = recipeWithSelectedWeight(whole, 150);
  assert.deepEqual([selected.calories, selected.protein, selected.fat, selected.carbs], [200, 20, 10, 30]);
  assert.deepEqual(selected.ingredients.map(({ amount }) => amount), [30, 75]);
  assert.deepEqual(selected.planProducts?.map(({ amount, calories }) => [amount, calories]), [[30, 100]]);
  assert.equal(selected.fullRecipeIngredients?.[0].amount, 120);
  assert.equal(selected.portionLabel, '150 г из 600 г');
  const afterRestart = JSON.parse(JSON.stringify(selected)) as Recipe;
  assert.equal(afterRestart.selectedWeightGrams, 150);
  assert.deepEqual(afterRestart.ingredients.map(({ amount }) => amount), [30, 75]);
});

test('a 4-serving recipe without totalWeightGrams scales to 1 serving', () => {
  const whole = recipeWithSelectedWeight(recipe('recipe'));
  assert.equal(whole.selectedServings, 4);
  const selected = recipeWithSelectedServings(whole, 1);
  assert.deepEqual([selected.calories, selected.protein, selected.fat, selected.carbs], [200, 20, 10, 30]);
  assert.deepEqual(selected.ingredients.map(({ amount }) => amount), [30, 75]);
  assert.deepEqual(selected.planProducts?.map(({ amount, calories }) => [amount, calories]), [[30, 100]]);
  assert.equal(selected.portionLabel, '1 из 4 порций');
  const afterRestart = JSON.parse(JSON.stringify(selected)) as Recipe;
  assert.equal(afterRestart.selectedServings, 1);
  assert.equal(afterRestart.plannedServings, 1);
});

test('AI and catalog recipes use selected / total weight', () => {
  const catalog = recipeWithSelectedWeight(recipe('recipe', 800), 200);
  const ai = recipeWithSelectedWeight(recipe('ai', 800), 200);
  assert.deepEqual(ai.ingredients, catalog.ingredients);
  assert.equal(ai.calories, catalog.calories);
});

test('missing finished weight is never treated as 100 g', () => {
  const scaled = recipeWithSelectedServings(recipe('ai'), 1);
  assert.equal(scaled.selectedServings, 1);
  assert.equal(scaled.calories, 200);
});

test('only positive quantities are accepted', () => {
  assert.throws(() => recipeWithSelectedWeight(recipe('recipe', 600), 0), /положительным числом/);
  assert.throws(() => recipeWithSelectedServings(recipe('recipe'), -1), /положительным числом/);
});
