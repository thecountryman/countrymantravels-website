import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getFallback } from './lib/affiliate-links.mjs';

const root = new URL('..', import.meta.url).pathname;
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const dataDir = join(root, 'data', 'destinations-lite');
const photosDir = join(root, 'data', 'destination-photos');
const outDir = join(root, 'guides');
mkdirSync(outDir, { recursive: true });

const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));

const credit = (photo) => photo ? `<p style="font-size:11px;color:var(--text-muted);margin:6px 0 0">Photo: <a href="${esc(photo.sourcePage)}" target="_blank" rel="noopener" style="color:var(--text-muted)">${esc(photo.author)}</a> via Wikimedia Commons (${esc(photo.license)})</p>` : '';
const cardImg = (photo, alt) => photo ? `<img src="${esc(photo.url)}" alt="${esc(alt)}" loading="lazy" style="width:calc(100% + 2.5rem);height:150px;object-fit:cover;margin:-1.25rem -1.25rem 16px">` : '';

for (const file of files) {
  const d = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  const canonicalPath = `/guides/${d.slug}.html`;
  const hotelsFallback = getFallback(d.slug, 'hotels');
  const thingsFallback = getFallback(d.slug, 'things-to-do');
  const photosPath = join(photosDir, `${d.slug}.json`);
  const photos = existsSync(photosPath) ? JSON.parse(readFileSync(photosPath, 'utf8')) : { hero: null, areas: {}, things: {} };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: d.quickAnswers.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a }
    }))
  };

  const areaCards = d.topAreas.map((a) => { const photo = photos.areas?.[a.name]; return `<div class="card" style="overflow:hidden">${cardImg(photo, `${a.name}, ${d.name}`)}<h3 style="margin:0 0 8px;color:var(--navy);font-size:18px">${esc(a.name)}</h3><p style="font-size:14px;color:var(--text-dim);margin:0">${esc(a.why)}</p>${credit(photo)}</div>`; }).join('');
  const thingCards = d.topThings.map((t) => { const photo = photos.things?.[t.name]; return `<div class="card" style="overflow:hidden">${cardImg(photo, `${t.name}, ${d.name}`)}<h3 style="margin:0 0 8px;color:var(--navy);font-size:18px">${esc(t.name)}</h3><p style="font-size:14px;color:var(--text-dim);margin:0">${esc(t.note)}</p>${credit(photo)}</div>`; }).join('');
  const qaBlocks = d.quickAnswers.map((qa) => `<div class="card"><h3 style="margin:0 0 8px;color:var(--navy);font-size:17px">${esc(qa.q)}</h3><p style="font-size:14px;color:var(--text-dim);margin:0">${esc(qa.a)}</p></div>`).join('');
  const heroImg = photos.hero ? `<div style="border-radius:16px;overflow:hidden;margin:1.5rem 0 2rem;max-height:380px"><img src="${esc(photos.hero.url)}" alt="${esc(d.name)}" style="width:100%;height:380px;object-fit:cover;display:block">${credit(photos.hero)}</div>` : '';

  const html = `<!doctype html>
<html lang="en"><head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4QMCMJCHPN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-4QMCMJCHPN');
</script>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} Trip Planning Guide | Countryman Travels</title>
<meta name="description" content="${esc(d.intro)}">
<link rel="canonical" href="https://countrymantravels.com${canonicalPath}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v=20260802f"><link rel="stylesheet" href="/css/home.css?v=20260802f"><link rel="stylesheet" href="/css/site-shell.css?v=20260802a">
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://countrymantravels.com/"},{"@type":"ListItem","position":2,"name":"Destinations","item":"https://countrymantravels.com/destinations.html"},{"@type":"ListItem","position":3,"name":${JSON.stringify(d.name + ' Guide')}}]}</script>
</head>
<body>
<div class="global-bar"><a href="/index.html" class="g-brand"><span style="color:var(--gold)">✦</span> Countryman Travels</a><div class="g-links"><a href="/destinations.html">Destinations</a><a href="/affiliate-disclosure.html">Affiliate disclosure</a></div></div>
<nav class="site-nav"><a href="/index.html" class="brand"><span class="dot"></span> Countryman Travels</a><div class="links"><a href="/destinations.html" class="nav-link">Destinations</a><a href="/plan-your-trip.html" class="nav-cta">Start planning</a></div></nav>
<main class="content-wrap" style="padding-top:2rem">
<p style="color:var(--gold-dark);font-weight:800;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;margin:0 0 8px">Quick destination guide</p>
<h1 style="font-size:clamp(2rem,5vw,3rem);margin:0 0 12px;color:var(--navy)">${esc(d.name)} trip planning guide</h1>
<p style="font-size:17px;color:var(--text-dim);max-width:760px">${esc(d.intro)}</p>
<p style="font-size:13px;color:var(--text-muted);max-width:760px;margin-top:10px">This is a fast-build planning guide — the essentials to get moving, not the full depth of our flagship destination hubs. Always confirm current prices, hours, and conditions before booking.</p>

${heroImg}

<section class="hotel-info-grid" style="margin:2rem 0">
  <div class="info-card"><h4>Best time to visit</h4><p>${esc(d.bestTimeToVisit)}</p></div>
  <div class="info-card"><h4>What to budget</h4><p>${esc(d.avgTripCost)}</p></div>
  <div class="info-card"><h4>Getting around</h4><p>${esc(d.gettingAround)}</p></div>
</section>

<h2 style="color:var(--navy);margin-top:2rem">Where to stay</h2>
<div class="card-grid">${areaCards}</div>

<h2 style="color:var(--navy);margin-top:2.5rem">Worth doing</h2>
<div class="card-grid">${thingCards}</div>

<section style="background:#F2F8F7;border:1px solid #CBE7E1;border-radius:14px;padding:2rem 1.5rem;text-align:center;margin:2.5rem 0">
  <h2 style="color:var(--navy)!important;margin:0 0 8px;font-size:22px">Ready to check dates?</h2>
  <p style="color:var(--text-dim);margin:0 0 18px">Countryman Travels may earn a commission if you book through these links, at no additional cost to you.</p>
  <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
    <a href="${esc(hotelsFallback.url)}" target="_blank" rel="sponsored noopener" style="background:var(--gold);color:var(--navy)!important;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:9px">${esc(hotelsFallback.label)} &rarr;</a>
    <a href="${esc(thingsFallback.url)}" target="_blank" rel="sponsored noopener" style="background:#fff;border:2px solid var(--gold);color:var(--navy)!important;font-weight:800;text-decoration:none;padding:12px 20px;border-radius:9px">${esc(thingsFallback.label)} &rarr;</a>
  </div>
  <div class="affiliate-notice" role="note" style="margin-top:16px"><strong>Affiliate disclosure:</strong> We may earn a commission on qualifying bookings. <a href="/affiliate-disclosure.html">Details</a>.</div>
</section>

<h2 style="color:var(--navy);margin-top:2.5rem">Quick answers</h2>
<div class="card-grid">${qaBlocks}</div>

<p style="margin-top:2rem"><a href="/destinations.html" style="font-weight:700;color:var(--navy)">&larr; Back to all destinations</a></p>
</main>
<footer class="site-footer"><div class="footer-bottom"><span>© 2026 Countryman Travels. Independent travel publishing.</span><span><a href="/affiliate-disclosure.html">Affiliate disclosure</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></span></div></footer>
<script src="/js/site-shell.js?v=20260802a" defer></script>
</body></html>`;

  writeFileSync(join(outDir, `${d.slug}.html`), html);
  console.log(`Generated ${canonicalPath}`);
}
