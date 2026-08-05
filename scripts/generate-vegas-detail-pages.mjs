import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getAffiliateLink } from './lib/affiliate-links.mjs';

const root = new URL('..', import.meta.url).pathname;
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const slugify = (value) => value.toLowerCase().replaceAll('&', 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const venueLinks = {
  'Treasure Island': 'https://www.treasureisland.com/entertainment/',
  'Bellagio': 'https://bellagio.mgmresorts.com/en/entertainment.html',
  'MGM Grand': 'https://mgmgrand.mgmresorts.com/en/entertainment.html',
  'New York-New York': 'https://newyorknewyork.mgmresorts.com/en/entertainment.html',
  'Mandalay Bay': 'https://mandalaybay.mgmresorts.com/en/entertainment.html',
  'Wynn': 'https://www.wynnlasvegas.com/entertainment',
  'Caesars Palace': 'https://www.caesars.com/caesars-palace/shows',
  'The Venetian': 'https://www.venetianlasvegas.com/entertainment.html',
  'The LINQ': 'https://www.caesars.com/linq/shows',
  'Luxor': 'https://luxor.mgmresorts.com/en/entertainment.html',
  "Harrah's": 'https://www.caesars.com/harrahs-las-vegas/shows',
  'Planet Hollywood': 'https://www.caesars.com/planet-hollywood/shows',
  'Horseshoe': 'https://www.caesars.com/horseshoe-las-vegas/shows',
  'Flamingo': 'https://www.caesars.com/flamingo-las-vegas/shows',
  'Rio': 'https://www.riolasvegas.com/entertainment/',
  'Excalibur': 'https://excalibur.mgmresorts.com/en/entertainment.html',
  'The STRAT': 'https://www.thestrat.com/entertainment',
  'SAHARA': 'https://www.saharalasvegas.com/entertainment',
  'Circus Circus': 'https://www.circuscircus.com/entertainment/',
  'Sphere': 'https://www.thesphere.com/shows',
  'The Colosseum at Caesars Palace': 'https://www.caesars.com/caesars-palace/shows/the-colosseum',
  'International Theater at Westgate': 'https://www.westgateresorts.com/las-vegas/entertainment/',
  'PH Live at Planet Hollywood': 'https://www.caesars.com/planet-hollywood/shows',
  'Dolby Live at Park MGM': 'https://parkmgm.mgmresorts.com/en/entertainment/dolby-live.html',
  "Harrah's Showroom": 'https://www.caesars.com/harrahs-las-vegas/shows',
  'Fontainebleau': 'https://www.fontainebleaulasvegas.com/entertainment/'
  ,'Nathan Burton Theater': 'https://nathanburton.com/'
};

const recurringShows = `Mystere|Treasure Island|Sun/Mon/Tue/Fri/Sat|Cirque and acrobatics
The Wizard of Oz at Sphere|Sphere|Select dates; verify current schedule|Immersive film experience
O by Cirque du Soleil|Bellagio|Wed/Thu/Fri/Sat/Sun|Cirque and acrobatics
KA by Cirque du Soleil|MGM Grand|Sat/Sun/Mon/Tue/Wed|Cirque and acrobatics
Mad Apple by Cirque du Soleil|New York-New York|Fri/Sat/Sun/Mon/Tue|Cirque and variety
Michael Jackson ONE by Cirque du Soleil|Mandalay Bay|Thu/Fri/Sat/Sun/Mon|Music and acrobatics
Awakening|Wynn|Sun/Mon/Tue/Fri/Sat|Large-scale theatrical spectacle
ABSINTHE|Caesars Palace|Mon-Sun|Adult circus and variety
Atomic Saloon Show|The Venetian|Tue/Wed/Thu/Fri/Sat|Adult comedy and variety
X Rocks|Horseshoe|Select dates; verify current schedule|Adult rock revue
Jabbawockeez|MGM Grand|Most days except Tue|Dance production
Tape Face|MGM Grand|Select dates; verify current schedule|Visual comedy and variety
Blue Man Group|Luxor|Daily|Music, comedy, and multimedia
Shin Lim|The Venetian|Thu/Fri/Sat/Sun/Mon|Close-up magic
X Country|Harrah's|Mon-Sun|Adult country revue
X Burlesque|Flamingo|Select dates; verify current schedule|Adult burlesque revue
Zombie Burlesque|Planet Hollywood|Mon/Tue/Wed/Thu/Fri/Sat|Adult comedy burlesque
Potted Potter|Horseshoe|Mon-Sun|Comedy parody
Piff the Magic Dragon Show|Flamingo|Thu/Fri/Sat/Sun/Mon/Tue|Comedy magic
Penn & Teller|Rio|Sun/Thu/Fri/Sat|Comedy magic
Mac King Comedy Magic Show|Excalibur|Tue/Wed/Thu/Fri/Sat|Family-friendly comedy magic
Carrot Top|Luxor|Mon/Tue/Wed/Thu/Fri/Sat|Prop comedy
Banachek's Mind Games|The STRAT|Mon/Wed/Thu/Fri/Sat/Sun|Mentalism
PARANORMAL - Mind Reading Magic|Horseshoe|Mon-Sun|Mentalism and magic
Criss Angel MINDFREAK|Planet Hollywood|Select dates; verify current schedule|Large-scale magic production
Colin Cloud: Mastermind|Harrah's|Select dates; verify current schedule|Mentalism
Donny Osmond|Harrah's|Tue/Wed/Thu/Fri/Sat|Music residency
ROUGE - The Sexiest Show in Vegas|The STRAT|Mon-Sun|Adult revue
Fantasy|Luxor|Mon-Sun|Adult revue
Thunder From Down Under|Excalibur|Mon-Sun|Adult revue
Chippendales|Planet Hollywood|Wed/Thu/Fri/Sat/Sun|Adult revue
Mat Franco - Redefining Magic|The LINQ|Mon/Tue/Thu/Fri/Sat/Sun|Magic production
Wayne Newton|Flamingo|Mon/Wed/Sat|Music residency
RuPaul's Drag Race Live!|Flamingo|Thu/Fri/Sat/Sun/Mon|Drag and variety
MAGIC MIKE LIVE|SAHARA|Wed/Thu/Fri/Sat/Sun|Adult dance revue
Tournament of Kings|Excalibur|Mon/Wed/Thu/Fri/Sat/Sun|Dinner tournament spectacle
Nathan Burton Comedy Magic|Nathan Burton Theater|Select dates; verify current schedule|Family-friendly comedy magic
Popovich Comedy Pet Theater|Planet Hollywood|Mon-Sun|Family comedy and animal acts
Menopause The Musical|Harrah's|Mon-Sun|Musical comedy
MJ LIVE (Michael Jackson Tribute)|SAHARA|Mon-Sun|Michael Jackson tribute concert
V - The Ultimate Variety Show|Planet Hollywood|Mon-Sun|Variety production
VEGAS! The Show|Planet Hollywood|Mon-Sun|Vegas history musical revue
The Mentalist|Planet Hollywood|Mon/Tue/Thu/Fri/Sat/Sun|Mentalism
iLuminate|The STRAT|Mon/Wed/Thu/Fri/Sat/Sun|Light, dance, and technology
The Australian Bee Gees Show|Excalibur|Mon/Wed/Thu/Fri/Sat/Sun|Bee Gees tribute concert
LA Comedy Club|The STRAT|Mon-Sun|Stand-up comedy club
Brad Garrett's Comedy Club|MGM Grand|Mon-Sun|Stand-up comedy club
Circus Acts at the Carnival Midway|Circus Circus|Mon-Sun|Free circus acts`.split('\n').map((line) => {
  const [name, venue, schedule, type] = line.split('|');
  return { name, venue, schedule, type, kind: 'Recurring show' };
});

const residencies = `Backstreet Boys: Into The Millennium|Sphere|Select dates through August 2026
Kelly Clarkson: Studio Sessions|The Colosseum at Caesars Palace|Select dates July-August 2026
Barry Manilow: The Hits Come Home|International Theater at Westgate|Select dates July-December 2026
Rod Stewart: The Encore Shows|The Colosseum at Caesars Palace|Select dates August 2026
Jeezy: Legend of a Snowman|PH Live at Planet Hollywood|Select dates July-August 2026
The Eagles|Sphere|Select dates through November 2026
Metallica|Sphere|Select dates through March 2027
New Kids On The Block: The Right Stuff Residency|Dolby Live at Park MGM|Select dates through October 2026
Donny Osmond|Harrah's Showroom|Select dates September-December 2026
Scorpions|PH Live at Planet Hollywood|Select dates September-October 2026
Sammy Hagar: The Best of All Worlds Tour Residency|Dolby Live at Park MGM|Select dates September 2026
Carin Leon|Sphere|Select dates September 2026
Billy Idol|Fontainebleau|Select dates October 2026`.split('\n').map((line) => {
  const [name, venue, schedule] = line.split('|');
  return { name, venue, schedule, type: 'Limited 2026 concert residency', kind: '2026 residency or event', pageSlug: name === 'Donny Osmond' ? 'donny-osmond-residency' : slugify(name) };
});

const attractions = `Bellagio Conservatory and Fountains|Center Strip|Free signature sights|Pair the indoor conservatory with a fountain viewing window. Expect seasonal changeovers and crowds; use an off-peak morning for photographs.|https://bellagio.mgmresorts.com/en/entertainment/conservatory-botanical-garden.html
Welcome to Fabulous Las Vegas Sign|South Strip|Classic photograph|The median site is exposed to heat and queues. Use the designated pedestrian access and never stop illegally on Las Vegas Boulevard.|https://www.visitlasvegas.com/things-to-do/attractions/welcome-to-fabulous-las-vegas-sign/
High Roller|Center Strip|Observation wheel|A timed rotation works before sunset or after dinner. Compare daytime, sunset, and nighttime value.|https://www.caesars.com/linq/things-to-do/high-roller
Sphere Experience and Events|East of North-Center Strip|Immersive venue|The exterior is free to view; interior experiences require production-specific tickets and can involve intense sound and imagery.|https://www.thesphere.com/
AREA15|West of Strip|Entertainment complex|The campus combines free-to-enter and ticketed components with separate operators, hours, and age rules.|https://area15.com/
Omega Mart|AREA15|Immersive art and narrative|Expect extensive walking, hidden spaces, sensory intensity, and an experience that rewards curiosity over a checklist.|https://meowwolf.com/visit/las-vegas
The Neon Museum|Downtown|History and design|Day and night visits feel different. Reserve ahead, dress for the weather, and obtain permission before commercial photography.|https://www.neonmuseum.org/
John Wick Experience|AREA15|Immersive action-world attraction|A live, story-driven experience with timed entry and theatrical interaction. Confirm the current age guidance, arrival time, accessibility information, and what is included before booking.|https://johnwickexperience.com/
SkyJump Las Vegas|The STRAT|Controlled thrill jump|This is a harnessed jump from The STRAT with strict height, weight, weather, and medical restrictions. Review the operator requirements and cancellation terms before reserving.|https://www.strat.com/skyjump
The Mob Museum|Downtown|History museum|A substantial indoor museum covering organized crime, law enforcement, and civic history. Give it more than a rushed hour.|https://themobmuseum.org/
Springs Preserve|West of Downtown|Nature, history, and family learning|Museums, gardens, trails, train rides, Boomtown, and seasonal features make this a flexible half-day.|https://www.springspreserve.org/
DISCOVERY Children's Museum|Downtown|Hands-on children's learning|Three floors support climbing, building, science, water play, and imaginative performance.|https://www.discoverykidslv.org/
Adventuredome|Circus Circus|Indoor amusement park|Climate control is valuable in summer. Check height rules, ride closures, noise, and wristband pricing before purchase.|https://www.circuscircus.com/attractions/adventuredome/
Shark Reef Aquarium|Mandalay Bay|Aquarium|A practical South Strip family anchor and indoor heat escape. Buy it for a South Strip day.|https://mandalaybay.mgmresorts.com/en/entertainment/shark-reef-aquarium.html
Pinball Hall of Fame|South Strip corridor|Playable arcade|Rows of machines create a flexible multigenerational stop with pay-as-you-play spending.|https://pinballhall.org/
Ethel M Chocolate Factory and Cactus Garden|Henderson|Free factory viewing and garden|Combine this stop with Henderson dining or another southeast-Valley plan rather than a costly one-purpose ride.|https://www.ethelm.com/en/visit-us.html
Atomic Museum|East of Strip|Science and history|Exhibits examine nuclear testing, national security, and Nevada history; allow time to read.|https://www.atomicmuseum.vegas/
Las Vegas Natural History Museum|Downtown|Family museum|Dinosaurs, wildlife, geology, and hands-on exhibits make a lower-pressure indoor option.|https://www.lvnhm.org/
Zak Bagans' The Haunted Museum|Downtown edge|Horror and paranormal collection|An intense guided experience with strict age and health warnings. It is not a casual family attraction.|https://thehauntedmuseum.com/
Madame Tussauds|Venetian area|Wax attraction|A predictable indoor, photo-focused stop that fits a North-Center Strip route. Treat combo tickets skeptically.|https://www.madametussauds.com/las-vegas/
Gondola Rides|The Venetian|Themed ride|Indoor and outdoor routes differ; weather and demand can affect operation.|https://www.venetianlasvegas.com/resort/attractions/gondola-rides.html
Fly LINQ|LINQ Promenade|Zipline|Review position, height, weight, and weather restrictions before purchasing a nonrefundable time.|https://www.caesars.com/linq/things-to-do/fly-linq-zipline
Big Apple Coaster|New York-New York|Roller coaster|Convenient for an arena or South-Center Strip day but prone to weather and maintenance changes.|https://newyorknewyork.mgmresorts.com/en/entertainment/big-apple-coaster.html
The STRAT Tower Attractions|North Gateway|Views and thrill rides|Observation and ride products have separate rules, weather limits, and price structures. Build around sunset.|https://www.thestrat.com/attractions
STRAT Tower Observation Deck|North Gateway|Observation deck|A high-elevation viewpoint with weather, crowd, and timed-entry considerations. Compare daytime, sunset, and nighttime timing before booking.|https://www.thestrat.com/attractions
Downtown Container Park|Fremont East|Shops, food, and family hours|Atmosphere shifts from daytime family use to later adult-oriented programming.|https://downtowncontainerpark.com/
Fremont Street Experience|Downtown|Free canopy and street entertainment|Light shows, live stages, street performers, casinos, and heavy crowds. Pick a regroup point.|https://vegasexperience.com/
Arts District|Downtown edge|Galleries, vintage, breweries, and murals|A neighborhood, not one attraction. Business hours and event days shape the visit.|https://www.visitlasvegas.com/things-to-do/arts-culture/las-vegas-arts-district/
Red Rock Canyon|West Valley|Scenic drive and hiking|Reservations, heat, trail conditions, and limited cell service require official planning. Start early and carry water.|https://www.redrockcanyonlv.org/
Valley of Fire|Northeast of Las Vegas|State park day trip|Longer driving, exposed terrain, extreme heat, and seasonal closures make this a serious outing.|https://parks.nv.gov/parks/valley-of-fire
Infinity Museum|East of Strip|Immersive photo museum|Reflective surfaces, footwear rules, and timed-entry logistics are part of the visit. Confirm current guest guidelines and accessibility information before booking.|https://infinitymuseum.com/
Cartzilla Giant Shopping Cart Limo Ride|Las Vegas Strip|Novelty sightseeing ride|Treat this as a short, photo-forward experience. Confirm pickup, route, passenger limits, weather policy, and all inclusions before booking.|https://www.visitlasvegas.com/things-to-do/
Las Vegas VIP Club Crawl with Party Bus|Las Vegas Strip|Adult nightlife experience|Venue lineup, dress codes, age verification, pickup times, drink inclusions, and entry policies can change by date. Confirm every condition before booking.|https://www.visitlasvegas.com/experience/post/las-vegas-nightlife-guide/
Death Valley National Park Day Trip|California day trip|Guided national-park day trip|This is a long day in extreme desert conditions. Check current park alerts, temperature, road access, vehicle requirements, and tour inclusions before committing.|https://www.nps.gov/deva/
Grand Canyon West Rim Helicopter Tour|Las Vegas departure|Helicopter sightseeing day trip|Flight conditions, passenger weight limits, landing details, pickup timing, and cancellation rules vary by operator. Read the current product terms before booking.|https://www.nps.gov/grca/index.htm
Grand Canyon West Rim Tour|Las Vegas departure|Guided canyon day trip|This is a full-day outing with route, pickup, walking, and optional Skywalk details that vary by operator. Confirm every inclusion, weather policy, and return time before booking.|https://www.nps.gov/grca/index.htm
Bryce Canyon and Zion National Parks Day Tour|Utah day trip|Guided national-parks day trip|This is a long, time-zone-sensitive outing from Las Vegas. Confirm pickup, walking surfaces, weather, park access, and every inclusion before committing.|https://www.nps.gov/brca/
Elvis-Themed Wedding or Vow Renewal|Downtown Las Vegas|Ceremony or vow-renewal experience|Packages can differ materially in ceremony length, guest limits, photography, limousine service, legal paperwork, and renewal-only options. Review the exact inclusions before reserving.|https://www.gracelandchapel.com/
Off-Road UTV and 3-Gun Shooting Package|Las Vegas desert area|Outdoor driving and shooting experience|This adult-oriented activity has safety briefings, age and licence rules, attire requirements, and strict operator conditions. Review the current requirements before booking.|https://adrenalinemountain.com/combos.html
Machine Gun Experience with Military Humvee|Las Vegas desert area|Military vehicle and shooting experience|This adult-oriented activity has strict age, identification, safety, attire, and operator requirements. Confirm the exact firearms, military-vehicle component, transfer details, and all inclusions before booking.|https://www.battlefieldvegas.com/
Sniper Experience Outdoor Shooting Package|Las Vegas desert area|Outdoor shooting experience|This adult-oriented activity has strict safety briefings, age and identification rules, attire requirements, and operator conditions. Review the current requirements and all inclusions before booking.|https://adrenalinemountain.com/
Hoover Dam|Southeast day trip|Engineering and history|Security screening, parking, tour availability, and hot exposed walking shape the visit. Pair it with Boulder City.|https://www.usbr.gov/lc/hooverdam/
Lake Mead|Southeast day trip|Recreation and scenic driving|Distances are large and water conditions, heat, fees, and closures matter. Download maps and use life jackets.|https://www.nps.gov/lake/
Antelope Canyon & Horseshoe Bend Day Tour|Arizona day trip|Guided canyon and overlook day trip|This is a very long, time-zone-sensitive outing from Las Vegas. Confirm pickup, walking surfaces, weather, and every inclusion before committing.|https://www.nps.gov/glca/planyourvisit/horseshoe-bend.htm
Emerald Cave Kayak Tour|Colorado River day trip|Guided kayaking tour|Heat, water conditions, launch logistics, swimming ability, and return timing matter more than the headline price. Confirm the exact launch point and equipment included.|https://www.nps.gov/lake/
Las Vegas Helicopter Night Flight|Las Vegas Strip|Aerial sightseeing flight|Flight paths, weather, passenger weight limits, pickup, check-in, and cancellation terms vary by operator. Read the current product terms before booking.|https://www.visitlasvegas.com/things-to-do/attractions/
Big Bus Las Vegas Night Tour|Las Vegas Strip|Night sightseeing bus tour|Open-top routes are exposed to weather and traffic. Confirm the pickup location, route, duration, and what happens if conditions change.|https://www.bigbustours.com/en/las-vegas/las-vegas-bus-tours
Exotic Car Driving Experience|Las Vegas Motor Speedway area|Supercar driving experience|Confirm the track, licence and age requirements, insurance terms, vehicle selection, and any required deposit before reserving a driving slot.|https://www.lvms.com/
Seven Magic Mountains|South of Las Vegas|Desert art installation|A colorful outdoor art installation that requires a drive from the Strip and has no shade. Check access, weather, heat, and the exact pickup details before booking any tour.|https://sevenmagicmountains.com/
Universal Horror Unleashed|AREA15|Immersive horror attraction|A ticketed horror experience with intense themes, sound, lighting, and live performers. Check the operator’s current age guidance, accessibility details, and entry rules before booking.|https://www.universalhorrorunleashed.com/las-vegas/
Titanic: The Artifact Exhibition|Luxor|Historical artifact exhibition|An indoor exhibit centered on Titanic artifacts and passenger stories. Confirm current exhibit hours, age guidance, and any photography restrictions before booking.|https://luxor.mgmresorts.com/en/entertainment/titanic-artifact-exhibition.html
Eiffel Tower Experience|Paris Las Vegas|Observation deck|A timed observation-deck visit with the best value depending on light, weather, and crowd levels. Compare daytime, sunset, and nighttime entry before booking.|https://www.caesars.com/paris-las-vegas/things-to-do/eiffel-tower-viewing-deck
Escape IT Chapter 1|Las Vegas Strip|Immersive horror escape experience|A timed, story-driven escape experience with horror themes and live-performance elements. Check current age guidance, group-size rules, and accessibility details before booking.|https://escapeit.com/
Allegiant Stadium Tours|West of Strip|Guided stadium tour|Tour routes, event-day access, security procedures, and entry times can change. Confirm the exact tour date, bag policy, and accessibility details before booking.|https://www.allegiantstadium.com/stadium-tours/
SAW Escape Experience|Las Vegas Strip|Horror escape room|A timed escape-room experience with intense themes and puzzle-based group participation. Confirm current age guidance, group size, and entry rules before booking.|https://sawescaperoom.com/
Bodies: The Exhibition|Luxor|Human anatomy exhibition|An indoor educational exhibition featuring preserved human specimens. Review the current content guidance, exhibit hours, and photography policy before booking.|https://luxor.mgmresorts.com/en/entertainment/bodies-the-exhibition.html
Play Playground|Las Vegas Strip|Interactive game attraction|A social, ticketed indoor attraction built around physical and digital games. Confirm the current age guidance, accessibility information, and what the selected pass includes before booking.|https://playplayground.com/las-vegas/
Mount Charleston|Northwest day trip|Cooler mountain escape|Elevation changes weather and road conditions sharply; check alerts and carry layers.|https://www.gomtcharleston.com/`.split('\n').map((line) => {
  const [name, location, type, summary, officialUrl] = line.split('|');
  return { name, location, type, summary, officialUrl };
});

const showSummary = (show) => `${show.name} is a ${show.type.toLowerCase()} at ${show.venue}. The book lists this current pattern as ${show.schedule}; confirm the exact date, start time, age policy, seat map, and all-in price before booking.`;
const showDetail = (show) => {
  const tone = show.type.includes('Adult') ? 'This is an adult-oriented choice, so make sure everyone in the group is comfortable with the stated tone and venue rules.' : show.type.includes('Comedy') ? 'Comedy is a flexible evening plan, but material, drink minimums, and late-seating rules can vary by performance.' : show.type.includes('Magic') || show.type.includes('Mentalism') ? 'Magic shows vary from intimate close-up work to larger theatrical staging; read the current age guidance before deciding it is a family fit.' : show.type.includes('Cirque') || show.type.includes('spectacle') ? 'This is best for groups who want visual scale and a production designed around staging, music, movement, and lighting.' : 'This works best when the style, running time, and audience fit are the right match for your group.';
  return `${show.name} is a ${show.type.toLowerCase()} performed at ${show.venue}. ${tone} The guidebook pattern is ${show.schedule}, but Vegas schedules change frequently, so treat it as a planning guide rather than a final confirmation. Keep dinner in the same resort or nearby zone when the ticket has strict late-seating rules, and allow time for the long walk through the property and security.`;
};
const attractionDetail = (item) => `${item.summary} This is a ${item.type.toLowerCase()} in ${item.location}, so build the visit around the full door-to-door block of time rather than the ticket price alone. Before committing, confirm the operator, exact address, timed-entry rules, age or rider restrictions, accessibility information, and refund policy. Keep an indoor or reservation-free backup in the same part of the Valley whenever heat, crowds, or changing conditions could affect the plan.`;
const priceRange = (item, isAttraction = false) => {
  if (isAttraction) return item.type.includes('Free') ? 'Free entry; optional purchases vary' : 'Commonly $20-$80 before taxes and add-ons';
  if (item.kind.includes('2026')) return 'Commonly $75-$400+ before fees';
  if (item.type.includes('Cirque') || item.type.includes('spectacle')) return 'Commonly $75-$250+ before fees';
  if (item.type.includes('Adult')) return 'Commonly $45-$150 before fees';
  return 'Commonly $35-$150 before fees';
};
const categoryOf = { show: 'shows', attraction: 'attractions', wedding: 'weddings' };
const resolveAffiliate = (slot) => {
  const sep = slot.indexOf('-');
  const category = categoryOf[slot.slice(0, sep)];
  const itemSlug = slot.slice(sep + 1);
  return getAffiliateLink('vegas', category, itemSlug);
};
const affiliateCta = (slot, fallbackLabel = 'Find discount tickets') => {
  const affiliate = resolveAffiliate(slot);
  return `<a href="${esc(affiliate.url)}" target="_blank" rel="sponsored noopener" data-affiliate-slot="${slot}" style="background:var(--gold);color:var(--navy)!important;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:9px">${esc(affiliate.label ?? fallbackLabel)} &rarr;</a>`;
};
const affiliateCardLink = (slot) => {
  const affiliate = resolveAffiliate(slot);
  return `<a href="${esc(affiliate.url)}" target="_blank" rel="sponsored noopener" data-affiliate-slot="${slot}" style="font-weight:800;color:var(--gold-dark)">${esc(affiliate.label ?? 'Discount tickets')} &rarr;</a>`;
};
const visualFor = (label, isAttraction = false, officialUrl = '') => {
  const image = officialUrl ? `https://www.google.com/s2/favicons?sz=256&domain_url=${encodeURIComponent(officialUrl)}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect width="1200" height="800" fill="%23101B33"/%3E%3C/svg%3E';
  const value = label.toLowerCase();
  if (value.includes('magic') || value.includes('mentalis')) return { image, color: '#5B2C6F' };
  if (value.includes('comedy') || value.includes('variety') || value.includes('burlesque') || value.includes('revue')) return { image, color: '#B03A2E' };
  if (isAttraction && (value.includes('canyon') || value.includes('fire') || value.includes('charleston') || value.includes('mead') || value.includes('dam'))) return { image, color: '#A04000' };
  if (isAttraction && (value.includes('museum') || value.includes('preserve') || value.includes('district'))) return { image, color: '#1F618D' };
  if (isAttraction) return { image, color: '#117864' };
  return { image, color: '#1A5276' };
};
const page = (title, eyebrow, intro, facts, details, visual, officialUrl, officialText, backHref, backText, affiliateSlot, includeAffiliate = true) => `<!doctype html>
<html lang="en"><head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4QMCMJCHPN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-4QMCMJCHPN');
</script>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Countryman Travels</title><meta name="description" content="${esc(intro)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/style.css?v=20260802d"><script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://countrymantravels.com/"},{"@type":"ListItem","position":2,"name":"Las Vegas","item":"https://countrymantravels.com/vegas/"},{"@type":"ListItem","position":3,"name":${JSON.stringify(title)}}]}</script></head>
<body><div class="global-bar"><a href="/index.html" class="g-brand"><span style="color:var(--gold)">*</span> Countryman Travels</a><div class="g-links"><a href="/index.html">Homepage</a><a href="/about.html">About and contact</a></div></div><nav class="site-nav"><a href="/index.html" class="brand"><span class="dot"></span> Countryman Travels</a><div class="links"><a href="/index.html" class="nav-link">Homepage</a><div class="nav-dropdown"><span class="nav-dropdown-trigger" tabindex="0">Destination hubs <span aria-hidden="true">▾</span></span><div class="nav-dropdown-content"><a href="/vegas/index.html">Las Vegas guidebook</a><a href="/vegas/hotels.html">Hotels and resort fee guide</a><a href="/vegas/shows.html">Shows and nightlife</a><a href="/vegas/dining.html">Dining and bars</a></div></div><a href="/gear.html" class="nav-link">Travel gear</a><a href="/vegas-cards.html" class="nav-link">Credit cards and points</a><a href="/about.html" class="nav-link">About and contact</a><a href="/vegas/hotels.html" class="nav-cta">Compare hotel options</a></div></nav>
<main class="content-wrap" style="padding-top:2rem"><section style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:24px;align-items:stretch"><div><p style="color:var(--gold-dark);font-weight:800;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;margin:0 0 8px">${esc(eyebrow)}</p><h1 style="font-size:36px;margin:0 0 12px;color:var(--navy)">${esc(title)}</h1><p style="font-size:17px;color:var(--text-dim);max-width:780px">${esc(intro)}</p></div><div style="min-height:220px;border-radius:16px;overflow:hidden;background:${visual.color}"><img src="${visual.image}" alt="${esc(title)} planning guide" style="width:100%;height:100%;min-height:220px;object-fit:cover;mix-blend-mode:luminosity;opacity:.88"></div></section><section class="hotel-info-grid" style="margin:2rem 0">${facts.map(([label, value]) => `<div class="info-card"><h4>${esc(label)}</h4><p>${esc(value)}</p></div>`).join('')}</section><section style="border-left:4px solid ${visual.color};padding:1.2rem 1.4rem;background:#fff;border-radius:0 12px 12px 0;margin:2rem 0"><h2 style="font-size:21px;color:var(--navy);margin:0 0 8px">What to expect</h2><p style="margin:0;color:var(--text-dim);line-height:1.7">${esc(details)}</p></section><section style="background:#F2F8F7;border:1px solid #CBE7E1;border-radius:14px;padding:2rem 1.5rem;text-align:center;margin:2rem 0"><h2 style="color:var(--navy)!important;margin:0 0 8px;font-size:22px">Plan with the official source</h2><p style="color:var(--text-dim);margin:0 0 18px">Verify current hours, restrictions, availability, and final ticket terms before you buy.</p><a href="${esc(officialUrl)}" target="_blank" rel="noopener" class="btn-affiliate-gold" style="background:var(--gold);color:#fff!important;font-weight:800;text-decoration:none;display:inline-block;padding:14px 22px;border-radius:9px">${esc(officialText)} &rarr;</a></section>${includeAffiliate ? `<section style="border:1px solid var(--line);border-radius:12px;padding:1.25rem 1.5rem;margin:2rem 0;background:#fff"><h2 style="font-size:18px;color:var(--navy);margin:0 0 6px">Looking for discount tickets?</h2><p style="margin:0;color:var(--text-dim)">Check this link before you book for available ticket offers.</p><div class="affiliate-notice" role="note"><strong>Affiliate disclosure:</strong> We may earn a commission if you purchase through this link, at no additional cost to you. <a href="/affiliate-disclosure.html">Details</a>.</div>${affiliateCta(affiliateSlot, 'View discount tickets')}</section>` : ''}<p><a href="${esc(backHref)}" style="font-weight:700;color:var(--navy)">&larr; ${esc(backText)}</a></p></main><footer class="site-footer"><div class="footer-bottom"><span>&copy; 2026 Countryman Travels. Independent travel guidebooks.</span><span><a href="/about/methodology.html">Data methodology</a> · <a href="/affiliate-disclosure.html">Affiliate disclosure</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></span></div></footer><div class="mobile-sticky-cta"><span>Compare Vegas hotel options before you book.</span><a href="/vegas/hotels.html">Compare rates</a></div></body></html>`;

const showCards = (shows) => shows.map((show) => { const visual = visualFor(show.type); const slot = `show-${show.pageSlug ?? slugify(show.name)}`; return `<div class="card" style="display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;border-top:5px solid ${visual.color}"><img src="${visual.image}" alt="${esc(show.type)} in Las Vegas" loading="lazy" style="width:calc(100% + 2.5rem);height:130px;object-fit:cover;margin:-1.25rem -1.25rem 16px;filter:saturate(.82)"><div><div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">${esc(show.kind)} · ${esc(show.venue)}</div><h3 style="margin:0 0 8px;color:var(--navy)">${esc(show.name)}</h3><p style="font-size:13.5px;color:var(--text-dim);margin:0 0 14px">${esc(show.type)}. ${esc(show.schedule)}.</p></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px"><a href="${venueLinks[show.venue]}" target="_blank" rel="noopener" style="font-weight:800;color:var(--navy)">Official site</a>${affiliateCardLink(slot)}<a href="/vegas/shows/${show.pageSlug ?? slugify(show.name)}.html" style="font-weight:800;color:${visual.color}">Details &rarr;</a></div></div>`; }).join('');
const attractionCards = attractions.map((item) => { const visual = visualFor(item.type, true); const slot = `attraction-${slugify(item.name)}`; return `<div class="card" style="display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;border-top:5px solid ${visual.color}"><img src="${visual.image}" alt="${esc(item.type)} in Las Vegas" loading="lazy" style="width:calc(100% + 2.5rem);height:130px;object-fit:cover;margin:-1.25rem -1.25rem 16px;filter:saturate(.82)"><div><div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">${esc(item.location)} · ${esc(item.type)}</div><h3 style="margin:0 0 8px;color:var(--navy)">${esc(item.name)}</h3><p style="font-size:13.5px;color:var(--text-dim);margin:0 0 14px">${esc(item.summary)}</p></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px"><a href="${item.officialUrl}" target="_blank" rel="noopener" style="font-weight:800;color:var(--navy)">Official site</a>${affiliateCardLink(slot)}<a href="/vegas/attractions/${slugify(item.name)}.html" style="font-weight:800;color:${visual.color}">Details &rarr;</a></div></div>`; }).join('');
const weddingOffers = [
  { name: 'Get Married at the Fabulous Las Vegas Sign', type: 'Sign ceremony and photo experience', summary: 'A compact ceremony-and-photos option at the iconic sign. Confirm transportation, officiant, photography, legal-license requirements, and the exact duration before booking.', officialUrl: 'https://www.vegasweddings.com/', slot: 'wedding-las-vegas-sign' },
  { name: 'World-Famous Drive-Up Wedding', type: 'Drive-up chapel ceremony', summary: 'A drive-up format can be convenient for a small group, but package details, guest limits, legal paperwork, photography, and timing vary. Verify every inclusion before reserving.', officialUrl: 'https://www.alittlewhitechapel.com/', slot: 'wedding-drive-up' },
  { name: 'A Special Memory Wedding Chapel', type: 'Chapel wedding ceremony', summary: 'A chapel ceremony package may include different combinations of officiant service, flowers, photos, transport, and legal filing. Confirm the exact package and cancellation terms before booking.', officialUrl: 'https://aspecialmemory.com/', slot: 'wedding-special-memory' },
  { name: 'Signature Bliss Wedding and Vow Renewal', type: 'Chapel wedding or vow renewal', summary: 'A chapel package may combine ceremony service with optional flowers, photos, transportation, or legal filing. Review the exact package, guest policy, and cancellation terms before reserving.', officialUrl: 'https://www.blisschapel.com/', slot: 'wedding-bliss-chapel' }
];
const weddingCards = weddingOffers.map((offer) => `<div class="card" style="display:flex;flex-direction:column;justify-content:space-between;border-top:5px solid #B03A2E"><div><div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Las Vegas wedding · ${esc(offer.type)}</div><h3 style="margin:0 0 8px;color:var(--navy)">${esc(offer.name)}</h3><p style="font-size:13.5px;color:var(--text-dim);margin:0 0 14px">${esc(offer.summary)}</p></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">${affiliateCardLink(offer.slot)}<a href="${esc(offer.officialUrl)}" target="_blank" rel="noopener" style="font-weight:800;color:var(--navy)">Official site</a></div></div>`).join('');

mkdirSync(join(root, 'vegas', 'shows'), { recursive: true });
mkdirSync(join(root, 'vegas', 'attractions'), { recursive: true });
for (const show of [...recurringShows, ...residencies]) {
  const visual = visualFor(show.type, false, venueLinks[show.venue]);
  writeFileSync(join(root, 'vegas', 'shows', `${show.pageSlug ?? slugify(show.name)}.html`), page(show.name, `${show.kind} · ${show.venue}`, showDetail(show), [['Where', show.venue], ['Format', show.type], ['Ticket price range', priceRange(show)], ['Schedule noted in the guidebook', show.schedule]], showDetail(show), visual, venueLinks[show.venue], 'Official venue and tickets', '/vegas/shows.html', 'Back to all shows', `show-${show.pageSlug ?? slugify(show.name)}`));
}
for (const item of attractions) {
  const visual = visualFor(item.type, true, item.officialUrl);
  writeFileSync(join(root, 'vegas', 'attractions', `${slugify(item.name)}.html`), page(item.name, `${item.location} · ${item.type}`, attractionDetail(item), [['Where', item.location], ['What it is', item.type], ['Ticket price range', priceRange(item, true)], ['Before you go', 'Confirm current hours, entry rules, accessibility, and refund terms.']], attractionDetail(item), visual, item.officialUrl, item.type.includes('Free') ? 'Official visitor information' : 'Official site and tickets', '/vegas/attractions.html', 'Back to all attractions', `attraction-${slugify(item.name)}`));
}

const showsDirectory = page('Las Vegas Shows and Live Entertainment', 'Countryman\'s Vegas Right Now', 'Browse every recurring show and 2026 residency from the guidebook. Every card includes the venue, schedule, a quick read on the experience, and direct planning links.', [], 'Use the categories below to compare location, tone, and current scheduling patterns before you book.', visualFor('live entertainment'), 'https://www.visitlasvegas.com/shows-events/', 'Official Las Vegas event calendar', '/vegas/attractions.html', 'Browse attractions', 'shows-directory', false).replace('<p><a href="/vegas/attractions.html"', `<h2 style="color:var(--purple);margin-top:2rem">Recurring productions</h2><div class="card-grid">${showCards(recurringShows)}</div><h2 style="color:var(--purple);margin-top:2.5rem">Selected 2026 residencies and events</h2><div class="card-grid">${showCards(residencies)}</div><p><a href="/vegas/attractions.html"`);
writeFileSync(join(root, 'vegas', 'shows.html'), showsDirectory);
const attractionsDirectory = page('Las Vegas Attractions and Free Experiences', 'Countryman\'s Vegas Right Now', 'Browse the complete attraction directory from the guidebook. Every card includes a quick planning description and direct links for the next step.', [], 'Choose the experience that fits your route, energy level, and time of day, then verify live details with the official operator.', visualFor('attractions', true), 'https://www.visitlasvegas.com/things-to-do/attractions/', 'Official Las Vegas attractions calendar', '/vegas/shows.html', 'Browse shows', 'attractions-directory', false).replace('<p><a href="/vegas/shows.html"', `<h2 style="color:var(--purple);margin-top:2rem">Attraction directory</h2><div class="card-grid">${attractionCards}</div><p><a href="/vegas/shows.html"`);
writeFileSync(join(root, 'vegas', 'attractions.html'), attractionsDirectory);
const weddingsPage = page('Las Vegas Weddings and Vow Renewals', 'Countryman\'s Vegas Right Now', 'Compare wedding and vow-renewal formats for a Las Vegas celebration, from iconic-sign photos to chapel and drive-up ceremonies. Confirm every legal, guest, photography, transportation, and cancellation detail directly with the operator before you book.', [], 'Start with the format that suits your group and timeline, then verify the exact package, legal requirements, guest policy, and what happens if plans change.', visualFor('wedding celebration'), 'https://www.visitlasvegas.com/weddings/', 'Official Las Vegas wedding planning', '/vegas/index.html', 'Back to Vegas guide', 'weddings-directory', false).replace('<p><a href="/vegas/index.html"', `<div class="affiliate-notice" role="note"><strong>Affiliate disclosure:</strong> Countryman Travels may earn a commission if you book through commercial links on this page, at no additional cost to you. Recommendations are independently selected. <a href="/affiliate-disclosure.html">How our links work</a>.</div><h2 style="color:var(--purple);margin-top:2rem">Wedding and vow-renewal options</h2><div class="card-grid">${weddingCards}</div><p><a href="/vegas/index.html"`);
writeFileSync(join(root, 'vegas', 'weddings.html'), weddingsPage);

console.log(`Generated ${recurringShows.length + residencies.length} show pages and ${attractions.length} attraction pages.`);
