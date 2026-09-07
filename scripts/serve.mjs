import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('out');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.rsc': 'text/x-component',
  '.woff2': 'font/woff2',
};
await stat(resolve(root, 'index.html')).catch(() => {
  throw new Error('Run npm run build before npm start.');
});
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    if (base && pathname !== base && !pathname.startsWith(base + '/')) {
      response.writeHead(404);
      response.end();
      return;
    }
    let target = resolve(root, '.' + (pathname.slice(base.length) || '/'));
    if (target !== root && !target.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if ((await stat(target)).isDirectory())
      target = resolve(target, 'index.html');
    const body = await readFile(target);
    response.writeHead(200, {
      'Content-Type': types[extname(target)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`AI Summits: http://127.0.0.1:${port}${base}/`);
});
