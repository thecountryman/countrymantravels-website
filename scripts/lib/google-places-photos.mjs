// Fallback photo source for hotels Wikimedia Commons doesn't cover.
// Requires GOOGLE_PLACES_API_KEY in the environment. NOT independently tested against a
// real key — verify field names/response shape against current Places API (New) docs
// before relying on this in production.
//
// Uses a strict FieldMask (id, displayName, photos only) so requests stay in the free
// tier and never accidentally pull rating/review fields that push billing to a higher SKU.
//
// ToS note: Google prohibits permanently caching photo references or image files. Re-run
// this script on a schedule (e.g. monthly, alongside a site rebuild) rather than treating
// its output as a one-time permanent fetch.

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_PHOTO_URL = 'https://places.googleapis.com/v1';

async function findPlace(query, apiKey) {
  const res = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) throw new Error(`Places searchText ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places?.[0] ?? null;
}

/** Look up photos for a hotel via Google Places (New). Returns null if not found. */
export async function getGooglePlacesPhotos(hotelName, city = 'Las Vegas, NV', limit = 3) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set — get one at console.cloud.google.com (enable Places API (New), create a billing-enabled key; usage stays free within the monthly quota if you keep the FieldMask strict).');

  const place = await findPlace(`${hotelName}, ${city}`, apiKey);
  if (!place || !place.photos?.length) return null;

  const photos = place.photos.slice(0, limit).map((p) => ({
    // maxWidthPx required; this URL redirects to the actual image and must be fetched
    // fresh each time per Google's terms, not cached long-term.
    url: `${PLACE_PHOTO_URL}/${p.name}/media?maxWidthPx=1200&key=${apiKey}`,
    attributions: (p.authorAttributions ?? []).map((a) => a.displayName),
  }));

  return { source: 'google_places', placeId: place.id, matchedName: place.displayName?.text, photos };
}
