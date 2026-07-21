import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { configForApply, failOnProblems, readManifest, request, root, sha256 } from './lib.mjs';

const apply = process.argv.includes('--apply');
const unknown = process.argv.slice(2).filter((arg) => arg !== '--apply');
if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(', ')}`);
const config = configForApply(apply);
const manifest = await readManifest();
const bucket = process.env.SUPABASE_STORAGE_BUCKET || manifest.bucket;
const files = [];
const problems = [];
for (const entry of manifest.entries) {
  try {
    const body = await readFile(path.join(root, entry.oldPath));
    if (sha256(body) !== entry.sha256) problems.push(`${entry.oldPath}: SHA-256 differs from manifest`);
    files.push({ entry, body });
  } catch { problems.push(`${entry.oldPath}: file is missing`); }
}
console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: ${files.length} images -> bucket ${bucket}`);
failOnProblems(problems);
if (problems.length || !apply) process.exit();
for (const { entry, body } of files) {
  await request(config, `/storage/v1/object/${encodeURIComponent(bucket)}/${entry.objectPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', headers: { 'Content-Type': entry.mime, 'x-upsert': 'true' }, body,
  });
}
console.log('Image upload completed. x-upsert makes reruns idempotent.');
