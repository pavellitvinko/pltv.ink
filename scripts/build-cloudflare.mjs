import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'build/cloudflare');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const entry of await readdir(path.join(root, 'dist'))) {
  if (entry === 'server' || entry === '.openai') continue;
  await cp(path.join(root, 'dist', entry), path.join(destination, entry), { recursive: true });
}
console.log('Prepared journal assets for Wrangler.');
