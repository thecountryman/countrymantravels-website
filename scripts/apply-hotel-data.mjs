/**
 * Single-direction data push: data/vegas-hotels.json -> rendered HTML.
 *
 * Rewrites resort fee, fee-with-tax, area, and parking everywhere they appear:
 *   - vegas/resort-fees.html      (summary tiles, sortable table, FAQ schema)
 *   - vegas/hotels.html           (56 hotel cards)
 *   - vegas/hotels/<slug>.html    (eyebrow + stat tiles)
 *
 * Fields that are null in the data file are NOT VERIFIED and render as
 * "Confirm at booking" — never as a placeholder number.
 *
 * Usage: node scripts/apply-hotel-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not URL.pathname) so the repo works from a path containing spaces.
const root = fileURLToPath(new URL('..', import.meta.url));
const db = JSON.parse(readFileSync(join(root, 'data/vegas-hotels.json'), 'utf8'));
const { roomTaxRate, lastVerified } = db._meta;
const hotels = db.hotels;

const money = (n) => `$${n.toFixed(2)}`;
/** Escape for HTML text/attribute content — hotel names contain "&". */
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const withTax = (fee) => fee * (1 + roomTaxRate);
const feeLabel = (h) => (h.resortFee === 0 ? 'No resort fee' : `${money(h.resortFee)} / night`);
const taxLabel = (h) =>
  h.resortFee === 0 ? 'No mandatory nightly fee' : `+ tax (${money(withTax(h.resortFee))} total)`;
/** Lowest self-parking dollar amount, 0 for free, null if unverified. */
function selfParkingLow(h) {
  if (!h.parkingSelf) return null;
  if (h.parkingSelf.startsWith('Free')) return 0;
  const m = h.parkingSelf.match(/\$([0-9.]+)/);
  return m ? parseFloat(m[1]) : null;
}

/**
 * The number the site exists to surface: what a night costs on top of the
 * advertised room rate (resort fee incl. tax + cheapest self-parking).
 */
function addOnCost(h) {
  const fee = withTax(h.resortFee);
  const park = selfParkingLow(h);
  if (park === null) {
    return { value: money(fee), sub: 'Resort fee w/ tax · parking unconfirmed' };
  }
  const isRange = /[–-]/.test(h.parkingSelf) && park > 0;
  return {
    value: `${isRange ? 'From ' : ''}${money(fee + park)}`,
    sub: park === 0 ? 'Resort fee w/ tax · parking free' : 'Resort fee w/ tax + self parking',
  };
}

function parkingLabel(h) {
  const { parkingSelf: s, parkingValet: v } = h;
  if (!s || !v) return 'Confirm at booking';
  if (s === 'Free' && v === 'Free') return 'Free self & valet';
  const self = s.startsWith('Free') ? `Free self${s.includes('guests') ? ' (guests)' : ''}` : `${s} self`;
  const valet = v === 'Not offered' ? 'no valet' : v === 'Free' ? 'free valet' : `${v} valet`;
  return `${self} / ${valet}`;
}

/** Replace the element starting at `open` by balancing <div>/</div>. */
function replaceBalancedDiv(html, openIdx, replacement) {
  let depth = 0;
  let i = openIdx;
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = openIdx;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === '</div>') {
      depth--;
      if (depth === 0) {
        i = m.index + m[0].length;
        return html.slice(0, openIdx) + replacement + html.slice(i);
      }
    } else depth++;
  }
  throw new Error('unbalanced div');
}

const stats = (() => {
  const fees = Object.values(hotels).map((h) => h.resortFee);
  const avg = fees.reduce((a, b) => a + b, 0) / fees.length;
  return { avg, hi: Math.max(...fees), lo: Math.min(...fees) };
})();

let touched = 0;

/* ---------------------------------------------------------------- detail pages */
const tile = (icon, label, value, sub, colour = '#FFFFFF') => `
      <div style="background:#0F172A; border:1px solid #334155; border-radius:10px; padding:14px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); display:flex; flex-direction:column; gap:4px;">
        <span style="font-size:11px; font-weight:800; color:#94A3B8; text-transform:uppercase; letter-spacing:0.5px;">${icon} ${label}</span>
        <span style="font-size:17px; font-weight:800; color:${colour} !important;">${value}</span>
        <span style="font-size:12px; color:#CBD5E1;">${sub}</span>
      </div>`;

for (const [slug, h] of Object.entries(hotels)) {
  const file = join(root, 'vegas/hotels', `${slug}.html`);
  let html = readFileSync(file, 'utf8');

  const tiles = [
    tile('💵', 'RESORT FEE', feeLabel(h), taxLabel(h), h.resortFee === 0 ? '#34D399' : '#FFFFFF'),
    tile('🚗', 'PARKING', esc(parkingLabel(h)), h.parkingNote ?? (h.parkingSelf ? 'Per night, hotel guests' : 'Rates change often')),
    tile('🧾', 'ADDS PER NIGHT', addOnCost(h).value, addOnCost(h).sub, '#FBBF24'),
  ];
  if (h.roomSize) tiles.push(tile('📐', 'ROOM SIZE', h.roomSize, 'Standard king / queen'));

  const cols = tiles.length;
  const grid = `<div style="display:grid; grid-template-columns:repeat(${cols}, 1fr); gap:16px; margin:1.5rem 0;">${tiles.join('')}
    </div>`;

  // Match any tile count so re-runs stay idempotent.
  const gridRe = /<div style="display:grid; grid-template-columns:repeat\(\d+, 1fr\); gap:16px; margin:1\.5rem 0;">/;
  const openIdx = html.search(gridRe);
  if (openIdx === -1) throw new Error(`stats grid not found in ${slug}`);
  html = replaceBalancedDiv(html, openIdx, grid);

  // Eyebrow: "LAS VEGAS STRIP · HOTEL FIELD GUIDE" -> real area.
  // [^<>] so areas containing parens/hyphens still re-match on later runs.
  html = html.replace(
    /[^<>]*?·\s*HOTEL FIELD GUIDE/,
    `${h.area.toUpperCase()} · HOTEL FIELD GUIDE`
  );

  // Deep-link into the calculator with this hotel preselected. Idempotent:
  // the anchor is rebuilt from the marker on every run.
  const calcLink = `<a href="/vegas/trip-cost.html?hotel=${slug}&amp;nights=3" style="color:var(--gold-dark); font-weight:700;" data-calc-link>Work out what a 3-night stay here really costs &rarr;</a>`;
  if (html.includes('data-calc-link')) {
    html = html.replace(/<a href="\/vegas\/trip-cost\.html[^>]*data-calc-link>[^<]*<\/a>/, () => calcLink);
  } else {
    html = html.replace(
      /(<a href="\/vegas\/resort-fees\.html"[^>]*>Compare this resort fee against all 56 Vegas hotels &rarr;<\/a>)/,
      (_m, a) => `${a}<br>${calcLink}`
    );
  }

  // Hotel JSON-LD must agree with the visible tiles — search engines and
  // assistants read this, so a stale figure here is a wrong price in results.
  html = html.replace(
    /(<script type="application\/ld\+json">)(\{[\s\S]*?\})(<\/script>)/g,
    (match, open, body, close) => {
      let data;
      try { data = JSON.parse(body); } catch { return match; }
      if (data['@type'] !== 'Hotel') return match;

      const props = [
        { '@type': 'PropertyValue', name: 'Resort Fee (Estimated)', value: feeLabel(h) },
      ];
      if (h.parkingSelf && h.parkingValet) {
        props.push({ '@type': 'PropertyValue', name: 'Parking (Estimated)', value: parkingLabel(h) });
      }
      if (h.roomSize) {
        props.push({ '@type': 'PropertyValue', name: 'Room Size (Estimated)', value: h.roomSize });
      }
      props.push({ '@type': 'PropertyValue', name: 'Area', value: h.area });
      data.additionalProperty = props;
      // Per-property smoking policy is not verified; do not assert it.
      delete data.smokingAllowed;
      return `${open}${JSON.stringify(data)}${close}`;
    }
  );

  writeFileSync(file, html);
  touched++;
}
console.log(`detail pages rewritten: ${touched}`);

/* ------------------------------------------------------------------ hotels.html */
{
  const file = join(root, 'vegas/hotels.html');
  let html = readFileSync(file, 'utf8');
  let n = 0;

  for (const [slug, h] of Object.entries(hotels)) {
    const linkIdx = html.indexOf(`/vegas/hotels/${slug}.html"`);
    if (linkIdx === -1) { console.warn(`  ! card link missing: ${slug}`); continue; }
    const cardStart = html.lastIndexOf('<div class="card"', linkIdx);
    const cardEnd = html.indexOf('</div>', linkIdx);
    let card = html.slice(cardStart, cardEnd);

    // Area label. Replace only the leading text node — some cards (Park MGM)
    // carry a badge <span> inside this div that must survive.
    card = card.replace(
      /(letter-spacing:0\.5px; margin-bottom:4px;">)([^<]*)/,
      (_m, a, txt) => `${a}${esc(h.area)}${/\s$/.test(txt) ? ' ' : ''}`
    );
    // fee — function replacer: money() output contains "$" sequences
    const feeText = h.resortFee === 0 ? 'No resort fee' : `${money(h.resortFee)} / night`;
    card = card.replace(
      /(Estimated Fee: <span style="color:var\(--terracotta\);">)[^<]*(<\/span>)/,
      (_m, a, b) => `${a}${feeText}${b}`
    );
    html = html.slice(0, cardStart) + card + html.slice(cardEnd);
    n++;
  }
  writeFileSync(file, html);
  console.log(`hotels.html cards rewritten: ${n}`);
}

/* -------------------------------------------------------------- resort-fees.html */
{
  const file = join(root, 'vegas/resort-fees.html');
  let html = readFileSync(file, 'utf8');

  const rows = Object.entries(hotels)
    .sort((a, b) => b[1].resortFee - a[1].resortFee || a[1].name.localeCompare(b[1].name))
    .map(([slug, h]) => {
      const fee = h.resortFee === 0 ? 'No resort fee' : money(h.resortFee);
      const tax = h.resortFee === 0 ? '—' : money(withTax(h.resortFee));
      return `<tr><td><a href="/vegas/hotels/${slug}.html">${esc(h.name)}</a></td><td>${esc(h.area)}</td><td data-sort="${h.resortFee}">${fee}</td><td>${tax}</td><td>${esc(parkingLabel(h))}</td></tr>`;
    })
    .join('\n');

  html = html.replace(/<tbody>[\s\S]*?<\/tbody>/, () => `<tbody>\n${rows}\n</tbody>`);

  // drop the unverifiable room-size column
  html = html.replace(/\s*<th data-col="5">Room size <span class="arrow">↕<\/span><\/th>/, '');

  // summary tiles
  const setTile = (label, value) => {
    html = html.replace(
      new RegExp(`(>${label}</span><div style="font-size:20px;font-weight:800;color:#fff;">)[^<]*(</div>)`),
      (_m, a, b) => `${a}${value}${b}`
    );
  };
  setTile('Average fee', `$${stats.avg.toFixed(0)}/night`);
  setTile('Highest', `$${stats.hi.toFixed(0)}/night`);
  setTile('Lowest', stats.lo === 0 ? '$0/night' : `$${stats.lo.toFixed(0)}/night`);

  // FAQ schema figures
  html = html.replace(
    /the estimated average resort fee is about \$[0-9.]+ per night before tax, ranging from \$[0-9.]+ to \$[0-9.]+\./,
    () => `the estimated average resort fee is about $${stats.avg.toFixed(0)} per night before tax, ranging from $${stats.lo.toFixed(0)} to $${stats.hi.toFixed(0)}.`
  );

  // freshness label
  const stamp = new Date(lastVerified + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  html = html.replace(/THE REAL COST · UPDATED [A-Z]+ \d{4}/i, `THE REAL COST · UPDATED ${stamp.toUpperCase()}`);
  html = html.replace(/last checked [A-Z][a-z]+ \d{4}/, `last checked ${stamp}`);

  writeFileSync(file, html);
  console.log(`resort-fees.html: ${Object.keys(hotels).length} rows, avg $${stats.avg.toFixed(2)}, range $${stats.lo}–$${stats.hi}`);
}

/* --------------------------------------------------------- vegas/trip-cost.html */
{
  const file = join(root, 'vegas/trip-cost.html');
  let html = readFileSync(file, 'utf8');

  const payload = {
    taxRate: roomTaxRate,
    lastVerified: new Date(lastVerified + 'T00:00:00Z').toLocaleDateString('en-US', {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    }),
    hotels: Object.entries(hotels).map(([slug, h]) => ({
      slug,
      name: h.name,
      area: h.area,
      fee: h.resortFee,
      // null = unverified; the calculator must not treat it as free.
      park: selfParkingLow(h),
    })),
  };

  const re = /(<!-- AUTO:hotel-data -->)[\s\S]*?(<!-- \/AUTO:hotel-data -->)/;
  if (!re.test(html)) throw new Error('hotel-data marker missing in trip-cost.html');
  html = html.replace(re, (_m, open, close) =>
    `${open}\n<script>window.CT_HOTELS=${JSON.stringify(payload)};</script>\n${close}`);

  writeFileSync(file, html);
  const unverified = payload.hotels.filter((h) => h.park === null).length;
  console.log(`trip-cost.html: ${payload.hotels.length} hotels injected (${unverified} without verified parking)`);
}

/* ------------------------------------------------------------------- index.html */
{
  const file = join(root, 'index.html');
  let html = readFileSync(file, 'utf8');

  // NOTE: replacement must be a function — generated bodies contain "$20"/"$1..."
  // which String.replace would otherwise expand as capture-group references.
  const fill = (name, body) => {
    const re = new RegExp(`(<!-- AUTO:${name} -->)[\\s\\S]*?(<!-- /AUTO:${name} -->)`);
    if (!re.test(html)) throw new Error(`marker ${name} missing in index.html`);
    html = html.replace(re, (_m, open, close) => `${open}\n${body}\n          ${close}`);
  };

  // Hotels with a known parking cost, ranked by what they add per night.
  const ranked = Object.entries(hotels)
    .filter(([, h]) => selfParkingLow(h) !== null)
    .map(([slug, h]) => ({ slug, h, total: withTax(h.resortFee) + selfParkingLow(h) }))
    .sort((a, b) => b.total - a.total);

  const top = ranked.slice(0, 4);
  const bottom = ranked.slice(-4).reverse();
  const spread = top[0].total - bottom[bottom.length - 1].total;

  /* --- hero stats --- */
  fill('hero-stats', `          <div class="hero-stats">
            <div><strong>56</strong><span>Vegas hotels tracked</span></div>
            <div><strong>$${stats.avg.toFixed(0)}</strong><span>Average resort fee</span></div>
            <div><strong>$${top[0].total.toFixed(0)}</strong><span>Highest nightly add-on</span></div>
          </div>`);

  /* --- hero worked example --- */
  const ex = ranked.find((r) => r.slug === 'aria') ?? top[0];
  const exPark = selfParkingLow(ex.h);
  fill('hero-cost-card', `        <aside class="hero-math-card">
          <p>What actually gets added</p>
          <h2>${esc(ex.h.name)}, per night</h2>
          <dl>
            <div class="row"><span>Resort fee</span><b>${money(ex.h.resortFee)}</b></div>
            <div class="row"><span>Tax on that fee</span><b>+${money(withTax(ex.h.resortFee) - ex.h.resortFee)}</b></div>
            <div class="row"><span>Self parking</span><b>+${money(exPark)}</b></div>
            <div class="row row--total"><span>Added every night</span><b>${money(ex.total)}</b></div>
          </dl>
          <small>Before the room rate you searched on. Figures last checked ${new Date(lastVerified + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.</small>
          <a href="/vegas/hotels/${ex.slug}.html">See the full ${esc(ex.h.name)} breakdown →</a>
        </aside>`);

  /* --- proof table --- */
  const row = ({ slug, h, total }) => `              <tr><td><a href="/vegas/hotels/${slug}.html">${esc(h.name)}</a><span class="area">${esc(h.area)}</span></td><td>${h.resortFee === 0 ? '<span class="free">None</span>' : money(withTax(h.resortFee))}</td><td>${selfParkingLow(h) === 0 ? '<span class="free">Free</span>' : money(selfParkingLow(h))}</td><td class="adds">${money(total)}</td></tr>`;

  fill('cost-table', `        <div class="cost-table-wrap">
          <table class="cost-table">
            <thead><tr><th>Hotel</th><th>Resort fee w/ tax</th><th>Self parking</th><th>Adds per night</th></tr></thead>
            <tbody>
              <tr class="is-divider"><td colspan="4">Costs the most on top of the rate</td></tr>
${top.map(row).join('\n')}
              <tr class="is-divider"><td colspan="4">Costs the least</td></tr>
${bottom.map(row).join('\n')}
            </tbody>
          </table>
        </div>
        <div class="cost-proof__foot">
          <p>Estimated figures, last checked ${new Date(lastVerified + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })} — fees change often; confirm at booking.</p>
          <a href="/vegas/trip-cost.html">Work out the cost of your own trip →</a>
        </div>`);

  writeFileSync(file, html);
  console.log(`index.html: spread $${spread.toFixed(2)}/night between highest and lowest`);
}
