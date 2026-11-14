// Dependency-free development server. Only dist/ is exposed to the browser.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const portArg = process.argv.indexOf('--port');
const port = Number(process.env.PORT || (portArg >= 0 ? process.argv[portArg + 1] : 3000));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(resolve(root) + sep)) {
      res.writeHead(403); return res.end('Forbidden');
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`SpeakCare is running at http://localhost:${port}`));
