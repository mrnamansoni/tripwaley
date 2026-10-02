# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

No single primary buyer. Four audiences matter about equally (owner, 2026-09-28):

- **Solo travellers**, mostly 20s to early 30s, working or studying, who come alone or with one friend and join strangers in a batch.
- **Friend groups** of three to eight who want someone else to run the trip.
- **Couples**, served by the honeymoon line (`/honeymoon`).
- **College groups**, served by `/college-trips` with a quote form rather than a seat hold.

A fifth path exists for **followers of a creator**, who book that creator's batch at `/travel-with/[slug]`.

Most visitors arrive on a phone, from Instagram, WhatsApp or Google, and many close the deal on WhatsApp rather than on the site.

## Product Purpose

Tripwaley runs fixed-date group trips across India (Himalaya, Rajasthan, the North-East, Kerala and more) and sells seats on them. The site's job is to get someone from "that looks fun" to a held seat, or at least a WhatsApp conversation, and to answer every worry that stands between them (safety, who else is going, what it costs from their city, what happens if plans change).

Success is a held seat: 5% of the price plus GST paid online through PhonePe. The balance of the 20% advance is collected offline about a week before departure, and the rest at departure.

## Positioning

All four of these are true at once, and the owner treats the combination as the edge (2026-09-28):

- **Board in your own city.** Departures from 12 cities (Agra, Ayodhya, Varanasi, Dehradun, Delhi, Gwalior, Jaipur, Kochi, Moradabad, Patna, Ranchi, Udaipur), each with its own price, not just Delhi.
- **A trip captain runs every batch**, and a WhatsApp group forms before departure, so strangers arrive as a crew.
- **Guaranteed departures** on fixed dates.
- **Value** against competitors on the same route.

## Operating Context

- A batch is the unit of the product: one trip, one date, one captain, one WhatsApp group.
- Booking happens in three stages, and only the first is online: seat hold → advance, collected offline → balance at departure. Leads that don't pay still save and forward to n8n; the WhatsApp button is a first-class path, not a fallback.
- Prices depend on the departure city. The visitor's city is remembered and changes every price on the site.
- The owner runs everything from a custom admin panel (`/admin`): trips, prices, departures, cities, media slots, reviews, stories, coupons, payments. There is no developer in the daily loop, so any design must survive the owner editing its content.
- Trip reports and guides at `/stories` are becoming the site's main way in from Google (SEO content strategy, 2026-09-19). They attach to destinations, not trips, because trip slugs change.

## Capabilities and Constraints

- Next.js 16 on a Hostinger VPS via Dokploy; auto-deploys on push to `main`. No database: JSON files on a server volume.
- PhonePe payments are wired but still pointed at the sandbox until the owner switches `env`.
- Invoices are generated server-side as PDFs.
- Stories carry a topic, destinations, one keyword, a short answer and FAQs; drafts from an AI writer will always need a human to publish them.
- Terminology: **batch** (a departure with its people), **trip captain**, **hold your seat**, **departure city**, **wanderers** (customers).
- Performance matters: most traffic is mobile, and PageSpeed Accessibility and Best Practices reached 100 on 2026-09-16.

## Brand Commitments

- Name: **Tripwaley**. Slogan in structured data: "your complete travel guru".
- Voice on the live site: warm, casual, first-person-plural, a little funny, written like a friend in the group chat ("The 2 AM questions", "strangers on day one. this, by day six.", "We got tired of trips that stayed in the chat."). Premium in reliability, not in stiffness.
- The logo lives at `/images/logo.png`.

## Evidence on Hand

- **12,000+ wanderers** taken so far: confirmed real by the owner, 2026-09-28.
- 30+ trip packages, 12 departure cities, 3 named trip captains, 2 creators, 6 partner colleges (catalog).
- Reviews in `data/reviews.json`, shown per trip. Ratings are attached only to individual trips; a site-wide star rating was removed on purpose because it was hardcoded, not counted.
- Six live trip-report stories written by real travellers.
- **Do not fabricate:** ratings, review counts, press mentions, partner logos, safety certifications, or customer quotes. Anything new of this kind needs the owner's source.

## Product Principles

1. **The seat hold is the finish line.** Every page should shorten the path to holding a seat or opening WhatsApp.
2. **Answer the worry before it's asked.** Safety, cost from my city, who else is going and what if plans change are answered where the doubt comes up, not on a separate page.
3. **The owner edits everything.** Designs must hold up when the text, photos and trips change in admin without a developer.
4. **Truth over hype.** Every number on the site is counted or confirmed; nothing is hardcoded to look good.
5. **Built for the phone first.** The typical visitor is on mobile data, coming from a link in a chat.

## Accessibility & Inclusion

Keep the PageSpeed Accessibility score at 100 (reached 2026-09-16). Respect `prefers-reduced-motion`: the site's scroll and GSAP motion already has reduced-motion paths in `globals.css`.
