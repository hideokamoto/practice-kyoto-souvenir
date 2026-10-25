// E2E 用の静的サーバ。ビルド成果物を /kyoto-ikezu-quiz/ のサブパスで配信し、
// games.hidetaka.dev が CloudFront で付けるのと同じ CSP を付ける（cdk/src/security.ts のベースライン
// ＋ このアプリ用に緩める style-src 'unsafe-inline' と img-src の 2 ホスト）。
// upgrade-insecure-requests だけは http の localhost で同一オリジンの読み込みが壊れるので付けない。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../dist/kyoto-ikezu-quiz/browser/', import.meta.url).pathname;
const BASE = '/kyoto-ikezu-quiz/';
const PORT = Number(process.env.PORT ?? 4310);

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://upload.wikimedia.org https://cyberjapandata.gsi.go.jp",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(302, { location: BASE }).end();
    return;
  }
  const rel = normalize(url.pathname.slice(BASE.length) || 'index.html');
  if (rel.startsWith('..')) {
    res.writeHead(400).end();
    return;
  }
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, {
      'content-type': TYPES[extname(rel)] ?? 'application/octet-stream',
      'content-security-policy': CSP,
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`e2e server: http://localhost:${PORT}${BASE}`));
