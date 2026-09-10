# Project Summary: Tripwaley

Last updated: 2026-09-11

## Project Overview
Tripwaley is a production-grade travel booking website for a premium, group-departure travel brand in India. It is a Next.js 16 site with 3D/scroll-driven visuals (React Three Fiber, GSAP, Lenis), city-aware pricing, a lead-capture booking flow, and a full custom admin panel (CMS-style) so the owner can edit trips, prices, departures, cities, media, reviews, and bookings without touching code. There is no database — everything is stored in JSON files under `data/`.

## Start here (new session? read this first)
1. `AGENTS.md` — **this Next.js version has breaking changes.** Read the relevant guide in
   `node_modules/next/dist/docs/` before relying on assumed framework behaviour. This has bitten
   real work: `sitemap.ts` was silently static, metadata routes ignore the layout's `force-dynamic`.
2. **Standing rule:** never push to GitHub without stating the plan and getting an explicit yes.
3. Two data copies, and confusing them causes real bugs: `src/data/catalog.json` is the SEED baked
   into the Docker image; `data/catalog.json` is the LIVE catalog on the server volume that the
   admin panel edits. They diverge, and that divergence is deliberate — see the seed-guard entry.
4. Money code is tested first, `node:assert` scripts, no test runner installed:
   `node scripts/test-money.mjs`, `test-seed-guard.mjs`, `test-gateway-config.mjs`.
5. Design spec for the payment work: `docs/superpowers/specs/2026-09-05-phonepe-payments-design.md`.

## Current Status
- The site is **live in production** at `tripwaley.com`, deployed on a Hostinger VPS through Dokploy. It builds and deploys automatically from GitHub — every push to the `main` branch triggers a new deploy.
- Homepage, `/trips`, `/trips/[slug]`, `/from/[city]`, `/destinations`, `/collections`, `/about`, `/vibe-check`, `/stories` pages all exist and pull from the JSON data layer.
- Admin panel lives at `/admin` (login at `/admin/login`), protected by a password-hash + session-cookie auth system. Admin edits (prices, packages, photos, reviews, settings) now show up on the live site right away — this was broken until today's fix, see below.
- **Payments are LIVE** (verified on production 2026-09-05): PhonePe Standard Checkout V2 takes a
  5% seat hold + 5% GST on that hold. Credentials are set from Admin → Payments, currently pointed
  at PhonePe's **sandbox** — real cards are not charged until `env` is switched to production.
- The booking ladder is three stages, and only the first happens online: 5% (+GST) holds the seat →
  the team collects the balance of the 20% advance offline about a week out → the rest at departure.
  The percentages are `holdPercent` / `gstPercent` / `advancePercent` in Admin → Settings.
- The booking flow is on trip pages AND creator trip pages (`/travel-with/[slug]/[trip]`); both get
  their props from `src/lib/bookingProps.ts` so they cannot drift apart.
- Lead capture still works alongside payment: leads save to `data/bookings.json` and forward to n8n.
- Media management: every image used anywhere on the site is a named "slot". Admin → Media tab lets the owner replace any slot's image, add more images to list-type slots, remove extra images, upload new files, or do a global "replace this file everywhere it's used" swap.
- Phone number capture is enforced server-side — a lead cannot be created without a valid 10-digit Indian mobile number.
- Admin tabs: Dashboard, Content, Pages, Packages, Creators, Captains, Colleges, Coupons, Prices,
  Departures, Cities, Media, Reviews, FAQ, Stories, Settings, **Payments**, Bookings.
- A large "lab" of experimental hero/section designs still exists under `src/components/lab/` and `src/components/lab2/`, viewable at `/lab` and `/lab2` — design sandbox, not part of the live user-facing site.
- **New standing rule from the owner (2026-08-01, still in effect):** never push any change to GitHub directly. Always explain the plan in chat first and wait for a clear "yes" before making or pushing any change.

## Recent Changes

### 2026-09-11 — First real payment taken; email capture, receipt printer, Ask-creator restored

**PhonePe is live on production credentials and a real payment succeeded.** The integration is no
longer theoretical.

Four owner-requested changes:

1. **Email captured, and name/email/phone all required.** Both booking surfaces now demand all three
   — the booking bar's modal and the navbar hold-seat modal — and `/api/pay/create` enforces the
   email server-side, because a browser-side rule is decorative. The address flows onto the order,
   into the bookings log and out to the CRM as `contact.email`, which was previously always null.
2. **The trip name leads the modal.** It used to sit in the same small grey run as the city, date
   and occupancy: the one thing a visitor most needs to confirm before paying was the hardest thing
   to read. It is now full-contrast display type in its own panel.
3. **A receipt printer on the payment-success page.** Adapted from a component the owner supplied.
   The reference needed motion/react and @phosphor-icons — neither installed — so it was rebuilt on
   CSS keyframes and the brand palette rather than adding a second animation runtime beside GSAP for
   one element on one page. The stepped feed is what sells it: a thermal printer advances a line at
   a time, so `steps(1, end)` reads as printing where a smooth translate reads as sliding.
4. **"Ask <creator>" is back in the hero** on both the creator hub and the creator trip page,
   alongside the AskCreator section at the foot of the page rather than instead of it.

**Two things caught before shipping, both of which would have been live faults:**

- The navbar hold-seat modal also posts to `/api/pay/create`. Adding a required email there without
  adding the FIELD would have made that entire booking route 422 at the moment of payment. It now
  collects and sends one.
- The receipt listed "Trip total ₹47,500" above "Coupon − ₹1,500", inviting the reader to subtract
  the discount twice. `quote.totalPaise` is already discounted — the same shape as the webhook
  `money.subtotal` bug from 7 September. It now reads price → coupon → total, which survives being
  read top to bottom.

**Worth knowing: there is no email-sending anywhere in the codebase.** The modal originally said
"your confirmation and invoice go here" and the success page said "your receipt is on its way to
…". Both were promises the system cannot keep, and both were reworded. The address is captured and
reaches the CRM, so a human can send from there — but if automated confirmations are wanted, that is
unbuilt work, not a setting.

### 2026-09-10 — Fixed: I flattened the creator cutouts pulling the Drive images

**My regression, reported by the owner.** The Drive-image pull ran
`sips -s format jpeg` over all 192 files and saved every one as `<id>.jpg`.
JPEG has no alpha channel, so **8 transparent creator cutout portraits were
flattened onto an opaque background** — the cutout is the entire visual device of
the creator pages, and each one became an ordinary rectangular photo.

There was a second, latent half to the same mistake: `localDrivePath()` hardcoded
`.jpg`, so the moment the PNGs were restored under their real extension every one
of them would have 404'd.

**Fixed:**
- `pull-drive-images.mjs` now preserves the source format instead of forcing one.
  Only JPEGs get re-encoded; a PNG is resized and left alone.
- `scripts/repull-png-cutouts.mjs` re-fetched the 13 PNGs by id. It targets ids
  directly rather than crawling, because the site now serves the local copies and
  those Drive URLs are no longer in the HTML to discover.
- `localDriveImages.ts` is a MAP with the real extension, not a Set with an
  assumed one.
- The 5 PNGs that carry no alpha were converted to JPEG, since they lose nothing
  by it — that took the library from 73MB back to 62MB.

**Verified:** all 8 cutouts serve and optimise to AVIF (which carries alpha), and
a cutout rendered against a solid background shows the background through it.

**The lesson, and it generalises:** a format conversion is a lossy decision about
someone else's content, not a compression setting. `-s format jpeg` looked like
"make these smaller" and actually meant "discard every alpha channel on the
site". Anything that rewrites media in bulk has to preserve what it does not
understand. `hasAlpha` is also not the test for "is this a cutout" — several of
these carry a fully-opaque alpha channel; the only real check is looking at one.

### 2026-09-10 — 192 Google Drive images pulled onto our own domain

**The finding.** A cold mobile load of the homepage transferred 2,924KB, of which **2,843KB — 97% —
came from eight images hosted on lh3.googleusercontent.com**. A crawl of all 90 pages found 194
distinct Drive-hosted images site-wide. They are the single biggest performance problem on the site,
and three separate optimisations were all powerless against them:

- next/image cannot resize or re-encode a third-party URL, so they arrive at full original
  resolution. One was displayed at 42x304 and downloaded at 1116x1600.
- Cloudflare cannot cache or compress them, because those bytes never touch our domain.
- They are also a standing availability risk: a revoked share link silently empties the page.

**The fix, and why it needed no data migration.** The obvious approach — rewrite the catalog's image
URLs — does not work here: the catalog lives on the production volume and is admin-owned, so code
cannot edit it. But `normalizeMediaUrl()` in lib/types.ts already resolves every Drive share link at
RENDER time, on every surface. Teaching it to prefer a local copy migrates the whole site without
touching a single row of data, and reverting is deleting one branch.

`scripts/pull-drive-images.mjs` crawls the live sitemap plus both catalogs, downloads each file,
downscales it and writes `src/lib/localDriveImages.ts` — a Set of the ids we hold. An id in that Set
resolves to `/images/library/<id>.jpg`; an id not in it falls through to Drive exactly as before.
The script is idempotent, so re-run it after new photos are added in the admin.

**Result per image** (measured on the worst offender): 853KB straight from Drive, versus **71KB AVIF
at 640px** — the width a phone actually receives — through next/image. Roughly a 12x reduction, and
that is before Cloudflare caches it.

**Two things worth knowing for next time:**
- `sips -s formatOptions 82` does NOT mean quality 82. The first pass "downscaled" 192 files and
  made them 50MB BIGGER, because the numeric argument is not a percentage and it re-encoded at close
  to maximum quality. The named levels behave sensibly: `low`/`normal`/`best`. Settled on
  `-Z 1600 -s formatOptions normal`, which took the library from 128MB to 49MB.
- Committing 49MB of images to the repo is deliberate. The alternative — fetching at build time —
  would make every deploy depend on Google Drive staying reachable, which is the exact fragility
  this change exists to remove. These are source files; next/image serves resized AVIF from them, so
  their size affects the Docker image and nothing a visitor downloads.

**One image could not be pulled**: `111xoaHzaitx0eXEBsS6T95Nxjx4CK97D` (on /trips/udaipur-trip-from-dehradun)
returns HTML rather than an image, which means the share link is restricted. It still loads from
Drive and still costs what it costs. Re-share it publicly and re-run the script.

### 2026-09-10 — Cloudflare migration checked, and agent-readiness implemented

**The migration itself is sound.** Nameservers are on Cloudflare (jerry/novalee.ns.cloudflare.com)
and the edge is live for the domain. Critically, the email records survived the switch — MX
(mx1/mx2.hostinger.com), SPF and DMARC are all present, so grievance@tripwaley.com still delivers.
That was the one thing flagged as able to break PhonePe compliance, and it did not.

**Two DNS records did NOT survive** and are the owner's to re-add in Cloudflare: **DKIM** (no
selector resolves — outbound mail is signed by SPF alone and more likely to be filtered as spam) and
**autodiscover/autoconfig** CNAMEs (Outlook and Thunderbird can no longer auto-configure the
mailbox; manual IMAP settings still work).

**Measurement limitation worth knowing for next time.** From this environment, requests to
tripwaley.com do NOT traverse Cloudflare — no `cf-ray`, and `/cdn-cgi/trace` returns the app's own
404. Asking a Cloudflare edge IP directly with `Host: tripwaley.com` DOES answer with `cf-ray`, so
the proxy is genuinely active; this network path just resolves past it. Edge cache behaviour
therefore cannot be verified from here — check `cf-cache-status` from the owner's own machine or the
Cloudflare dashboard instead.

**One config note.** `next.config.ts` has carried `s-maxage=60, stale-while-revalidate=600` on every
non-admin, non-api route since before the migration, with a comment saying it was "inert until
Cloudflare is in front". It is no longer inert. Edge caching of HTML is now live and is safe by
design: /admin and /api are excluded, so no authenticated page can be shared between visitors.

**Agent-readiness — implemented:**
- **Content Signals** in robots.txt: `search=yes, ai-input=yes, ai-train=no`. Note this deliberately
  differs from Cloudflare's own example, which sets `ai-input=no`. Following that would have undone
  the AI-visibility work: `ai-input` is what lets an assistant read a page to answer someone and
  cite us, and AI referrals to travel are up 194% year on year. `ai-train` is the one that returns
  nothing, so it is the one refused. robots.ts became `robots.txt/route.ts` because
  `MetadataRoute.Robots` cannot emit a directive Next does not know about.
- **Markdown for agents**: `Accept: text/markdown` on `/`, `/trips/*`, `/destinations/*`, `/from/*`
  and `/stories/*` returns clean markdown instead of ~230KB of scroll-driven HTML. Written as a
  renderer per route type (`lib/markdown.ts`) reading the catalog directly, not an HTML converter —
  a converter would reproduce all the navigation noise and would drift whenever the design changed.
- **Link header** `</llms.txt>; rel="describedby"` for discovery.

**Agent-readiness — deliberately NOT implemented, and why:**
- **API catalog (RFC 9727)** and **auth.md**: this site has no public API. Everything under /api is
  internal — admin, payments, lead capture — and is disallowed in robots.txt. Publishing a catalogue
  would point agents at endpoints that take bookings and money, and an auth.md would describe an
  agent-registration flow that does not exist. Both scanners would go green while the site got worse.

**Three traps hit and avoided while building this**, all recorded because they would each have been
a silent production failure:
1. The proxy matcher had to widen from `/admin` + `/api/admin` to the whole site for negotiation to
   see page requests. Its fall-through 401s anything under /api, so widening it naively would have
   made **/api/lead and /api/pay/create return 401 site-wide** — booking would have stopped. Hence
   `guarded()`: anything not explicitly listed must reach `NextResponse.next()` untouched.
2. A `Link: rel="canonical"` header was briefly added alongside `describedby`. A header applies to
   every path its rule matches, so one value would have told all 90 URLs they were the homepage —
   re-creating the exact bug fixed on 7 September. Canonicals stay per-page in `generateMetadata`.
3. `next.config.ts` `headers()` are applied against the ORIGINAL path, BEFORE a proxy rewrite runs,
   so the HTML rule's `s-maxage=60` was landing on markdown responses. Cloudflare does not key its
   cache on an arbitrary `Vary: Accept`, so an agent could have left markdown in the edge cache for
   the next human visitor. Markdown is now `private, no-store`, set on the rewrite itself.

Content negotiation is guarded by `scripts/test-markdown.mjs`, whose real job is the Accept check:
every browser sends a `*/*` wildcard, and treating it as "markdown is acceptable" would serve raw
markdown to every visitor — a total outage that returns HTTP 200. That test also caught a real
false positive in the first implementation (`application/text/markdown-x` matched a `\b` regex), so
the header is now parsed into media types rather than pattern-matched.

### 2026-09-07 — Destination landing pages, and real depth on the city pages

The two items deferred from the SEO audit, now done.

**`/destinations/[slug]` — 14 new landing pages** (18 defined; a destination with no live trip is
never published, so goa/meghalaya/lansdowne/ladakh appear as soon as they have one). This closes the
biggest gap in the audit: the site sold trips but had no page built to answer "spiti valley tour
package" or "kashmir tour package", which are the head terms in this market. It only owned
product-level trip pages, which are long-tail by definition.

Each page carries the trips, dated batches, a per-boarding-city fare table, a planning block
(season / access / what people get wrong), and five FAQs — 538-619 words, with BreadcrumbList,
ItemList and FAQPage schema. Titles lead with the head term and fit: "Spiti Valley Tour Packages —
Group Trips | Tripwaley" (52 chars).

**`src/lib/destinations.ts` is the new taxonomy** and replaces the inline regex list on
/destinations, which had the same two flaws as the old weather lookup: it matched
`name + destination + route` CONCATENATED first-match-wins, and anything it didn't name was
invisible — Kerala, Andaman and both Meghalaya trips appeared nowhere on that page at all. Matching
is now by specificity (destination, then name, then route), a trip can legitimately belong to two
destinations, and `test-destinations.mjs` asserts that EVERY live package matches at least one. That
last assertion is the regression guard: it is what would have caught the original bug.

**City pages went from 221-291 words to 664-773**, all of it derived from that city's own data
rather than written per city: which destinations it is priced to and from what, when its batches
actually leave (counted off the live board), trip-length mix, and four city-specific FAQs. They also
now link to every destination page and to each other.

**An honest caveat on the city pages.** Vocabulary overlap between them is still 95-99%, because
every city is priced to the same 14 destinations — they share a template by design, like any
category page set. What genuinely differs is the facts: prices vary across four to five bands per
package (Manali is ₹7,000 from Delhi, ₹11,500 from Kochi, ₹11,000 from Ranchi), and the departure
mix differs. That is real differentiation, but if Search Console later reports these as thin or
duplicate, the fallback is consolidation to the strongest four cities rather than more words.

### 2026-09-07 — SEO round two: the owner's decisions, implemented

Four of the six items left open by the audit were settled by the owner and are done. Two
(city-page depth, destination landing pages) were deliberately deferred.

- **The two Jibhi trips are genuinely different trips**, so no merge and no redirect. The
  cannibalisation risk was in the TITLES, and it was partly self-inflicted: the length trim added
  earlier that day dropped the nights suffix, which is the only thing distinguishing them. The trim
  now drops the generic "group departure" and KEEPS the nights, so they read as
  `Jibhi-Sojha-Raghupur Fort — 5N / 6D` (47 chars) and `…Short Trip — 4N / 5D` (58). Both under the
  limit, both clearly different trips.
- **Slug renames no longer 404 the old URL.** `applySlugRenames` records a `slugAliases` map on the
  catalog and `/trips/[slug]` issues a 308 to the current slug before falling through to notFound.
  Chained renames collapse (a→b then b→c leaves a pointing at c, never a double hop), and a slug
  reused by a real package releases its alias. This is the infrastructure that makes fixing the
  misspelled `rajasthan-bagpacking-from-ayodhaya` slug safe — the rename itself is an admin action,
  because that package exists only on the live volume, not in the seed.
- **Ladakh package added** — `ladakh-leh-nubra-pangong-circuit`, 6N/7D, full itinerary, inclusions
  and copy, built around a real acclimatisation schedule (two nights in Leh before anything high).
  Shipped as **status: draft** on purpose: the seat price and the departure dates are a commercial
  decision, not something to invent. SEED_VERSION bumped to 10 so the additive merge delivers it to
  the running install.
- **Homepage H1 rewritten** — "Your city. Your crew. Pick Your Shot." named no product, no country
  and no destination, spending the strongest on-page signal the site has entirely on voice. Now
  "Group trips across India." with "Your city. Your crew." as the gold accent line: head term first,
  voice intact. Defaults, component fallbacks and both catalog seeds updated. **The live value is
  admin-owned**, so production needs the two lines pasted into Admin → Content → Homepage · Hero.

**Fixed in passing:** `SiteMedia` passed a caller's `style` straight into a `fill` next/image, which
THROWS when that style carries a width — and because it throws during render it took the whole route
down. The homepage had been returning 500 in `next dev` for this reason (production tolerated it).
Conflicting width/height are now stripped when `fill` is set, so no caller has to know the rule.

### 2026-09-07 — SEO: the site was telling Google to de-index two thirds of itself

A full live crawl of all 76 sitemap URLs (not a code read — actual responses) found one dominant
problem and a set of smaller ones. Report artifact: search "Tripwaley Search Audit".

**The big one.** `src/app/layout.tsx` declared `alternates: { canonical: "/" }`. In the App Router a
page that doesn't set its own `alternates` INHERITS the layout's, so **52 of 76 URLs were telling
Google they were duplicates of the homepage** — /solo, /honeymoon, /college-trips,
/group-departures, every /from/[city], every creator page. The sitemap said "index these"; the
canonical said "don't". Google believes the canonical. That is why well-written pages were not
ranking. Fixed via `src/lib/seo.ts`: the layout sets none, every route declares its own. The failure
mode of forgetting is now "no canonical" (harmless self-canonicalisation), not silent de-indexing.

**Also fixed, none of which needed new content:**
- All ten `/from/[city]` pages had ZERO inbound internal links — reachable only via the sitemap.
  Now linked from `/trips` and, contextually, from every trip page's fare board (the city name in
  the board is the link, so the anchor text is the city's real name).
- The sitemap served a 404: it filtered creator trips on `published` but the page also requires the
  underlying package to be live. Same liveness check now applies in `sitemap.ts`.
- Structured data reached only `/trips/[slug]`. Added `articleJsonLd`, `faqJsonLd`, `personJsonLd`,
  `itemListJsonLd` to `lib/schema.ts` and wired them into stories, creator pages and the four
  category pages, plus breadcrumbs on all of them. Every one is built from data the templates
  already held — creator Q&As, story bodies, trip lists.
- All six story pages shipped with an EMPTY meta description: the template read `post.excerpt` and
  no post has one. It now falls back to the first ~155 characters of the body, so it can never be
  blank again whatever the admin field holds. Story covers also had `alt=""`; they use the title.
- Homepage title was 598px against Google's ~580px limit and the description 1194px against ~1000px.
  Both trimmed (55 chars / 139 chars), keyword first, brand last.
- 25 trip titles exceeded 60 chars; long ones now drop the nights suffix rather than losing the
  brand to truncation. Creator-trip descriptions ran as short as 40 chars; now composed to ~158.
- Organisation entity enriched (logo, email, telephone from settings, address, `knowsAbout`) — this
  is what AI answer engines read. Added `/llms.txt`, generated from the live catalog so it cannot
  drift from what is on sale. Added an Apple touch icon.

**Two findings in my own audit were WRONG and are corrected here**, because both would have caused
pointless churn if acted on:
- *"No BreadcrumbList anywhere."* False — trip pages already had it. My scan truncated the schema
  type list at 36 characters and hid it. Always print the full type list.
- *"The LCP hero image is not prioritised."* False — Next emits `<link rel="preload" as="image">`
  in the head for it, which is the better mechanism than `fetchpriority` on the tag. I had looked
  for the wrong signal. The hero's `alt=""` is also correct: it is decorative, the h1 carries the
  meaning.

**Not a regression, but worth knowing:** the homepage returns 500 in `next dev` — "Image with
src /images/tw-hero-deodar.jpg has both fill and style.width". It builds and serves fine in
production. Confirmed pre-existing on HEAD before this work.

### 2026-09-07 — Fixed: 8 bugs found reviewing the booking + webhook work

A code review of `d10aafe` + `73fe8d3`, prompted by a real production event the owner pasted from
n8n (order `TW-MTQG8VNL-6ed408c6` — a PAID booking with `departureDate: null`).

**The two that could take the wrong money or lose a booking:**

1. **A stale coupon quoted one price and charged another.** An applied coupon's server-priced
   `total` was cached in component state and never re-checked when travellers, departure city or
   occupancy changed — all of which the server re-prices. At 3 travellers the modal showed
   ₹423.94 while PhonePe took ₹1,271.81. The pax stepper shipped in `73fe8d3` is what made this
   reachable; before it, pax was hardcoded to 1. **Changing any of those three now drops the
   coupon** with a visible "re-apply it" note, rather than silently keeping a stale figure.
2. **A booking could be paid for with no departure date at all.** A trip's dates live in TWO
   places — the shared `departures` collection, and `dates` on a creator's record — and the
   booking bar only ever read the first. A package whose batches existed only on a creator record
   left the bar with nothing to offer and nothing to fall back on, so its hero CTA submitted an
   empty date that every layer downstream accepted. Fixed at three levels: creator dates now fill
   an empty shared list (`departureDates.ts` — a fallback, deliberately NOT a merge, so deleted
   batches can't come back on sale); the bar hides the Pay button and says "no dates published"
   instead of the misleading "next batch"; and **`/api/pay/create` now refuses any order whose
   date isn't a real ISO date**, which is the chokepoint every pay path goes through.

**The rest:**

3. `money.subtotal` was POST-discount while `discount` was reported separately, so
   `subtotal - discount` equalled neither the gross nor the net on every coupon booking (₹8,075 −
   ₹425 = ₹7,650 on a ₹8,500 trip). Gross revenue in the CRM was wrong. The pre-coupon rate is now
   stored on the order and `preCouponSeatPrice()` reconstructs it for orders written earlier.
4. The college form and `/api/book` still posted a flat legacy payload to the SAME webhook URL, so
   one n8n mapping could not read both — a college enquiry would error the workflow. Both now send
   the shared envelope through the shared sender, which also means they show up in the deliveries
   panel. Carrying the college fields without breaking "every path present" needed a new `college`
   block, present-and-null on trip events exactly like `payment`.
5. The navbar "Hold a seat" modal sent a DISPLAY label as the date ("12 Jul", "flexible dates"),
   which `/api/lead`'s 10-char cap turned into "flexible d". `BookingTrip` now carries the ISO date
   alongside its label, and that modal offers no payment for a trip with no real date.
6. Coupons were dropped from every `lead.captured` event — someone who applied a code and took the
   WhatsApp route reached the CRM at full price with no record of the code. `/api/lead` now prices
   the coupon itself (never trusting a browser-supplied discount).
7. The name field was labelled "(optional)" but `/api/pay/create` rejects names under 2 chars —
   blank name + Pay meant a 422 after the button already said "Opening secure payment…".
8. The batch `<select>` could display a different date than the one being booked, when a date card
   picked a departure absent from the shared list. Its options are now a union including `chosen`.

Verified against a live local webhook receiver (both events came back with an identical top-level
shape), a real browser run of the coupon/pax flow, and `/api/pay/create` refusing `""`, `"12 Jul"`
and `"flexible d"` while still accepting `2026-10-26`. 80 assertions across 6 test scripts (was 62).

**Still the owner's to do:** some live packages have no rows in the shared Departures list at all —
locally that's 5 of them, and it's what caused #2 in production. The site now fails honestly on
those trips (no Pay button, "dates on request") instead of taking money, but they can't be booked
online until real departures are added in Admin → Departures.

### 2026-09-06 — Booking toggle, travellers + city, weather, creator section, read-more (73fe8d3)

- **Per-package booking toggle.** `Package.bookingEnabled`, defaulting to true so existing trips
  are untouched. Enforced in the UI *and* in `/api/pay/create` — a toggle only the browser
  respects is decorative, since anyone can POST that endpoint.
- **Travellers + departure city in the booking bar.** The city list contains only cities the
  package is actually priced from, which removes the root of the 307e6e9 bug rather than its
  symptom: an unpriced city can no longer be selected. `pax` multiplies the trip and the hold, and
  the server re-derives it — it is the one field that can make a booking 20× larger.
- **Weather.** The coordinate table matched `name + destination + route` CONCATENATED,
  first-match-wins, which failed twice: five destinations were missing entirely (Lansdowne,
  Andaman, Meghalaya ×2, Kerala), and **"Manali Exploration" showed Kasol's weather** because its
  route mentions Kasol and that pattern sat earlier. Now `src/lib/geo.ts`, resolved by
  specificity — admin coordinate → destination → name → route — with per-package `lat`/`lng`/
  `weatherPlace` so the table never needs editing for a new destination.
- **"Ask &lt;creator&gt;"** moved out of the hero into its own section on both creator pages, built
  once from the creator record.
- **Read-more.** Audited on production first: only `/college-trips` has genuinely long copy
  (testimonial quotes, 1,278 and 930 chars). Everything else measures zero paragraphs over 260,
  and trip briefs/itineraries already collapse via `RichText` (threshold lowered 340 → 260).

Two bugs written and caught during this work, both worth remembering:

- `gsap.from({autoAlpha: 0})` + ScrollTrigger left the whole creator section **permanently
  invisible** — the trigger existed, `refresh()` and `update()` ran, nothing appeared;
  `immediateRender:false` didn't help either. This site scrolls through Lenis. Reveals here now
  use IntersectionObserver + CSS with a failsafe timer, so content **cannot fail closed**.
- `ReadMore`'s overflow check was circular: it set `line-clamp` to measure, but `line-clamp` does
  nothing without `display:-webkit-box`, which was only applied after deciding to clamp. It
  silently clamped nothing. Measure against line height instead.

### 2026-09-06 — n8n webhook never fired for seat holds; CRM-shaped payload (d10aafe)

`/api/lead` — every "Hold my seat" — read `N8N_WEBHOOK_URL` alone, while the Admin → Settings
field labelled "n8n / CRM webhook url" was read **only by the college quote form**. A URL pasted
there made college quotes fire and seat holds silently not. Leads were never lost (they are in
`data/bookings.json`), they just never reached the CRM.

`src/lib/webhooks.ts` now owns resolution for every sender — env first, admin setting as fallback.
Nothing outside that file reads a webhook env var.

The payload (`src/lib/webhookPayload.ts`, documented in `docs/webhooks.md`, real samples in
`docs/webhook-samples/`) is built around two rules that exist because of how n8n fails:

- **every path is present on every event**, null when empty — a mapping on `money.couponCode` must
  not break on a booking without a coupon
- **every leaf is a scalar** — a nullable nested object is the same trap in disguise, so coupon and
  UTM fields are flat and `payment` is always a full object with null members

Money appears twice throughout: rupees for CRM currency fields, integer paise for reconciliation.
A `crm` block is pre-computed (dealName, dealValue, stage, leadSource, expectedCloseDate) so
mapping is a drag rather than an expression. `eventId` is stable per event — **dedupe on it**,
because PhonePe and n8n both retry.

Attribution (page + surface + creator + UTM) is sent by the browser, cross-checked against the
`Referer` header, frozen onto the order, and shown as a column in Admin → Bookings.

Deleted `/api/hold-seat`: a stub that returned fake success and **discarded the lead**.

**BREAKING:** the payload shape changed; the n8n mapping needs rebuilding once.

### 2026-09-05 — Fixed: three booking bugs (307e6e9)

- **The booking bar quoted another city's price.** `prices[city.slug] ?? Object.values(prices)[0]`
  meant a boarding city with no price rule fell back to whichever city was first, so the bar read
  "ex-Guwahati · ₹5,000/seat" using a different city's rate. The visitor filled the whole form and
  the server — which prices from the catalog — refused at the payment step. An unpriced city now
  reads "on request" with no Pay button, matching what the server will do.
- **Typing in any dialog threw focus to the close button.** `useModal`'s effect depended on
  `onClose`, an inline arrow and therefore a new function every render; each keystroke tore the
  effect down (restoring focus) and set it up again (focusing the first control). `onClose` now
  lives in a ref. Affected every dialog using the hook, not just booking.
- **Creator trips could not be booked** — same packages as `/trips/[slug]`, but WhatsApp-only
  checkout. They now render the same `BookingBar`; per-date cards open it with that departure
  preselected via a `tw:book` window event. Sold-out dates keep their waitlist link, and
  "Ask <creator>" stays on WhatsApp — those are conversations, not checkouts.

### 2026-09-05 — Fixed: the sitemap listed 12 trips that 404 (d0701c0)

Metadata routes are static by default and the root layout's `force-dynamic` does not reach
`sitemap.ts`, so it was generated during `next build` **inside the Docker image** — before the
volume with the real catalog is mounted. It fell back to the seed and froze around the seed's 22
live trips; 12 had since been deleted or drafted in the admin, and Google was being handed 12 URLs
that 404. `export const dynamic = "force-dynamic"` makes it render per request. Verified live
afterwards: 22 trip URLs, 0 dead.

### 2026-09-05 — PhonePe keys settable from Admin → Payments

Credentials no longer require a Dokploy redeploy. `src/lib/gatewayConfig.ts`
resolves them from the **environment first**, then a server-only
`data/gateway.json` written by the admin panel.

- Env wins deliberately: if the panel could override Dokploy, putting live keys
  in the environment would silently do nothing while a stale sandbox key kept
  taking payments. Fields supplied by the environment render locked and labelled.
- **Not** stored in `catalog.json` — that file is handed to the browser wholesale
  by `/api/admin/catalog`, and `getSettings()` is read by public pages. A secret
  there is one prop-spread from being served to every visitor.
- The client secret and webhook password are **write-only**: `/api/admin/gateway`
  GET reports only whether each is set. A blank field on save means "keep what's
  stored", so saving the form without retyping secrets can't wipe them.
- `data/gateway.json` is written 0600 and lives on the gitignored data volume.
- A **Test connection** button performs a real OAuth call and reports the result.

Covered by `scripts/test-gateway-config.mjs` (10 assertions). Verified end-to-end
with no env vars at all: a real PhonePe sandbox session was created and webhook
auth accepted/rejected correctly from panel-supplied credentials alone.

### 2026-09-05 — Fixed: deleted departures came back on every deploy

The seed catalog shipped inside the Docker image carries 191 departures, 54 of
them June 2026. `mergeSeedContent()` adds any seed row the live catalog lacks —
correct on day one, wrong forever after, because a seed row missing from live
doesn't mean "not imported yet", it means **the admin deleted it**. Every
`SEED_VERSION` bump therefore resurrected every deleted departure, package,
price, city, college, coupon and creator. Deleting them again never helped.

Fixed with tombstones (`src/lib/seedGuard.ts`):

- **On save** — the admin panel PUTs a whole section, so any seed row absent
  from what was saved was deliberately removed. Recorded in
  `catalog.seedRemovals`, recomputed per section so re-adding a row clears it.
- **Once, at migration** — installs predating this have a backlog of untracked
  deletions, so the first v9 merge captures them before it would re-add them.
- New seed content still arrives: a row that has never been live has no
  tombstone. Verified across two consecutive seed bumps.

Covered by `scripts/test-seed-guard.mjs` (11 assertions).

### 2026-09-05 — PhonePe payments: a 5% seat hold, charged online

Booking money now arrives in three stages, and only the first is taken on the website:

| Stage | Amount | Where |
| --- | --- | --- |
| Hold | `holdPercent` (5%) of the trip total, **plus `gstPercent` (5%) GST on that hold** | Website, via PhonePe |
| Advance | balance up to `advancePercent` (20%) of the trip total | Team, offline, ~1 week before departure |
| Balance | remaining 80% | At departure |

- **PhonePe Standard Checkout V2 (OAuth)** — `client_id` / `client_secret` / `client_version`,
  not the older merchantId + saltKey / X-VERIFY flow. See `src/lib/phonepe.ts`.
- **All money is integer paise**, computed once in `src/lib/money.ts` and tested first in
  `scripts/test-money.mjs` (14 assertions).
- **The browser never sends an amount.** `/api/pay/create` prices the trip from the catalog,
  re-applies the coupon server-side via the new shared `src/lib/pricing.ts` (also used by
  `/api/coupon`, so preview and charge can no longer drift), and freezes the figure on the order.
- **A payment is confirmed only when PhonePe's Order Status API agrees on both the state and the
  amount.** The redirect proves nothing. An amount mismatch is flagged, never auto-confirmed,
  and the customer gets a "we need to check this" page rather than "nothing was charged".
- Orders live in `data/orders.json`, deliberately **not** `catalog.json` — the admin PUT rewrites
  the catalog wholesale and would otherwise destroy an order mid-callback. Status transitions are
  monotonic: a paid order never downgrades.
- New routes: `/api/pay/create`, `/api/pay/status`, `/api/pay/webhook`, `/pay/return`,
  `/api/admin/orders`. `/api/book-token` (the ₹2,000 stub) is deleted.
- New admin **Payments** tab (read-only, with a per-order re-check) and a **Booking ladder**
  block in Settings showing a live worked example.
- Terms and Refund Policy rewritten around the three stages, including a clause stating the hold
  is adjusted against the advance and refundable under the cancellation slab.
- **Fails closed:** with no PhonePe credentials in the environment, no Pay button renders anywhere.

### 2026-08-01 — Fixed: admin edits and new photos not showing on the live site until saved twice
- Asked for: the owner reported that changes made in the admin panel (especially newly uploaded photos) would not appear on the live website right away. They had to go back into the admin panel and click Save a second time before the change showed up. They also asked to make sure admin data itself was not being wiped by deploys, and set the new rule above (never push without asking first).
- Investigated: checked the VPS directly over SSH. The admin data (prices, bookings, uploaded photos) was safe and not being lost — it survives deploys correctly, the storage folders are set up right. The real problem was different: the website's pages were being built once and reused (cached) instead of checking for new data on every visit. The signal that tells the site "go get fresh data" was being sent, but it did not always take effect before the next visitor arrived, which is why the first Save often looked like it did nothing and a second Save "fixed" it.
- Done:
  - Changed `src/app/layout.tsx` so every page always reads the latest data directly, every time someone visits, instead of relying on a cached copy. This removes the "have to save twice" problem completely.
  - Changed `next.config.ts` so replaced photos (same filename, new picture) stop being shown as the old cached picture for up to a year — now that clears itself within a minute.
  - Tested this for real: ran the exact same production setup locally, edited the data file directly, and confirmed the change appeared on the very next page load with no delay.
  - Got the owner's approval first, then pushed the fix (commit `79a59e0`). Confirmed on the live VPS afterward: the new version deployed within 3 minutes, the fix is live, and all existing admin data (prices, bookings, the uploaded photo) came through the deploy untouched.
- Notes: This was a caching/timing bug, not a data-loss bug — nothing was ever actually being deleted. Full technical explanation kept in chat history for reference if this area needs touching again.

### 2026-07-19 (approx.) — Big fix round: 22 issues found in a full site review
- Asked for: the owner asked to fix everything found in a full review of the site (a cloud-based review plus a manual review), all in one go.
- Done: fixed 22 issues in total. The most important one: the "Hold my seat" popup (shown on every page) was silently throwing away every booking request instead of saving it — this is now fixed and every "Hold my seat" click is saved for real. Also fixed: a crash risk in the city-picker, the WhatsApp number shown to visitors was a placeholder instead of the real number set in admin settings, old/expired trip dates were being shown as if they were upcoming, prices of exactly ₹0 were being hidden by mistake, a few data-validation gaps in the admin save API, and five unused old files were deleted to keep the codebase clean.
- Notes: This was pushed straight to GitHub without asking first, because the "always ask before pushing" rule did not exist yet at that point. The owner set that rule right after this, and it has been followed since.

### 2026-07-17 to 2026-07-19 (approx.) — Site deployed to a real VPS with Dokploy
- Asked for: get the site properly hosted and live on the owner's own server, with the admin panel's data (prices, bookings, photos) safely surviving future updates instead of resetting.
- Done: Set up deployment on a Hostinger VPS (using Dokploy, a self-hosting control panel) connected to the GitHub repo, so every push to `main` automatically builds and deploys the site. Set up three separate storage areas on the server (outside the app itself) so that admin-saved prices/bookings/reviews and uploaded photos are kept safe and are not overwritten every time the site is updated.
- Notes: The storage setup uses Dokploy's own built-in "Volumes" feature, not the `docker-compose.yml` file that is also sitting in the project folder (that file exists but Dokploy is not actually using it — worth remembering so nobody edits that file expecting it to change anything on the live server).

### 2026-07-12 — Media slot system + mandatory phone capture
- Asked for: (1) A way to control which image is used where across the site — e.g. "images 1-5 are in hero section film" — with the ability to replace any image and add more. (2) Phone number capture must be mandatory for every booking/lead.
- Done:
  - Added `SLOT_DEFS` registry in `src/lib/types.ts` — named, typed image slots (`hero.bg`, `hero.film` (list, max 8), `hero.blinds`, `about.crew`, `captains` (list, max 6)), each with a group label, hint text, and fallback default images. Added `resolveSlot()` helper to merge admin-saved assignments with defaults.
  - Built `src/components/admin/MediaManager.tsx`: two-tier UI — top section shows every slot grouped by where it appears, with thumbnails, numbered order (for list slots), a "Replace" button (opens a picker modal to choose from the library or upload new), a "✕" remove button for list slots, and "+ Add image" to grow a list slot up to its max. Bottom section is the full photo library with per-file "Replace-in-place" (swaps that file everywhere it's used, site-wide).
  - Added `slots` field to `AdminData` in `src/components/admin/ui.tsx` so the admin data hook carries slot assignments.
  - Updated `src/app/about/page.tsx` to pull its crew banner image via `slotOne("about.crew")` instead of a hardcoded path — proving the slot system works end-to-end on a real page.
  - Hardened `src/app/api/lead/route.ts`: added `normalizePhone()` (accepts Indian mobiles, strips +91/spaces/dashes, requires 10 digits starting 6–9) and rejects the request with HTTP 422 if the phone is missing/invalid, before anything is saved or forwarded to n8n.
  - Confirmed `src/components/site/BookingBar.tsx` already had a phone-required capture modal (name optional, phone required with inline validation) wired to `/api/lead`, followed by a "ticket stub" print animation and WhatsApp handoff.
- Notes: The phone rule is enforced at the API boundary, so it can't be bypassed by a modified client. The user asked to "show me preview via localhost" next — dev server has not been started yet in this session; that is the next step.

### Earlier — Admin panel build-out
- Asked for: A full admin/CMS panel so the site owner can manage everything (packages, prices, departures, cities, media, reviews, settings, bookings) without code changes.
- Done: Built the JSON-backed store (`src/lib/store.ts`), catalog read layer (`src/lib/catalog.ts` with `slot()`/`slotOne()`, `getCities`, `getSettings`, `getLivePackages`, `getPricedCities`), password-hash + session-cookie auth (`src/lib/auth.ts`, `src/lib/session.ts`, `scripts/hash-password.mjs` to generate the hash), a login route/page (`/admin/login`, `/api/admin/login`, `/api/admin/logout`), a guarded `/admin` route with `AdminApp.tsx` shell (tabs: Dashboard, Packages, Prices, Departures, Cities, Media, Reviews, Settings, Bookings), `PackagesEditor.tsx`, and the catalog CRUD API (`/api/admin/catalog` GET/PUT) plus a file-upload API (`/api/admin/media` POST, handles both new uploads and "replace this path everywhere" swaps).
- Notes: Admin auth uses `ADMIN_PASSWORD_HASH` + `SESSION_SECRET` env vars in production (see `.env.example`); there's a dev-only fallback password. n8n integration is optional via `N8N_WEBHOOK_URL`.

### Earlier — Booking/lead flow and catalog pages
- Asked for: Real booking flow tied to real trip data, plus catalog browsing by city.
- Done: Built `/trips`, `/trips/[slug]`, `/from/[city]` pages, `CityProvider.tsx` (city-aware pricing/cookie), `BookingBar.tsx` sticky booking widget with occupancy toggle (triple/double) and departure-date picker, `/api/lead`, `/api/book`, `/api/hold-seat`, `/api/book-token` route handlers, and webhook forwarding to n8n for CRM push.

### Earlier — Homepage rebuild and data layer
- Asked for: A real homepage assembled from the best design explorations, backed by real trip inventory instead of placeholder copy.
- Done: Built an xlsx importer (`scripts/import_inventory.py`) to turn a real trip inventory spreadsheet into `data/catalog.json`; built the typed data/repository layer (`src/lib/types.ts`, `src/lib/data.ts`); rebuilt the homepage around an "Opening Shot" hero (`OpeningShot.tsx`) plus a curated set of site sections: `DepartureBoard.tsx` (ticket-rack style departures list), `DeckDestinations.tsx` (3D-perspective destination scroll deck), `CaptainFeed.tsx` (simulated WhatsApp-style trip-captain feed), `PileUp.tsx` (stacked departure cards), `DrumReviews.tsx`, `CurtainFooter.tsx`, `PageExtras.tsx`, `FilmStrip.tsx`, `ItineraryRibbon.tsx`, `WeatherNow.tsx`, `TripsExplorer.tsx`, `MagnetChant.tsx`, `MomentumBreak.tsx`.

### Earlier — Design exploration phase (labs)
- Asked for: Explore many different visual directions for hero sections and page sections before committing to a final design.
- Done: Built 42 experimental hero components (`Hero01…Hero42`, e.g. paper diorama, silk shader, aurora, film strip, cinema, split-flap, metaball, particle morph, liquid shader, orbit gallery, floating islands, constellation, compass, monogram) under `src/components/lab/`, viewable at `/lab`. Then built a second wave of 40 section/micro-interaction components (`L01…L40` — mask zoom, kinetic wall, cloud dive, coverflow, flip calendar, chat itinerary, globe footer, ambient wall, ticket printer, seat countdown, star map, etc.) plus two "micro interaction" sets (`MicroSetA`, `MicroSetB`) under `src/components/lab2/`, viewable at `/lab2` with category navigation.
- Notes: These lab pages are a component gallery/sandbox, not part of the live site flow — the final homepage cherry-picks ideas from them (e.g. `OpeningShot`, `DepartureBoard`, `CaptainFeed`, `PileUp`, `DeckDestinations` all trace back to lab experiments).

### Earlier — Initial scaffold
- Asked for: Stand up the base Next.js site with the 3D hero, brand design tokens, and conversion-funnel plumbing (before real trip data existed).
- Done: `create-next-app` scaffold with Next.js 16 (App Router, TypeScript strict, Tailwind v4), React Three Fiber 9 + GSAP ScrollTrigger + Lenis smooth scroll, a procedural low-poly 3D Himalayan valley hero (`components/three/`), brand design tokens in `globals.css` (`@theme`), placeholder `BookingContext`/`HoldSeatModal` conversion funnel, and placeholder `/api/hold-seat` + `/api/book-token` routes. This became the foundation everything else was layered on.

## Pending / Next Steps

Verified against production on 2026-09-05 unless marked otherwise.

### Do this first

*Every item below was re-verified against production on 2026-09-10 and is genuinely still open.*

1. **Two DNS records did not survive the Cloudflare nameserver switch.** Add them in Cloudflare DNS,
   copying the values from Hostinger's email panel:
   - **DKIM** — no selector resolves, so outbound mail from grievance@tripwaley.com is signed by SPF
     alone and is more likely to be filtered as spam. MX, SPF and DMARC all survived; this did not.
   - **autodiscover / autoconfig CNAMEs** — Outlook and Thunderbird can no longer auto-configure the
     mailbox. Manual IMAP settings still work, so this is an annoyance rather than an outage.

2. **Three admin edits that code cannot make** (these rows live only on the production volume, and
   the seed merge never overwrites an existing row):
   - Paste the new homepage H1 into Admin → Content → Homepage · Hero:
     headline `Group trips across India.`, accent `Your city. Your crew.`
     *(still showing the old "Your city. Your crew. Pick Your Shot.")*
   - Rename the misspelled slug `rajasthan-bagpacking-from-ayodhaya` →
     `rajasthan-backpacking-from-ayodhya`, and fix the same two typos in the package NAME. The old
     URL will 301 automatically — see slugAliases in lib/slugCascade.ts.
   - Set a seat price and departure dates on the **Ladakh — Leh, Nubra & Pangong** package, then
     switch it from draft to live. The itinerary and copy are already written.

3. **One Drive image is still restricted** and therefore still costs full size on every load:
   `111xoaHzaitx0eXEBsS6T95Nxjx4CK97D` on /trips/udaipur-trip-from-dehradun returns HTML rather than
   an image. Re-share it publicly, then re-run `node scripts/pull-drive-images.mjs` — it is
   idempotent and will pick up only that one. **Re-run the same script whenever new photos are added
   through the admin**, because those arrive as Drive links again.

4. **Search Console.** Resubmit the sitemap and request re-indexing for /solo, /honeymoon,
   /college-trips, /group-departures and the /from/ pages. They spent months telling Google they
   were duplicates of the homepage, and whether that has been undone is only visible there.

5. **Rebuild the n8n mapping** against `docs/webhook-samples/` — the payload gained a `college`
   block and `money.subtotal` is now correctly pre-discount. `docs/webhooks.md` is the reference.

6. **Add real departures for the live packages that have none.** A trip with no rows in Admin →
   Departures cannot be booked or paid for online — the site says "dates on request" and offers only
   the WhatsApp path, which is honest but is not a sale.

7. **Collect reviews, three per trip.** 0 of 23 trip pages carry a star rating, because the code
   (correctly) refuses to emit one until three real reviews match a trip and only 8 exist site-wide.
   Star ratings are among the highest click-through rich results there are; this is the best
   effort-to-payoff item on the list and it is not a code change.

### Payments — live, but still on sandbox
- [ ] **Complete one real end-to-end sandbox payment through a browser.** The gateway is confirmed
      working (a real PhonePe checkout session is created from tripwaley.com, `payEnabled: true`),
      but nobody has yet approved a UPI collect and watched it land in Admin → Payments as `paid`.
      That is the last untested link.
- [ ] **Switch `env` to production** in Admin → Payments once PhonePe approves the live account.
      One dropdown. Do it only after the sandbox run above passes.
- [ ] **Change the webhook password.** It is currently `Naman1234`, which is weak and was shared in
      a screenshot — treat it as public. Change it on the PhonePe dashboard and in Admin → Payments
      together. It only guards the callback (the amount check catches a wrong figure anyway), but
      it should not stay as-is for production.

### Two policy questions the owner has not answered — currently written as assumptions
- [ ] **Is the 5% hold refundable?** Terms and the Refund Policy currently say YES — adjusted
      against the 20% advance and refunded under the existing cancellation slab. If it should be
      non-refundable instead, that is legal but needs explicit pre-payment disclosure and a tick-box
      under the Consumer Protection (E-Commerce) Rules 2020, i.e. a different build.
- [ ] **Are trip prices GST-exclusive?** Assumed YES, since GST is charged on top of the hold. If
      prices are meant to be GST-inclusive this line double-charges — set `gstPercent` to 0 and the
      GST wording disappears from the site automatically.

### Believed open — carried from earlier sessions, NOT re-verified
- [ ] Cloudflare CDN. Blocked on the owner creating the account. **Critical:** the Hostinger email
      records (MX `mx1/mx2.hostinger.com`, SPF, `autodiscover` CNAME) must be recreated in
      Cloudflare BEFORE the nameserver switch, or `grievance@tripwaley.com` breaks — and PhonePe
      depends on that address. No DMARC record exists.
- [ ] ~10 Google Drive photos set to "Restricted" — need "Anyone with the link".
- [ ] Seeded coupon `EXPIRED24` exists as a negative test; delete it before it confuses anyone.
- [ ] Orphaned price rules pointing at package slugs that no longer exist. `findOrphans()` in
      `src/lib/slugCascade.ts` reports them. Inert, but they clutter the catalog.
- [ ] Confirm the `grievance@tripwaley.com` mailbox actually exists and is monitored.

### Housekeeping
- [ ] A probe order `TW-MTPUG07F-e34460a4` was created on production while verifying the gateway on
      2026-09-05. Status `created`, no money moved, sandbox. Safe to ignore.
- [ ] Real photography still needs to replace remaining placeholders in `public/images/`.
- [ ] Weather coordinates were added for Lansdowne, Andaman, Meghalaya and Kerala from general
      knowledge of those places. Spot-check they point where you'd expect, and correct any in
      Admin → Packages (the lat/lng fields override the built-in table).

## Key Details
- Project root: `/Users/apple/Applications/tripwaley`
- Stack: Next.js 16 (App Router), TypeScript strict, Tailwind v4, React Three Fiber 9, GSAP ScrollTrigger, Lenis smooth scroll.
- Data storage: flat JSON files in `data/` (`catalog.json`, `bookings.json`, `reviews.json`) — no database. `src/data/*.json` is the starter/seed copy baked into the app; `data/*.json` is the real, live copy the admin panel edits.
- Dev command: `npm install` then `npm run dev` → http://localhost:3000. Production build: `npm run build`. To test the production build locally (not `npm run dev`, which behaves differently), run `node .next/standalone/server.js` or use the `tripwaley-prod` preview config.
- **Live site**: `tripwaley.com`
- **Hosting**: Hostinger VPS, IP `72.61.169.200`, using Dokploy (a self-hosting control panel). SSH access works from this Mac: `ssh root@72.61.169.200`.
- **GitHub**: `mrnamansoni/tripwaley`, branch `main`. A push to `main` auto-deploys through Dokploy, usually live within a few minutes.
- **Storage on the server**: three separate storage areas set up in Dokploy itself (not in the project's `docker-compose.yml`, which is not actually used) — one for admin data (prices/bookings/reviews), one for uploaded photos, one for the image cache. These keep admin changes safe across every deploy.
- Admin panel: `/admin` (guarded), login at `/admin/login`. Auth env vars: `ADMIN_PASSWORD_HASH` + `SESSION_SECRET` (generate hash via `node scripts/hash-password.mjs "your-password"`); dev fallback password `tripwaley@2026` if hash isn't set.
- **Payments**: PhonePe Standard Checkout **V2 (OAuth)** — `client_id` / `client_secret` /
  `client_version`, NOT the older merchantId + saltKey / X-VERIFY flow most tutorials show.
  Credentials resolve **environment first, then `data/gateway.json`** (written by Admin → Payments,
  mode 0600, never in `catalog.json` because that file is served to the browser wholesale).
  Env winning is deliberate: the reverse would let a stale sandbox key silently override live keys.
  With no credentials anywhere, no Pay button renders at all — it fails closed.
- **Payment invariants** (do not weaken these): the browser never sends an amount; `/api/pay/create`
  prices from the catalog via `src/lib/pricing.ts` and freezes the figure on the order; an order is
  `paid` only when PhonePe's Order Status API agrees on **state AND amount**; status transitions are
  monotonic so a late `FAILED` cannot undo a payment; orders live in `data/orders.json`, never in
  `catalog.json`, because the admin PUT rewrites the catalog wholesale.
- **Seed merge**: `mergeSeedContent()` adds seed rows the live catalog lacks — but a row the admin
  DELETED is also "lacking". `catalog.seedRemovals` records tombstones (see `src/lib/seedGuard.ts`)
  so deletions survive a `SEED_VERSION` bump. This was the "June departures keep coming back" bug.
- **CRM webhook**: one resolver, `src/lib/webhooks.ts` — env `N8N_WEBHOOK_URL`, then
  `TW_BOOKING_WEBHOOK`, then Admin → Settings. Nothing else may read those env vars. Payload
  contract and samples: `docs/webhooks.md`, `docs/webhook-samples/`. Two invariants that must not
  be weakened: every path present on every event, and every leaf a scalar.
- **Animation**: reveals must not be able to hide content permanently. GSAP ScrollTrigger reveals
  proved unreliable against this site's Lenis scrolling — see `AskCreator.tsx` for the
  IntersectionObserver-plus-failsafe pattern to copy.
- Tests: no test runner is installed. Verification scripts use `node:assert` and Node's native
  TypeScript stripping: `node scripts/test-money.mjs` (14), `test-seed-guard.mjs` (11),
  `test-gateway-config.mjs` (10), `test-webhooks.mjs` (18), `test-geo.mjs` (9) — 62 total.
- CRM integration: `N8N_WEBHOOK_URL` env var — when set, every lead (`/api/lead`) is also POSTed to this n8n webhook for CRM push (e.g. Twenty CRM).
- Image slot registry: `SLOT_DEFS` in `src/lib/types.ts` — add new slots here to make any future hardcoded image editable from the admin Media tab.
- Design tokens: all colors/fonts defined once in `src/app/globals.css` under `@theme` (brand red `#C91B20`, gold `#F5A31A`, ink `#1A1614`, cream `#FFFCF8`, etc.).
- Lab/sandbox pages: `/lab` (42 hero concepts) and `/lab2` (40 section/micro-interaction concepts) — design exploration galleries, not part of the live user-facing site.
- Decisions made:
  - No database — chose JSON file storage for simplicity since this is a single-owner admin panel, not multi-tenant.
  - Phone capture enforced server-side (HTTP 422 on invalid/missing phone) rather than only client-side, so the lead requirement can't be bypassed.
  - Image slots modeled as a registry (`SLOT_DEFS`) with defaults + admin overrides, rather than editing image paths directly in code, so every image on the site is owner-replaceable through the admin UI.
  - Every page still renders fresh on every visit (root layout `force-dynamic`), but public pages
    now send `s-maxage=60, stale-while-revalidate=600` so a CDN can absorb the load — the earlier
    blanket `no-store` was costing performance for no benefit.
  - Every page-generating request now does a small amount of extra work on every visit instead of using a saved copy — this is fine because reading the data file is fast and cheap, not a heavy database call.
