# Project Summary: Tripwaley

Last updated: 2026-08-01

## Project Overview
Tripwaley is a production-grade travel booking website for a premium, group-departure travel brand in India. It is a Next.js 16 site with 3D/scroll-driven visuals (React Three Fiber, GSAP, Lenis), city-aware pricing, a lead-capture booking flow, and a full custom admin panel (CMS-style) so the owner can edit trips, prices, departures, cities, media, reviews, and bookings without touching code. There is no database — everything is stored in JSON files under `data/`.

## Current Status
- The site is **live in production** at `tripwaley.com`, deployed on a Hostinger VPS through Dokploy. It builds and deploys automatically from GitHub — every push to the `main` branch triggers a new deploy.
- Homepage, `/trips`, `/trips/[slug]`, `/from/[city]`, `/destinations`, `/collections`, `/about`, `/vibe-check`, `/stories` pages all exist and pull from the JSON data layer.
- Admin panel lives at `/admin` (login at `/admin/login`), protected by a password-hash + session-cookie auth system. Admin edits (prices, packages, photos, reviews, settings) now show up on the live site right away — this was broken until today's fix, see below.
- Booking/lead capture is wired end-to-end and confirmed working in production: the sticky booking bar and the "Hold my seat" popup both save to `data/bookings.json` and forward to an n8n webhook.
- Media management: every image used anywhere on the site is a named "slot". Admin → Media tab lets the owner replace any slot's image, add more images to list-type slots, remove extra images, upload new files, or do a global "replace this file everywhere it's used" swap.
- Phone number capture is enforced server-side — a lead cannot be created without a valid 10-digit Indian mobile number.
- A large "lab" of experimental hero/section designs still exists under `src/components/lab/` and `src/components/lab2/`, viewable at `/lab` and `/lab2` — design sandbox, not part of the live user-facing site.
- **New standing rule from the owner (2026-08-01, still in effect):** never push any change to GitHub directly. Always explain the plan in chat first and wait for a clear "yes" before making or pushing any change.

## Recent Changes

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
- [ ] Real payment gateway is still a placeholder in `/api/book-token` (the "pay token to confirm booking" step after "Hold my seat") — known, not yet requested.
- [ ] Real photography still needs to replace any remaining placeholder images in `public/images/` at some point (per README note).
- [ ] Remember the new rule: always explain the plan in chat and get a clear yes before pushing anything to GitHub.

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
- CRM integration: `N8N_WEBHOOK_URL` env var — when set, every lead (`/api/lead`) is also POSTed to this n8n webhook for CRM push (e.g. Twenty CRM).
- Image slot registry: `SLOT_DEFS` in `src/lib/types.ts` — add new slots here to make any future hardcoded image editable from the admin Media tab.
- Design tokens: all colors/fonts defined once in `src/app/globals.css` under `@theme` (brand red `#C91B20`, gold `#F5A31A`, ink `#1A1614`, cream `#FFFCF8`, etc.).
- Lab/sandbox pages: `/lab` (42 hero concepts) and `/lab2` (40 section/micro-interaction concepts) — design exploration galleries, not part of the live user-facing site.
- Decisions made:
  - No database — chose JSON file storage for simplicity since this is a single-owner admin panel, not multi-tenant.
  - Phone capture enforced server-side (HTTP 422 on invalid/missing phone) rather than only client-side, so the lead requirement can't be bypassed.
  - Image slots modeled as a registry (`SLOT_DEFS`) with defaults + admin overrides, rather than editing image paths directly in code, so every image on the site is owner-replaceable through the admin UI.
  - Every page now always fetches fresh data on every visit (added 2026-08-01), instead of relying on cached pages plus a refresh signal, because the refresh signal was not reliable enough on its own.
  - Every page-generating request now does a small amount of extra work on every visit instead of using a saved copy — this is fine because reading the data file is fast and cheap, not a heavy database call.
