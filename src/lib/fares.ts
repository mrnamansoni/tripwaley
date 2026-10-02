/* FARES — which price a visitor from a given city is shown.
 *
 * A city sees its OWN fare or nothing. Six places used to read
 * `prices[city] ?? Object.values(prices)[0]`, so a visitor from Kochi saw
 * Delhi's rate labelled "ex-Kochi", then the server (which prices strictly per
 * city) refused the booking at the payment step. Unpriced reads as "on
 * request". Tests: scripts/test-fares.mjs.
 *
 * No runtime imports: the test runs this file directly under Node. */

import type { PriceRule } from "./types";

/** The visitor's city's fare from a city → fare map, or undefined. */
export function fareFor(prices: Record<string, number>, citySlug: string): number | undefined {
  const v = prices[citySlug];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
}

const cheapest = (rule: PriceRule): number[] =>
  [rule.triple, rule.double, rule.quad].filter((r): r is number => typeof r === "number" && Number.isFinite(r) && r > 0);

/** Cheapest fare for a trip. With a city: that city's rules only, never
 *  another city's. Without one: the cheapest fare anywhere, which is only
 *  honest when it is not labelled with a city. */
export function lowestFare(rows: PriceRule[], packageSlug: string, citySlug?: string): number | undefined {
  const rates = rows
    .filter((r) => r.packageSlug === packageSlug && (citySlug === undefined || r.citySlug === citySlug))
    .flatMap(cheapest);
  return rates.length ? Math.min(...rates) : undefined;
}
