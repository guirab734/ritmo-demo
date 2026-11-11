import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, resolve, sep } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const target = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!target.startsWith(root + sep) || url.pathname.split('/').some(part => part.startsWith('.'))) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' }).end(data);
  } catch {
    response.writeHead(404).end('Arquivo não encontrado.');
  }
}).listen(4173, '127.0.0.1', () => console.log('Ritmo em http://127.0.0.1:4173'));
