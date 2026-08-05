import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const linksByMarket = JSON.parse(readFileSync(join(root, 'data', 'affiliate-links.json'), 'utf8'));

/**
 * Resolve the best available affiliate link for one product.
 * Falls back to the market+category destination-search link (never a dead anchor)
 * when no product-specific link has been added yet for that slug.
 */
export function getAffiliateLink(market, category, slug) {
  const marketData = linksByMarket[market];
  if (!marketData) throw new Error(`No affiliate data for market "${market}"`);

  const specific = marketData[category]?.[slug]?.[0];
  if (specific) return specific;

  const fallback = marketData.fallbacks?.[category];
  if (fallback) return fallback;

  throw new Error(`No affiliate link or fallback for ${market}/${category}/${slug}`);
}

export function getFallback(market, category) {
  const fallback = linksByMarket[market]?.fallbacks?.[category];
  if (!fallback) throw new Error(`No fallback configured for ${market}/${category}`);
  return fallback;
}
