import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { legacyImagePath, loadLegacyData, manifestPath, mealTypes, root, sha256 } from './lib.mjs';

const { recipes, rations } = await loadLegacyData();
const assets = [];
const safeObjectPath = /^[A-Za-z0-9._/-]+$/;
const add = (oldPath, objectPath, entity, legacyId) => oldPath && assets.push({ oldPath: legacyImagePath(oldPath), objectPath, entity, legacyId });

recipes.forEach((recipe) => add(recipe.imageUrl, `recipes/${recipe.id}${path.extname(recipe.imageUrl ?? '')}`, 'recipe', recipe.id));
rations.forEach((ration) => {
  add(ration.imageUrl, `rations/${ration.id}/cover${path.extname(ration.imageUrl ?? '')}`, 'ration', ration.id);
  mealTypes.forEach((slot) => add(ration.mealImageUrls?.[slot], `rations/${ration.id}/${slot}${path.extname(ration.mealImageUrls?.[slot] ?? '')}`, 'ration_meal', `${ration.id}:${slot}`));
});

// Preserve every repository image, including currently unreferenced/home assets.
const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [path.relative(root, absolute)];
}))).flat();
const represented = new Set(assets.map((asset) => asset.oldPath));
for (const oldPath of await walk(path.join(root, 'public/images'))) {
  if (path.basename(oldPath) === '.gitkeep' || represented.has(oldPath)) continue;
  const relative = path.relative('public/images', oldPath).split(path.sep).join('/');
  const extension = path.extname(oldPath);
  const objectPath = safeObjectPath.test(relative)
    ? `legacy-assets/${relative}`
    : `legacy-assets/${sha256(oldPath)}${extension}`;
  assets.push({ oldPath, objectPath, entity: 'asset', legacyId: oldPath });
}

const invalidObjectPaths = assets.filter(({ objectPath }) =>
  !safeObjectPath.test(objectPath) || objectPath.includes('%') || objectPath.includes(' ') || /[\u0400-\u04ff]/u.test(objectPath));
if (invalidObjectPaths.length) {
  throw new Error(`Unsafe objectPath(s): ${invalidObjectPaths.map(({ objectPath }) => objectPath).join(', ')}`);
}
const seenObjectPaths = new Set();
const duplicateObjectPaths = [...new Set(assets.map(({ objectPath }) => objectPath)
  .filter((objectPath) => seenObjectPaths.size === seenObjectPaths.add(objectPath).size))];
if (duplicateObjectPaths.length) throw new Error(`Duplicate objectPath(s): ${duplicateObjectPaths.join(', ')}`);

const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const entries = await Promise.all(assets.map(async (asset) => {
  const buffer = await readFile(path.join(root, asset.oldPath));
  return { ...asset, mime: mime[path.extname(asset.oldPath).toLowerCase()] ?? 'application/octet-stream', sha256: sha256(buffer) };
}));
entries.sort((a, b) => a.objectPath.localeCompare(b.objectPath));
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify({ version: 1, bucket: 'content-images', entries }, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, manifestPath)}`);
