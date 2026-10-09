import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.flac': 'audio/flac' };
createServer(async (req, res) => {
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    const relative = path.slice(root.length).split(sep).filter(Boolean);
    if (!path.startsWith(root + sep) || relative.some(x => x.startsWith('.') && x !== '.preview') || relative.includes('node_modules') || relative.includes('worker')) throw new Error('Forbidden');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8765, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:8765/tajweed-measure/?preview=1'));
