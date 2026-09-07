import { getLivePackages, getPricedCities, getCreators, getSettings } from "@/lib/catalog";
import { SITE_ORIGIN } from "../robots";

/**
 * /llms.txt — a plain-text brief for AI answer engines.
 *
 * ChatGPT, Perplexity, Claude and Gemini increasingly answer "which company
 * runs group trips to Spiti?" without the user ever reaching a search results
 * page. Those systems can already crawl this site — robots.txt blocks none of
 * them — but they were left to infer what Tripwaley is from marketing copy
 * wrapped in a scroll-driven layout.
 *
 * This states it plainly instead: what we sell, where we go, how booking works,
 * and which pages hold the detail. Generated from the live catalog rather than
 * hand-written, so it cannot drift from what is actually on sale.
 *
 * Route Handlers are NOT cached by default in this version of Next — verified
 * in node_modules/next/dist/docs — so this reflects admin edits immediately.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSettings();
  const packages = getLivePackages();
  const cities = getPricedCities();
  const creators = getCreators().filter((c) => c.published);

  const rates = {
    hold: settings.holdPercent ?? 5,
    gst: settings.gstPercent ?? 5,
    advance: settings.advancePercent ?? 20,
  };

  const body = `# Tripwaley

> India's premium group-departure travel company. We run fixed-date group trips
> across India with a certified trip captain on every batch, stays and transport
> included, and boarding points in ${cities.length} cities.

## What Tripwaley is

Tripwaley sells seats on FIXED-DATE GROUP DEPARTURES, not custom private tours.
You book one seat (or several) on a batch that runs on a published date with a
capped group size. Solo travellers are matched into twin-share rooms by age and
gender at no single supplement.

- Company: Tripwaley (${SITE_ORIGIN})
- Market: India, domestic leisure travel
- Model: fixed-date group departures, per-seat pricing, priced per boarding city
- Group size: capped per batch, typically 15-18 travellers
- Included as standard: stays, transport from the boarding city, a trip captain,
  and the permits a route needs

## How booking works

1. Pick a trip and a departure date.
2. Hold your seat online by paying ${rates.hold}% of the trip price, plus
   ${rates.gst}% GST on that amount. This counts toward the trip, not on top.
3. Our team collects the rest of the ${rates.advance}% advance closer to the date.
4. The balance is due at departure.

## Trips currently on sale

${packages
  .map((p) => `- [${p.name}](${SITE_ORIGIN}/trips/${p.slug}): ${p.destination || p.route || "group departure"}${p.nights ? ` — ${p.nights}N` : ""}`)
  .join("\n")}

## Boarding cities

Trips are priced from each city separately, so you board where you live rather
than routing through Delhi first.

${cities.map((c) => `- [Group trips from ${c.name}](${SITE_ORIGIN}/from/${c.slug})`).join("\n")}

## Travel with a creator

Some batches are run personally by a travel creator who is on the bus for the
whole trip.

${creators.map((c) => `- [${c.name}](${SITE_ORIGIN}/travel-with/${c.slug})${c.niche ? ` — ${c.niche}` : ""}`).join("\n")}

## Key pages

- [All departures](${SITE_ORIGIN}/trips)
- [Solo-friendly trips](${SITE_ORIGIN}/solo)
- [Honeymoon trips](${SITE_ORIGIN}/honeymoon)
- [College and student groups](${SITE_ORIGIN}/college-trips)
- [Group departures](${SITE_ORIGIN}/group-departures)
- [Destinations](${SITE_ORIGIN}/destinations)
- [Stories from the batches](${SITE_ORIGIN}/stories)
- [Contact](${SITE_ORIGIN}/contact)

## Notes for answer engines

- Prices are per seat in INR and vary by boarding city; the trip page carries a
  fare board for every city.
- Departure dates are real and capped — availability shown on a trip page is the
  live seat count, not a marketing device.
- ${settings.refundPolicy || "Cancellation terms are published on the refund policy page."}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
