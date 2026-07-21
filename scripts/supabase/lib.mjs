import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';

export const root = path.resolve(import.meta.dirname, '../..');
export const manifestPath = path.join(root, 'supabase/import/image-manifest.json');
export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

export async function loadLegacyData() {
  const dir = await mkdtemp(path.join(tmpdir(), 'ty-poela-import-'));
  const compile = async (name) => {
    const source = await readFile(path.join(root, `src/data/${name}.ts`), 'utf8');
    let output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    output = output.replace("from './recipes'", "from './recipes.mjs'");
    await writeFile(path.join(dir, `${name}.mjs`), output);
  };
  try {
    await compile('recipes');
    await compile('rations');
    const [{ recipes }, { dailyRations }] = await Promise.all([
      import(`${path.join(dir, 'recipes.mjs')}?v=${Date.now()}`),
      import(`${path.join(dir, 'rations.mjs')}?v=${Date.now()}`),
    ]);
    return { recipes, rations: dailyRations };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export const normalizeIngredient = (value) => value.normalize('NFKC').trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');
export const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
export const legacyImagePath = (url) => path.join('public', url.replace(/^\/ty-poela-miniapp\//, '').replace(/^\//, ''));

export function failOnProblems(problems) {
  if (!problems.length) return;
  console.error('\nSource data problems:');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
}

export function duplicates(values) {
  const seen = new Set();
  return [...new Set(values.filter((value) => seen.size === seen.add(value).size))];
}

export async function readManifest() {
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

export function configForApply(apply) {
  if (!apply) return null;
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = secretKey || legacyServiceRoleKey;
  if (!url || !key) {
    throw new Error('--apply requires SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)');
  }
  return { url, key, useBearerAuthorization: !secretKey && Boolean(legacyServiceRoleKey) };
}

export async function request(config, endpoint, options = {}) {
  const authorizationHeaders = config.useBearerAuthorization
    ? { Authorization: `Bearer ${config.key}` }
    : {};
  const response = await fetch(`${config.url}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      apikey: config.key,
      ...authorizationHeaders,
    },
  });
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${endpoint}: ${response.status} ${await response.text()}`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function upsert(config, table, rows, conflict) {
  return request(config, `/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
}
