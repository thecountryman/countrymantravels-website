const API = 'https://commons.wikimedia.org/w/api.php';

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Words too generic to count as a real name match (avoids "Circa" matching "Category:Circa (rapper)")
const STOPWORDS = new Set(['hotel', 'casino', 'resort', 'las', 'vegas', 'and', 'the', 'spa', 'suites']);

function significantWords(name) {
  return norm(name).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Score how well a Commons category title matches the hotel's real name. */
function scoreCategory(categoryTitle, hotelName) {
  const catWords = new Set(norm(categoryTitle.replace(/^Category:/, '')).split(' '));
  const hotelWords = significantWords(hotelName);
  if (hotelWords.length === 0) return 0;
  const matched = hotelWords.filter((w) => catWords.has(w)).length;
  return matched / hotelWords.length;
}

async function apiGet(params, retries = 4) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'CountrymanTravels/1.0 (countrymantravels.com; hotel photo lookup)' } });
    if (res.status === 429 && attempt < retries) {
      const waitMs = 2000 * 2 ** attempt; // 2s, 4s, 8s, 16s
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(`Wikimedia API ${res.status}`);
    return res.json();
  }
  throw new Error('Wikimedia API 429 after retries');
}

// Deliberately NOT matching bare "nevada"/"nv" — Nevada has other casino towns
// (Laughlin, Reno) that would false-positive against a Las Vegas-area hotel.
const VEGAS_SIGNAL = /\b(las vegas|henderson)\b/;
// A parenthetical disambiguator that names a different place is a hard reject
// (e.g. "Category:Green Valley Ranch (Denver)" for a Las Vegas-area hotel of the same name).
const REJECTING_PAREN = /\(([^)]+)\)\s*$/;

function hasDisqualifyingParen(categoryTitle) {
  const m = categoryTitle.match(REJECTING_PAREN);
  if (!m) return false;
  return !VEGAS_SIGNAL.test(m[1].toLowerCase());
}

/** Confirm the category actually sits under a Las Vegas/Nevada part of the category tree,
 *  not just a name that happens to share words (e.g. "New York-New York" matching "New York Giants"). */
async function verifyVegasContext(categoryTitle) {
  const data = await apiGet({ action: 'query', prop: 'categories', titles: categoryTitle, cllimit: '50' });
  const pages = Object.values(data.query?.pages ?? {});
  const parentCats = pages.flatMap((p) => (p.categories ?? []).map((c) => c.title));
  return parentCats.some((c) => VEGAS_SIGNAL.test(c.toLowerCase()));
}

async function findBestCategory(hotelName) {
  const data = await apiGet({ action: 'query', list: 'search', srsearch: hotelName, srnamespace: '14', srlimit: '8' });
  const results = data.query?.search ?? [];
  const candidates = results
    .map((r) => ({ title: r.title, score: scoreCategory(r.title, hotelName) }))
    .filter((c) => c.score >= 0.5 && !hasDisqualifyingParen(c.title))
    .sort((a, b) => b.score - a.score);

  for (const candidate of candidates.slice(0, 3)) {
    if (await verifyVegasContext(candidate.title)) return candidate;
    await new Promise((r) => setTimeout(r, 800));
  }
  return null;
}

async function categoryPhotos(categoryTitle, limit = 3) {
  const data = await apiGet({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: categoryTitle,
    gcmtype: 'file',
    gcmlimit: String(limit * 3), // over-fetch, then filter out non-photo files (svg logos, maps, etc.)
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1200',
  });
  const pages = Object.values(data.query?.pages ?? {});
  const photos = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!info.mime?.startsWith('image/') || info.mime === 'image/svg+xml') continue; // skip logos/diagrams
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? 'Unknown';
    if (/\bNC\b/.test(license)) continue; // exclude non-commercial-only licenses
    photos.push({
      url: info.thumburl ?? info.url,
      title: page.title.replace(/^File:/, ''),
      license,
      author: (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() || 'Unknown',
      sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    });
    if (photos.length >= limit) break;
  }
  return photos;
}

/** Look up real photos for a hotel on Wikimedia Commons. Returns null if no confident match. */
export async function getWikimediaPhotos(hotelName, limit = 3) {
  const category = await findBestCategory(hotelName);
  if (!category) return null;
  const photos = await categoryPhotos(category.title, limit);
  if (photos.length === 0) return null;
  return { source: 'wikimedia', category: category.title, matchConfidence: category.score, photos };
}
