import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node apply-affiliate-compliance.mjs <site-root>');

const commercialDomains = [
  'booking.com', 'amazon.com', 'viator.com', 'expedia.com', 'vegas.com',
  'groupon.com', 'getyourguide.com', 'klook.com', 'ticketmaster.com',
  'vividseats.com', 'ticketnetwork.com', 'undercovertourist.com',
  'discovercars.com', 'worldnomads.com'
];

const disclosure = '<div class="affiliate-notice" role="note"><strong>Affiliate disclosure:</strong> Countryman Travels may earn a commission if you book or purchase through commercial links on this page, at no additional cost to you. Recommendations are independently selected. <a href="/affiliate-disclosure.html">How our links work</a>.</div>';
const darkDisclosure = '<div class="affiliate-notice on-dark" role="note"><strong>Affiliate disclosure:</strong> Countryman Travels may earn a commission if you book through this link, at no additional cost to you. <a href="/affiliate-disclosure.html">Details</a>.</div>';

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['.wrangler', 'node_modules'].includes(entry.name)) return filesIn(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

let changed = 0;
for (const file of filesIn(root)) {
  let html = fs.readFileSync(file, 'utf8');
  const original = html;

  html = html.replace(
    '<li><a href="/privacy.html">Privacy & Affiliate Disclosure</a></li>',
    '<li><a href="/affiliate-disclosure.html">Affiliate Disclosure</a></li>\n        <li><a href="/privacy.html">Privacy Policy</a></li>\n        <li><a href="/terms.html">Terms of Use</a></li>'
  );
  html = html.replace(
    '<li><a href="/about.html">Editorial approach</a></li>',
    '<li><a href="/about.html">Editorial approach</a></li>\n          <li><a href="/affiliate-disclosure.html">Affiliate Disclosure</a></li>\n          <li><a href="/privacy.html">Privacy Policy</a></li>\n          <li><a href="/terms.html">Terms of Use</a></li>'
  );
  html = html.replace(
    '<span>Some ticket links may be affiliate links; this does not change your price.</span>',
    '<span><a href="/affiliate-disclosure.html">Affiliate disclosure</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></span>'
  );

  if (html.includes('https://www.booking.com') && html.includes('data-affiliate-slot=') && !html.includes('affiliate-notice')) {
    html = html.replace(/(<a href="https:\/\/www\.booking\.com"[^>]*data-affiliate-slot[^>]*>)/, `${darkDisclosure}\n    $1`);
  }

  if (html.includes('data-affiliate-slot=') && !html.includes('affiliate-notice')) {
    html = html.replace(/(<main\b[^>]*>|<div class="content-wrap"[^>]*>)/, `$1\n${disclosure}`);
  }

  html = html.replace(/<a\b[^>]*href="https?:\/\/[^">]+"[^>]*>/g, (tag) => {
    if (!commercialDomains.some((domain) => tag.includes(domain))) return tag;
    if (/\brel="[^"]*sponsored/.test(tag)) return tag;
    if (/\brel="([^"]*)"/.test(tag)) return tag.replace(/\brel="([^"]*)"/, (_, value) => `rel="${value} sponsored"`);
    if (/\btarget="_blank"/.test(tag)) return tag.replace(/\btarget="_blank"/, 'target="_blank" rel="sponsored noopener"');
    return tag.replace(/>$/, ' rel="sponsored">');
  });

  if (html !== original) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(JSON.stringify({ root, changed, htmlFiles: filesIn(root).length }, null, 2));
