/* RETIRED URLS — addresses Google indexed that no longer exist.
 *
 * Search Console's 19 Sept 2026 export listed 13 indexed trip URLs that now
 * 404: packages drafted, deleted or recreated under a new slug before the
 * admin recorded slug aliases (see slugCascade.ts). Each maps to the live trip
 * that replaced it, matched on route, so the ranking moves with a 301.
 *
 * Only consulted when no live package owns the slug, so reusing one of these
 * slugs for a real trip later simply wins over the redirect. */

export const RETIRED_TRIPS: Record<string, string> = {
  "star-gazing-himachal": "mcleodganj-triund-trek", // Mcleodganj, Triund
  "the-himalayan-saga": "mcleodganj-triund-trek", // Mcleodganj, Triund, Bir
  "bunny-s-himalayan-escape": "jibhi-sojha-raghupur-fort",
  "jibhi-shoja-raghupur-fort-trip": "jibhi-sojha-raghupur-fort",
  "bunny-s-himalayan-short-escape": "jibhi-shoja-raghupur-fort-short-trip",
  "golden-tringle-of-uttrakhand": "kedarnath-chopta-tungnath-rishikesh",
  "kedarnath--chopta--tungnath--rishikesh": "kedarnath-chopta-tungnath-rishikesh",
  "mini-switzerland-chopta": "chopta-tungnath",
  "manali-summer-snow-explore": "manali-jispa-keylong-baralacha-la-pass",
  "udaipur-golden-circuit": "udaipur-short-trip-from-delhi",
  "udaipur-trip-from-delhi": "udaipur-short-trip-from-delhi",
  "rajasthan-bagpacking-from-dehradun": "udaipur-trip-from-dehradun",
  // Shimla–Kufri: no live trip covers it, so the listing is the honest target
  "himachal-s-queen": "",
};

/** Where a retired trip slug should go, or undefined if it was never retired.
 *  A replacement that has itself gone falls back to /trips — one hop, never a
 *  redirect into a 404. */
export function retiredTripTarget(slug: string, isLive: (slug: string) => boolean): string | undefined {
  if (!Object.hasOwn(RETIRED_TRIPS, slug)) return undefined;
  const to = RETIRED_TRIPS[slug];
  return to && isLive(to) ? `/trips/${to}` : "/trips";
}
