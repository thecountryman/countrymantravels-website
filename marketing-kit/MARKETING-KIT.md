# Countryman Travels — Free-Traffic Marketing Kit (Aug 2026)

Everything here is ready to use. Items marked **[YOU]** need your personal account; nothing costs money.

---

## 1. Pinterest (biggest free channel for travel planning)

**Setup [YOU]:** create a free business account at pinterest.com/business/create, claim `countrymantravels.com` (Settings → Claimed accounts — it gives you an HTML tag; send it to Claude to add to the site).

**Pin images:** 4 ready-to-upload SVGs in `marketing-kit/pins/` (open in a browser, or ask Claude to convert to PNG). Cadence: 2–3 pins/week beats 10 at once.

| Pin file | Title to use | Link to |
|---|---|---|
| pin-1-highest-fees.svg | The 5 Highest Resort Fees in Las Vegas (2026) | /vegas/resort-fees.html |
| pin-2-lowest-fees.svg | 5 Vegas Hotels With the Lowest Resort Fees | /vegas/resort-fees.html |
| pin-3-average.svg | Your Vegas Room Rate Is a Lie — the Real Nightly Cost | /vegas/resort-fees.html |
| pin-4-checklist.svg | 5 Costs Vegas Hotels Add After the Advertised Rate | /vegas/costs-and-tipping.html |

**Description template** (edit per pin):
> Planning a Las Vegas trip in 2026? The advertised room rate isn't what you pay. We compared the resort fee, parking, and tax at all 56 major Vegas hotels in one sortable table — no BS, independently verified. #lasvegas #vegastrip #travelbudget #lasvegastips #resortfees

**Future pin ideas (Claude can generate on request):** per-hotel "true cost" cards (56 of them = 56 pins), bachelor-party budget card, month-by-month "cheapest time to visit Vegas" card, show-price comparison card.

## 2. Reddit / forums (drafts — post from your own account [YOU])

Rules: only answer real questions, lead with the actual answer, mention the site once at most, disclose it's yours ("I run a small independent Vegas guide site"). r/vegas and r/LasVegas ban drive-by promo; helpful-first accounts survive.

**Draft A — for any "why is my hotel bill higher than the rate?" thread:**
> That'll be the resort fee plus its tax — it's charged per night at check-out, on top of the advertised rate. Most Strip properties are in the $37–$55/night range right now, and parking is usually separate ($15–$23 self, $35–$50 valet). Before booking anywhere, add (rate + resort fee + parking) × nights to compare hotels honestly. I maintain a free sortable table of all 56 major Vegas hotels' fees and parking (I run a small independent guide site, no paywall): countrymantravels.com/vegas/resort-fees.html — happy to answer specifics either way.

**Draft B — for "first bachelor party in Vegas, tips?" threads:**
> The three mistakes every group makes: no anchor reservations (lock one day thing + one night thing per day, keep the rest loose), splitting across two hotels (regroups eat 45 min every time), and no agreed per-head budget before flights are booked. Club tables run $1k+ minimums on weekends — for most groups a hosted club crawl beats one table. Happy to share the fuller checklist if useful.

**Draft C — for "is [hotel] worth it?" threads:** answer with that hotel's actual fee/parking/room-size numbers from the site, then link the hotel's field-guide page only if someone asks for more.

## 3. Digital PR — the resort-fee data story

**The asset:** "State of Las Vegas Resort Fees, 2026" — average fee ~$44/night across 56 hotels, ranging $25–$55; add tax and self-parking and the average hidden add-on is ~$65/night, ~$195 on a 3-night stay. (Exact figures: see /vegas/resort-fees.html.)

**Who to pitch [YOU sends, Claude drafts more]:** local first (Las Vegas Review-Journal tourism desk, KTNV/KLAS consumer reporters, Vital Vegas), then travel-consumer writers (The Points Guy, Frommer's, USA Today Travel, View From The Wing). Resort-fee outrage is an evergreen story; journalists need current numbers and yours are compiled and dated.

**Pitch email draft:**
> Subject: Data: the average Vegas resort fee just hit $XX/night (all 56 hotels compared)
>
> Hi [name] — I publish Countryman Travels, an independent Las Vegas guide. We just finished manually checking the resort fee, fee tax, and parking price at all 56 major Vegas hotels (August 2026). A few numbers your readers might care about: the average fee is now $XX/night before tax; the highest is $XX at [hotel]; a "cheap" 3-night stay quietly adds ~$XXX in fees and parking. Full sortable table here (free, no paywall): countrymantravels.com/vegas/resort-fees.html. Happy to share the underlying data, or pull any comparison you'd find useful. — Jared Countryman

## 4. Email list

Capture forms are now live on: homepage, Vegas index, hotels, costs & tipping, trip builder, resort fees, bachelor party. **[YOU]:** in MailerLite, make sure the welcome automation actually delivers the promised "Strip Walking Map + Resort Fee Cheat Sheet" (Claude can generate the printable PDF cheat sheet from the fee table on request), and confirm `MAILERLITE_API_KEY` is set in Cloudflare Pages → Settings → Environment variables (production).

## 5. Amazon flywheel (when books launch)

Each book's back matter should point to a QR landing page that captures email AND cross-sells the other book. The bachelor book should QR to /vegas/bachelor-party.html (live now). Book listing optimization (title keywords, A+ content) — ask Claude when the listings are up.

## 6. What NOT to spend time on now

- Paid ads (violates the $0 constraint; margins don't support it pre-traffic)
- Instagram/TikTok video (high effort, wrong intent — Pinterest/search users are planning, not scrolling)
- Link exchanges / guest-post farms (Google penalty risk, off-brand)
