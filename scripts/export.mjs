import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Vinext exports into dist/client/<basePath>. Pages mounts the artifact at
// <basePath> itself, so publish that subtree rather than duplicating the prefix.
const base = (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '');
if (
  base &&
  !base.split('/').every((segment) => /^[a-zA-Z0-9_-]+$/.test(segment))
) {
  throw new Error('BASE_PATH must contain only safe URL path segments.');
}
const source = resolve('dist/client', base);
await stat(resolve(source, 'index.html'));
await rm('out', { recursive: true, force: true });
await mkdir('out', { recursive: true });
await cp(source, 'out', { recursive: true });
if (base) await cp('dist/client/404.html', 'out/404.html');
await writeFile('out/.nojekyll', '');
console.log('Static artifact ready in out/');
