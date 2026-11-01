import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const redesign = fileURLToPath(new URL('../', import.meta.url));
const parent = path.resolve(redesign, '..');
const baseline = JSON.parse(await readFile(path.join(redesign, 'original-files.sha256.json'), 'utf8'));
const changed = [];
for (const file of baseline) {
  const target = path.resolve(parent, file.path);
  if (!target.startsWith(parent + path.sep)) throw new Error('Invalid baseline path');
  try {
    const hash = createHash('sha256').update(await readFile(target)).digest('hex');
    if (hash !== file.hash.toLowerCase()) changed.push(file.path);
  } catch { changed.push(file.path); }
}
if (changed.length) throw new Error(`Original file hash mismatch: ${changed.join(', ')}`);
async function walk(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...await walk(full));
    else if (/\.(tsx?|css)$/.test(item.name)) result.push(full);
  }
  return result;
}
const sourceFiles = (await walk(path.join(redesign, 'src'))).filter(file => !file.includes(`${path.sep}ui${path.sep}`));
for (const file of sourceFiles) {
  const content = await readFile(file, 'utf8');
  if (/firebasejs|firebaseapp\.com|textorasms\.com|supabase\.co|TEXTORA_AUTH|apiKey\s*:/.test(content)) throw new Error(`Unexpected production connection: ${file}`);
}
const html = await readFile(path.join(redesign, 'index.html'), 'utf8');
if (!html.includes("connect-src 'self'")) throw new Error('Missing preview connection restriction');
console.log(`PASS: ${baseline.length} original files unchanged; preview application has no production SDK/provider endpoints; origin-only connection policy present.`);
