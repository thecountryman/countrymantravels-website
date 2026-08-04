# Countryman Travels — AI Site Brief

## Purpose

Countryman Travels is an independent vacation-planning and affiliate-booking site. It helps travelers make the high-value decisions before checkout: where to stay, what a trip will truly cost, which experiences are worth reserving, and how to make the itinerary work. The site is not merely a companion to printed guidebooks. Guidebooks add authority and direct QR traffic to permanent live pages; the site is the continuously updated planning and booking engine.

## Business model

- Primary: qualifying affiliate bookings for stays and flights through Expedia, and experiences through approved partners.
- Secondary: guidebooks, future digital trip-planning products, email capture, and carefully disclosed partner promotions.
- Editorial rule: recommend based on traveler fit and clear tradeoffs. Never present an affiliate relationship as an endorsement or guarantee.

## Site structure

```
Homepage (/)
  → Plan Your Trip (/plan-your-trip)
  → Destinations (/destinations)
      → Las Vegas (/vegas/) — detailed, established hub
          → Hotels, shows, attractions, trip tools, guidebook QR landing pages
      → Orlando (/orlando/) — launch hub
      → Anaheim (/anaheim/) — launch hub
      → Nashville (/nashville/) — launch hub
```

Each mature destination should contain decision pages for hotels/areas, real costs, transportation, itinerary types, tours/attractions, events, and trip tools. Pages must direct a traveler to one relevant next action instead of showing generic link lists.

## Non-negotiable route rules

- Never remove or rename existing printed-book URLs.
- Preserve every URL documented in `QR_URL_MAP.md`; QR links are a compatibility contract.
- If a page must move, retain the previous address and add a permanent redirect.
- Do not use unreliable wildcard redirects for commercial destination URLs. Use explicit routes.
- Keep affiliate disclosures near commercial links and use `rel="sponsored noopener"` on outbound affiliate links.

## Homepage Expedia booking-search module

Place the widget directly below the homepage hero and above the “plan first” trust strip. It is for travelers who are ready to check live hotel or flight availability after using the planning content.

```html
<section class="booking-search-section" aria-labelledby="booking-search-title">
  <div class="booking-search-wrap">
    <div class="booking-search-copy">
      <div>
        <p class="section-kicker">Search stays and flights</p>
        <h2 id="booking-search-title">Ready to check dates? Start with Expedia.</h2>
      </div>
      <p>Search live availability after you have used Countryman Travels to narrow the hotel, destination, or trip shape that fits.</p>
    </div>
    <div class="expedia-widget-shell">
      <div class="eg-widget" data-widget="search" data-program="us-expedia"
        data-lobs="stays,flights" data-network="pz" data-camref="1100l5QnPk" data-pubref=""></div>
      <script class="eg-widgets-script"
        src="https://creator.expediagroup.com/products/widgets/assets/eg-widgets.js"></script>
      <noscript><a class="home-btn home-btn-primary"
        href="https://expedia.com/affiliate/NcnWe9t" target="_blank"
        rel="sponsored noopener">Search Expedia</a></noscript>
    </div>
    <p class="booking-search-disclosure">Search is powered by Expedia. Countryman Travels may earn a commission if you book through this tool, at no additional cost to you.</p>
  </div>
</section>
```

Implementation requirements:

- Load Expedia’s widget script once per page only.
- Preserve the `data-program`, `data-network`, and `data-camref` values above unless the Expedia affiliate account supplies replacements.
- Keep the no-JavaScript affiliate-link fallback and the nearby disclosure.
- Do not replace the widget with an untracked Expedia URL or a generic search form.
- Test desktop and mobile rendering after any CSS redesign; the shell needs a minimum height so the embedded widget is not clipped.
