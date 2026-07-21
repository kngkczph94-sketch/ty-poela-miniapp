import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { configForApply, duplicates, failOnProblems, loadLegacyData, mealTypes, normalizeIngredient, readManifest, root, sha256, upsert } from './lib.mjs';

const apply = process.argv.includes('--apply');
const unknown = process.argv.slice(2).filter((arg) => arg !== '--apply');
if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(', ')}`);
const config = configForApply(apply);
const { recipes, rations } = await loadLegacyData();
const manifest = await readManifest();
const problems = [];

duplicates(recipes.map((r) => r.id)).forEach((id) => problems.push(`duplicate recipe legacy_id: ${id}`));
duplicates(rations.map((r) => r.id)).forEach((id) => problems.push(`duplicate ration legacy_id: ${id}`));
const recipeIds = new Set(recipes.map((r) => r.id));
recipes.forEach((recipe) => {
  for (const [label, value] of Object.entries({ calories: recipe.calories, protein: recipe.protein, fat: recipe.fat, carbs: recipe.carbs }))
    if (!Number.isFinite(value) || value < 0) problems.push(`${recipe.id}: invalid ${label}=${value}`);
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) problems.push(`${recipe.id}: invalid servings=${recipe.servings}`);
  recipe.ingredients.forEach((ingredient, index) => {
    if (!Number.isFinite(ingredient.amount) || ingredient.amount < 0) problems.push(`${recipe.id} ingredient ${index}: invalid amount`);
    if (!ingredient.unit.trim()) problems.push(`${recipe.id} ingredient ${index}: empty unit`);
  });
});
rations.forEach((ration) => {
  const slots = Object.keys(ration.meals);
  if (slots.length !== 4 || mealTypes.some((slot) => !ration.meals[slot])) problems.push(`${ration.id}: must contain exactly four meal slots`);
  mealTypes.forEach((slot) => {
    const recipe = ration.meals[slot];
    if (recipe && !recipeIds.has(recipe.id)) problems.push(`${ration.id}:${slot}: missing recipe ${recipe.id}`);
    if (recipe && recipe.mealType !== slot) problems.push(`${ration.id}:${slot}: recipe ${recipe.id} has mealType=${recipe.mealType}`);
  });
});
for (const entry of manifest.entries) {
  try {
    const contents = await readFile(path.join(root, entry.oldPath));
    if (sha256(contents) !== entry.sha256) problems.push(`${entry.oldPath}: SHA-256 differs from manifest`);
  } catch { problems.push(`${entry.oldPath}: referenced image is missing`); }
}
const expectedImages = new Set([
  ...recipes.flatMap((r) => r.imageUrl ? [r.imageUrl] : []),
  ...rations.flatMap((r) => [r.imageUrl, ...mealTypes.map((slot) => r.mealImageUrls?.[slot])].filter(Boolean)),
].map((url) => `public/${url.replace(/^\/ty-poela-miniapp\//, '')}`));
expectedImages.forEach((oldPath) => { if (!manifest.entries.some((e) => e.oldPath === oldPath)) problems.push(`${oldPath}: referenced image absent from manifest`); });
const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [path.relative(root, absolute)];
}))).flat();
for (const oldPath of await walk(path.join(root, 'public/images'))) {
  if (path.basename(oldPath) !== '.gitkeep' && !manifest.entries.some((entry) => entry.oldPath === oldPath)) problems.push(`${oldPath}: repository image would be lost`);
}

const ingredientMap = new Map();
recipes.forEach((recipe) => recipe.ingredients.forEach((item) => {
  const normalized = normalizeIngredient(item.name);
  const key = `${normalized}\0${item.category}`;
  if (!ingredientMap.has(key)) ingredientMap.set(key, { legacy_id: `ingredient:${sha256(Buffer.from(key)).slice(0, 24)}`, name: item.name.trim(), normalized_name: normalized, category: item.category });
}));
console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: ${recipes.length} recipes, ${rations.length} rations, ${ingredientMap.size} ingredients, ${manifest.entries.length} images`);
failOnProblems(problems);
if (problems.length || !apply) process.exit();

const recipeRows = await upsert(config, 'recipes', recipes.map((r) => ({ legacy_id:r.id,title:r.title,description:r.description,meal_type:r.mealType,source:r.source,calories_per_serving:r.calories,protein_g_per_serving:r.protein,fat_g_per_serving:r.fat,carbs_g_per_serving:r.carbs,base_servings:r.servings,cooking_time_minutes:r.cookingTime,steps:r.steps,tags:r.tags,allergens:r.allergens,image_path:manifest.entries.find((e)=>e.entity==='recipe'&&e.legacyId===r.id)?.objectPath??null,video_url:r.videoUrl??null,is_premium:r.isPremium })), 'legacy_id');
const ingredientRows = await upsert(config, 'ingredients', [...ingredientMap.values()], 'normalized_name,category');
const recipeDb = new Map(recipeRows.map((r) => [r.legacy_id, r.id]));
const ingredientDb = new Map(ingredientRows.map((i) => [`${i.normalized_name}\0${i.category}`, i.id]));
await upsert(config, 'recipe_ingredients', recipes.flatMap((r) => r.ingredients.map((i,index) => ({ legacy_id:`${r.id}:ingredient:${index}`,recipe_id:recipeDb.get(r.id),ingredient_id:ingredientDb.get(`${normalizeIngredient(i.name)}\0${i.category}`),amount:i.amount,unit:i.unit,sort_order:index }))), 'legacy_id');
const rationRows = await upsert(config, 'rations', rations.map((r) => ({ legacy_id:r.id,ration_number:r.rationNumber,title:r.title,description:r.description,tags:r.tags,image_path:manifest.entries.find((e)=>e.entity==='ration'&&e.legacyId===r.id)?.objectPath??null,is_premium:r.isPremium,published_on:r.publishedAt,sort_order:r.sortOrder })), 'legacy_id');
const rationDb = new Map(rationRows.map((r) => [r.legacy_id, r.id]));
await upsert(config, 'ration_meals', rations.flatMap((r) => mealTypes.map((slot) => ({ legacy_id:`${r.id}:${slot}`,ration_id:rationDb.get(r.id),meal_type:slot,recipe_id:recipeDb.get(r.meals[slot].id),servings:r.meals[slot].servings,image_path:manifest.entries.find((e)=>e.entity==='ration_meal'&&e.legacyId===`${r.id}:${slot}`)?.objectPath??null }))), 'legacy_id');
console.log('Content import completed. Upserts make reruns idempotent.');
