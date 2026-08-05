const API = 'https://commons.wikimedia.org/w/api.php';

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CountrymanTravels/1.0 (countrymantravels.com; destination photo lookup; contact: jared.countryman@icloud.com)' } });
  if (!res.ok) throw new Error(`Wikimedia API ${res.status}`);
  return res.json();
}

/**
 * Full-text file search across Wikimedia Commons — better suited than category matching
 * for landmarks/neighborhoods, which are often organized under unpredictable category
 * names or have their real photos filed only in subcategories. Excludes non-commercial
 * (-NC) licenses so results are safe to cache and self-host permanently.
 */
export async function getPhotosBySearch(query, limit = 3) {
  const data = await apiGet({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limit * 3),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1200',
  });
  const pages = Object.values(data.query?.pages ?? {});
  const photos = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!info.mime?.startsWith('image/') || info.mime === 'image/svg+xml') continue;
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? 'Unknown';
    if (/\bNC\b/.test(license)) continue;
    const title = page.title.replace(/^File:/, '');
    photos.push({
      url: info.thumburl ?? info.url,
      title,
      license,
      author: (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim() || 'Unknown',
      sourcePage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title.replaceAll(' ', '_'))}`,
    });
    if (photos.length >= limit) break;
  }
  return photos;
}
