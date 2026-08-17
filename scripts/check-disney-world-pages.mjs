import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
  }
}

walk(path.join(root, 'orlando'));

const errors = [];
const warnings = [];
const commercial = ['prf.hn', 'expedia.com', 'viator.com', 'groupon.com', 'amazon.com'];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${relative}: missing title`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) errors.push(`${relative}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/countrymantravels\.com\/[^"]+">/.test(html)) errors.push(`${relative}: missing canonical`);
  if (!/<main\b[^>]*id="main"/.test(html) && relative.includes('disney-world')) errors.push(`${relative}: missing main landmark`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter(value => value === id).length > 1) errors.push(`${relative}: duplicate id ${id}`);
  }

  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)];
  for (const match of links) {
    const tag = match[0];
    const href = match[1];
    if (commercial.some(domain => href.includes(domain)) && !/rel="[^"]*sponsored/.test(tag)) {
      errors.push(`${relative}: commercial link missing sponsored rel: ${href}`);
    }
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = clean.endsWith('/') ? path.join(root, clean, 'index.html') : path.join(root, clean);
    if (!fs.existsSync(target)) errors.push(`${relative}: missing internal target ${clean}`);
  }

  const images = [...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)];
  for (const match of images) {
    const tag = match[0];
    const src = match[1];
    if (!/\balt="[^"]*"/.test(tag)) errors.push(`${relative}: image missing alt attribute: ${src}`);
    if (!src.startsWith('/') || src.startsWith('//')) continue;
    const clean = src.split('?')[0];
    if (!fs.existsSync(path.join(root, clean))) errors.push(`${relative}: missing image asset ${clean}`);
  }

  const hasCommercial = commercial.some(domain => html.includes(domain));
  if (hasCommercial && !html.includes('Affiliate disclosure:')) errors.push(`${relative}: commercial page missing nearby disclosure`);
  if (relative.includes('disney-world') && !html.includes('Not affiliated with or endorsed by The Walt Disney Company')) {
    warnings.push(`${relative}: independence footer text missing`);
  }
}

const expected = [
  'orlando/disney-world/index.html',
  'orlando/disney-world/hotels/index.html',
  'orlando/disney-world/tools.html',
  'orlando/day-trips/index.html',
  'orlando/universal/index.html'
];
for (const relative of expected) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required route ${relative}`);
}

console.log(JSON.stringify({ checked: htmlFiles.length, errors, warnings }, null, 2));
if (errors.length) process.exitCode = 1;
