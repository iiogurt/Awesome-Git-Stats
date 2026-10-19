#!/usr/bin/env node
// Minimal local server: serves the landing page and the /api/stars endpoint.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import handler from '../src/handler.js';

const port = Number(process.env.PORT) || 3000;
const indexHtml = new URL('../public/index.html', import.meta.url);

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/stars') return handler(req, res);
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(await readFile(indexHtml));
  }
  res.statusCode = 404;
  res.end('Not found');
}).listen(port, () => {
  const auth = process.env.GITHUB_TOKEN ? 'GraphQL (token)' : 'REST (no token, 60 req/h)';
  console.log(`Awesome Git Stats running at http://localhost:${port} using ${auth}`);
  console.log(`Try http://localhost:${port}/api/stars?username=octocat&theme=tokyonight`);
});
