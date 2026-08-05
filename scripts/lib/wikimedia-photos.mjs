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

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CountrymanTravels/1.0 (countrymantravels.com; hotel photo lookup)' } });
  if (!res.ok) throw new Error(`Wikimedia API ${res.status}`);
  return res.json();
}

async function findBestCategory(hotelName) {
  const data = await apiGet({ action: 'query', list: 'search', srsearch: hotelName, srnamespace: '14', srlimit: '8' });
  const results = data.query?.search ?? [];
  let best = null;
  for (const r of results) {
    const score = scoreCategory(r.title, hotelName);
    if (!best || score > best.score) best = { title: r.title, score };
  }
  return best && best.score >= 0.5 ? best : null;
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
