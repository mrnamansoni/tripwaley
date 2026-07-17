# Tripwaley — your complete travel guru

Production-grade, 3D scroll-driven homepage for **Tripwaley**, India's premium
group-departure travel brand. Built to feel like an award site while staying
fast on Indian mobile networks.

Stack: **Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · React
Three Fiber 9 · GSAP ScrollTrigger · Lenis**

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Deploy (Docker / Dokploy)

The app uses Next.js `standalone` output — the Dockerfile is self-contained:

```bash
docker build -t tripwaley .
docker run -p 3000:3000 tripwaley
```

On **Dokploy**: create an app from this repo, pick "Dockerfile" as the build
type, expose port `3000`. No env vars are required.

---

## Architecture

```
src/
├─ app/
│  ├─ layout.tsx            fonts (next/font), SEO metadata, JSON-LD, providers
│  ├─ page.tsx              section assembly (required homepage order)
│  ├─ globals.css           ALL design tokens (@theme) + shared keyframes
│  └─ api/
│     ├─ hold-seat/         placeholder POST endpoint (24h free seat hold)
│     └─ book-token/        placeholder POST endpoint (₹2,000 token order)
├─ components/
│  ├─ providers/SmoothScroll.tsx   Lenis ↔ GSAP ticker wiring
│  ├─ booking/               BookingContext + HoldSeatModal (conversion funnel)
│  ├─ three/                 Hero3D (lazy loader) + HeroScene (R3F scene)
│  ├─ svg/RouteDraw.tsx      dotted red routes that draw themselves on scroll
│  ├─ ui/Logo.tsx            brand lockups built to logo spec
│  └─ sections/              Navbar · Hero · FeaturedDestinations · Collections
│                            · VibeCheck · SocialProof · CTABand · Footer
└─ lib/
   ├─ data.ts                all content (CMS-ready shapes)
   └─ gsap.ts                single ScrollTrigger registration point
```

### Design tokens

Everything lives in one place — `src/app/globals.css` `@theme`:

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand` | `#C91B20` | primary red |
| `--color-brand-bright` | `#E82028` | hovers |
| `--color-gold` | `#F5A31A` | sun / accents |
| `--color-ink` | `#1A1614` | text |
| `--color-cream` | `#FFFCF8` | page base |
| `--color-blush` | `#FEF5F0` | warm section tint |
| `--color-line` | `#EAE4DD` | borders |
| `--color-coal` | `#111111` | footer |

Fonts: Bricolage Grotesque (display), Instrument Sans (body), Caveat (script)
via `next/font` — zero layout shift.

### The 3D hero (`components/three/`)

* Procedural **low-poly Himalayan valley** (value-noise displacement, vertex
  colors, flat shading) — no GLB downloads, nothing to Draco-compress.
* Gold sun + billboard clouds + warm dust particles + a **paper plane flying a
  dotted red route** (the brand motif in 3D) + low-poly hot-air balloon.
* **Scroll = travel**: a 240vh pinned hero; ScrollTrigger progress drives the
  camera through the carved valley (damped, never snaps).
* **Cursor parallax** via window-level pointer tracking.

Performance guarantees:

* three.js chunk loads **after first paint** (`requestIdleCallback` +
  `next/dynamic ssr:false`), fading in over the static painted backdrop.
* The same backdrop is the **graceful fallback** for no-WebGL /
  `prefers-reduced-motion` users.
* `dpr` capped at 1.75 (1.5 on mobile), particle/cloud counts halved on
  mobile, render loop **fully paused** when the hero is off-screen or the tab
  is hidden (`frameloop="never"`).

### Scroll system

* **Lenis** smooth scrolling driven by GSAP's ticker (one rAF loop).
* **ScrollTrigger** for: hero camera scrub, headline exits, bento reveals, the
  pinned horizontal Collections scroller, stat count-ups, footer letter drop.
* **RouteDraw**: dotted paths can't draw with `stroke-dashoffset` directly
  (dots would slide), so a solid path inside an SVG `<mask>` animates the
  offset while the dotted path stays put — see `svg/RouteDraw.tsx`.
* All animation is **transform/opacity only** — zero layout thrash.
* Every effect is disabled or simplified under `prefers-reduced-motion`.

### Conversion wiring

* `BookingContext.open("hold" | "token", tripSlug)` from anywhere.
* `HoldSeatModal`: validated Indian phone input → `POST /api/hold-seat` →
  held state → `POST /api/book-token` → confirmed. Swap the two route
  handlers for the real CRM/payment gateway; the response contracts are
  documented in the files.
* Urgency: live seats-left chips, pulsing dots, and a real countdown to the
  next flagship departure (`NEXT_DEPARTURE` in `lib/data.ts`).

### Accessibility

Keyboard navigable, `:focus-visible` rings, `aria-pressed` vibe chips,
`role="dialog"` modal with Escape/scroll-lock/focus management, 44px+ touch
targets, AA contrast on text, decorative SVG/3D marked `aria-hidden`.

---

## Editing content

All copy, trips, prices, dates, testimonials and links live in
[`src/lib/data.ts`](src/lib/data.ts). The WhatsApp number is
`WHATSAPP_NUMBER` at the top of that file.

Imagery lives in `public/images/` (Unsplash-licensed placeholders — swap for
brand photography, keep filenames).
