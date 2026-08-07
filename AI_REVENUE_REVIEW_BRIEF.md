# Countryman Travels — Site Description & AI Revenue-Review Brief

This doc has two parts: (1) what the site is and where it's headed, for context, and (2) a standing prompt to hand to an AI reviewer when you want a site audit focused on profit. For build/route rules (URL stability, GA tagging, the Expedia widget), see `AI_SITE_BRIEF.md` — this doc doesn't repeat those, it assumes them.

---

## Part 1: What Countryman Travels Is

**What it started as:** A single-destination project — a printed/digital Las Vegas trip guide. The core idea was that printed guidebooks go stale the moment prices, resort fees, show dates, and menus change, so the book was paired with a live website that stays current: real-time-ish costs, direct booking links, and a "last verified" date on anything volatile. Vegas is still the flagship and the only fully-built-out market — 56 hotels, shows/residencies, dining directory, credit cards & rewards, packing gear, trip tools.

**What it's becoming:** The goal is to be the destination for planning any trip, not just Vegas — a "plan, book, and prepare" travel platform covering destinations worldwide. Guidebooks for new destinations release on Amazon on a rolling basis as they're finished; each gets a live digital companion site built on the same pattern as Vegas (hotel/area decision pages, real costs, transportation, itineraries, tours, events, trip tools). Orlando, Anaheim, and Nashville already exist as early "launch hub" pages; New Orleans exists as a lighter "quick guide." The long-term shape is many destination hubs, each editorially independent (no pay-for-placement listings) but sharing one affiliate/booking engine underneath.

**Business model:**
- Primary revenue: affiliate commissions — hotel/flight bookings via Expedia, experiences/tours via Viator and other approved partners.
- Secondary: guidebook sales on Amazon, future digital trip-planning products, email capture, disclosed partner promotions.
- Editorial rule the whole site is built around: recommendations are based on traveler fit and honest tradeoffs, never pay-to-play, and affiliate relationships are always disclosed, never presented as endorsements.

**Non-negotiables an AI reviewer must respect** (already enforced elsewhere, restated here so a review doesn't recommend violating them):
- Never propose removing, renaming, or moving a URL listed in `QR_URL_MAP.md` without a redirect — those are printed in a physical book already in circulation.
- Every page needs the GA4 gtag snippet (`G-4QMCMJCHPN`).
- Affiliate links keep `rel="sponsored noopener"` and stay near a disclosure.
- Don't suggest fake urgency, fabricated reviews/prices, or anything that misrepresents "verified vs. estimated" pricing labels — the "no-BS, independent" positioning is the differentiator against generic travel blogs, and undermining it is a bigger loss than any short-term conversion lift.

---

## Part 2: Standing Prompt — AI Site Review for Profit

Use this when you want an AI (Claude or otherwise) to review the live site or the repo and come back with concrete, prioritized ways to grow revenue.

```
You are reviewing Countryman Travels (countrymantravels.com), an independent
travel-planning and affiliate-booking site. Read AI_REVENUE_REVIEW_BRIEF.md
and AI_SITE_BRIEF.md first for full context on positioning, business model,
and non-negotiable constraints — do not recommend anything that violates them
(QR URL stability, GA tagging, affiliate disclosure, no fabricated
prices/reviews).

Your job: find the highest-leverage changes to increase affiliate revenue and
guidebook sales, ranked by expected impact vs. effort. Review these areas:

1. Conversion funnel — for each destination hub (start with Vegas, the
   flagship), trace the path from landing page to an actual affiliate click
   or booking-widget interaction. Flag pages with weak or missing calls to
   action, dead ends, or CTAs that don't match what the visitor was just
   reading.

2. Affiliate link coverage — check data/affiliate-links.json and
   data/affiliate-accounts.json. Identify: (a) product/category slugs still
   falling back to a generic destination search link instead of a specific
   product URL, (b) categories or markets with no links mapped at all, (c)
   places where a higher-commission provider is live but a lower-commission
   one is still first in the array.

3. Underbuilt markets — Orlando, Anaheim, Nashville are launch hubs; New
   Orleans is a quick guide. Assess which is closest to Vegas-level depth
   with the least additional work, and which has the best affiliate/search
   demand to justify going deeper next.

4. SEO and content gaps — pages that are thin, missing structured data,
   missing or duplicate meta descriptions, or targeting no clear
   high-intent search query (e.g. "[hotel] resort fee," "[destination] cost
   to visit").

5. Trust and differentiation signals — resort-fee transparency, "verified vs
   estimated" labeling, methodology page visibility — are they surfaced
   early enough on money pages to influence the click, or buried?

6. Cross-sell between guidebook and site — does the live site convert
   guidebook readers (QR traffic) into affiliate clicks, and does the site
   sell the guidebook to first-time web visitors? Flag any one-directional
   gaps.

7. Email capture — is there a mechanism at all, and if so, is it placed on
   high-intent pages (hotel comparisons, cost pages) rather than only the
   homepage?

8. Page speed / technical issues that would suppress SEO ranking or cause
   drop-off, if inspectable (image sizes, render-blocking scripts, the
   Expedia widget's load behavior).

Output format: a prioritized list. For each recommendation, give the
specific file(s) or page(s) affected, the change, why it should increase
revenue, and a rough effort estimate (small/medium/large). Separate
"quick wins" (small effort, clear revenue link) from "bigger bets" (larger
effort, higher potential upside). Do not include generic advice ("add more
content," "improve SEO") without pointing at a specific page or gap you
actually found.
```

**How to use it:** paste the prompt into a fresh AI session pointed at this repo (or give it the live URLs if it can browse), let it read both brief docs first, and treat its output as a punch list to prioritize — not something to auto-implement. Anything touching QR-mapped URLs, pricing labels, or affiliate provider priority should still get a human sanity check before shipping, per the standing rules.
