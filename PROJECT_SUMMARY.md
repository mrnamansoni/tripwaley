# Project Summary: Tripwaley

Last updated: 2026-07-12

## Project Overview
Tripwaley is a production-grade travel booking website for a premium, group-departure travel brand in India. It is a Next.js 16 site with 3D/scroll-driven visuals (React Three Fiber, GSAP, Lenis), city-aware pricing, a lead-capture booking flow, and a full custom admin panel (CMS-style) so the owner can edit trips, prices, departures, cities, media, reviews, and bookings without touching code. There is no database yet — everything is stored in JSON files under `data/`.

## Current Status
- The site is fully built and has been through many rounds of feature work (see history below). No dev server was running at the time of this summary — start it with `npm run dev` (http://localhost:3000) to preview.
- Homepage, `/trips`, `/trips/[slug]`, `/from/[city]`, `/destinations`, `/collections`, `/about`, `/vibe-check` pages exist and pull from the JSON data layer.
- Admin panel lives at `/admin` (login at `/admin/login`), protected by a password-hash + session-cookie auth system.
- Booking/lead capture is wired end-to-end: `BookingBar.tsx` (sticky bar on package pages) → phone-required modal → `POST /api/lead` → saved to `data/bookings.json` → optionally forwarded to an n8n webhook (for CRM) → user is handed off to WhatsApp with a pre-filled message.
- Media management: every image used anywhere on the site is a named "slot" (e.g. hero film frames, blinds image, about-page crew banner, captain portraits). Admin → Media tab lets the owner replace any slot's image, add more images to list-type slots (like the hero film strip), remove extra images, upload new files, or do a global "replace this file everywhere it's used" swap. This directly satisfies the owner's request that every image be replaceable and slot-mapped, not hardcoded.
- Phone number capture is enforced server-side (not just in the UI) — `/api/lead` returns HTTP 422 if no valid 10-digit Indian mobile number (starts 6–9) is present, so a lead cannot be created without a phone number.
- A large "lab" of experimental hero/section designs exists under `src/components/lab/` (Hero01–Hero42) and `src/components/lab2/` (L01–L40 + micro-interaction sets), viewable at `/lab` and `/lab2` — these were built as a design exploration phase before the final homepage was assembled.

## Recent Changes

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
- [ ] Start the dev server and show the user a live localhost preview — this was the user's most recent request and has not been fulfilled yet.
- [ ] Visually verify the Media tab slot-editing flow in the browser (especially the `hero.film` list slot the user specifically asked about).
- [ ] Visually verify the phone-capture booking flow end-to-end in the browser (BookingBar modal → WhatsApp handoff).
- [ ] Run `npm run build` / lint to confirm no errors were introduced by the recent media-slot and phone-capture changes (not yet re-run after those edits).
- [ ] Real photography still needs to replace the Unsplash placeholder images in `public/images/` at some point (per README note).
- [ ] Real CRM/payment gateway integration is still a placeholder in `/api/hold-seat` and `/api/book-token` (per README note) — n8n webhook is the current CRM bridge for `/api/lead`.

## Key Details
- Project root: `/Users/apple/Applications/tripwaley`
- Stack: Next.js 16 (App Router), TypeScript strict, Tailwind v4, React Three Fiber 9, GSAP ScrollTrigger, Lenis smooth scroll.
- Data storage: flat JSON files in `data/` (`catalog.json`, `bookings.json`, `reviews.json`) — no database yet.
- Dev command: `npm install` then `npm run dev` → http://localhost:3000. Production: `npm run build && npm start`, or Docker (`Dockerfile` present, `standalone` output) — deploys to Dokploy, no env vars strictly required but admin auth needs them for production.
- Admin panel: `/admin` (guarded), login at `/admin/login`. Auth env vars: `ADMIN_PASSWORD_HASH` + `SESSION_SECRET` (generate hash via `node scripts/hash-password.mjs "your-password"`); dev fallback password `tripwaley@2026` if hash isn't set.
- CRM integration: `N8N_WEBHOOK_URL` env var — when set, every lead (`/api/lead`) is also POSTed to this n8n webhook for CRM push (e.g. Twenty CRM).
- Image slot registry: `SLOT_DEFS` in `src/lib/types.ts` — add new slots here to make any future hardcoded image editable from the admin Media tab.
- Design tokens: all colors/fonts defined once in `src/app/globals.css` under `@theme` (brand red `#C91B20`, gold `#F5A31A`, ink `#1A1614`, cream `#FFFCF8`, etc.).
- Lab/sandbox pages: `/lab` (42 hero concepts) and `/lab2` (40 section/micro-interaction concepts) — design exploration galleries, not part of the live user-facing site.
- Decisions made:
  - No database — chose JSON file storage for simplicity since this is a single-owner admin panel, not multi-tenant.
  - Phone capture enforced server-side (HTTP 422 on invalid/missing phone) rather than only client-side, so the lead requirement can't be bypassed.
  - Image slots modeled as a registry (`SLOT_DEFS`) with defaults + admin overrides, rather than editing image paths directly in code, so every image on the site is owner-replaceable through the admin UI.
