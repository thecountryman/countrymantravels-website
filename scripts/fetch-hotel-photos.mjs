import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getWikimediaPhotos } from './lib/wikimedia-photos.mjs';
import { getGooglePlacesPhotos } from './lib/google-places-photos.mjs';

const root = new URL('..', import.meta.url).pathname;
const hotelsDir = join(root, 'vegas', 'hotels');
const outDir = join(root, 'data', 'hotel-content', 'vegas');
mkdirSync(outDir, { recursive: true });

const files = readFileSync(join(root, 'data', '_hotel-slugs.txt'), 'utf8').trim().split('\n');

const results = { wikimedia: 0, google: 0, none: 0 };
const report = [];

for (const line of files) {
  const [slug, name] = line.split('|');
  process.stdout.write(`${name}... `);

  let entry = null;
  try {
    const wiki = await getWikimediaPhotos(name);
    if (wiki) {
      entry = wiki;
      results.wikimedia++;
      console.log(`wikimedia (${wiki.category}, confidence ${wiki.matchConfidence.toFixed(2)}, ${wiki.photos.length} photos)`);
    }
  } catch (err) {
    console.log(`wikimedia error: ${err.message}`);
  }

  if (!entry) {
    try {
      const google = await getGooglePlacesPhotos(name);
      if (google) {
        entry = google;
        results.google++;
        console.log(`google places (${google.photos.length} photos)`);
      } else {
        results.none++;
        console.log('no match anywhere');
      }
    } catch (err) {
      results.none++;
      console.log(`no Wikimedia match; Google fallback unavailable (${err.message})`);
    }
  }

  report.push({ slug, name, ...(entry ?? { source: 'none' }) });
  if (entry) {
    writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(entry, null, 2));
  }

  // Be polite to the Wikimedia API — each hotel makes several calls (search + context checks + categorymembers).
  await new Promise((r) => setTimeout(r, 3500));
}

console.log('\n--- Summary ---');
console.log(`Wikimedia matches: ${results.wikimedia}`);
console.log(`Google Places matches: ${results.google}`);
console.log(`No match: ${results.none}`);
writeFileSync(join(root, 'data', 'hotel-content', 'vegas-photo-report.json'), JSON.stringify(report, null, 2));
