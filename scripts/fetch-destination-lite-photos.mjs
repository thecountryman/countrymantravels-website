import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPhotosBySearch } from './lib/wikimedia-search-photos.mjs';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, 'data', 'destinations-lite');
const outDir = join(root, 'data', 'destination-photos');
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));

for (const file of files) {
  const d = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  const photos = {};

  console.log(`\n${d.name}`);

  if (d.heroPhotoQuery) {
    await sleep(1200);
    const hero = await getPhotosBySearch(d.heroPhotoQuery, 1);
    photos.hero = hero[0] ?? null;
    console.log(`  hero: ${hero[0] ? hero[0].title : 'NONE FOUND'}`);
  }

  photos.areas = {};
  for (const area of d.topAreas ?? []) {
    if (!area.photoQuery) continue;
    await sleep(1200);
    const found = await getPhotosBySearch(area.photoQuery, 1);
    photos.areas[area.name] = found[0] ?? null;
    console.log(`  area "${area.name}": ${found[0] ? found[0].title : 'NONE FOUND'}`);
  }

  photos.things = {};
  for (const thing of d.topThings ?? []) {
    if (!thing.photoQuery) continue;
    await sleep(1200);
    const found = await getPhotosBySearch(thing.photoQuery, 1);
    photos.things[thing.name] = found[0] ?? null;
    console.log(`  thing "${thing.name}": ${found[0] ? found[0].title : 'NONE FOUND'}`);
  }

  writeFileSync(join(outDir, `${d.slug}.json`), JSON.stringify(photos, null, 2));
  console.log(`Wrote data/destination-photos/${d.slug}.json`);
}
