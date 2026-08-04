import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  }));
  return nested.flat();
};
const pages = await walk(root);
let changed = 0;
for (const page of pages) {
  let html = await readFile(page, 'utf8');
  if (html.includes('/js/site-shell.js')) continue;
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error(`Missing document boundary: ${page}`);
  html = html.replace('</head>', '  <link rel="stylesheet" href="/css/site-shell.css?v=20260802a">\n</head>');
  html = html.replace('</body>', '  <script src="/js/site-shell.js?v=20260802a" defer></script>\n</body>');
  await writeFile(page, html);
  changed++;
}
console.log(JSON.stringify({ pages: pages.length, changed }));
