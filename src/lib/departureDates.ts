/**
 * Which dates the booking bar is allowed to offer.
 *
 * A trip's departures live in TWO places and they can disagree: the shared
 * `departures` collection edited in Admin → Departures, and the per-trip
 * `dates` on a creator's record. The booking bar only ever read the first, so a
 * package whose batches existed only on a creator record gave the bar nothing
 * to offer AND nothing to fall back on — its hero CTA submitted a booking with
 * an empty departure date, which is how a PAID order reached the CRM with
 * `departureDate: null`.
 *
 * The rule is a fallback, deliberately not a merge: creator dates fill the gap
 * only when the shared list is empty for that package. Merging would resurrect
 * dates ops had removed from the departures list on purpose, which is a worse
 * failure than the one being fixed — it would sell seats on a cancelled batch.
 *
 * Pure and importless, so scripts/test-departure-dates.mjs can exercise it.
 */

export interface BarDeparture {
  date: string;
  citySlugs: string[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function resolveBarDepartures(
  /** what the shared departures collection has for this package */
  shared: BarDeparture[],
  /** the creator's own dates for this trip, if we're on a creator page */
  fallbackDates: string[],
  /** the cities this package is priced from — a creator date is bookable from
   *  all of them, since the creator's batch is the batch */
  citySlugs: string[],
  limit = 12
): BarDeparture[] {
  if (shared.length) return shared;

  return [...new Set(fallbackDates)]
    // a malformed date would render as "Invalid Date" and submit as garbage
    .filter((d) => ISO.test(d))
    .sort()
    .slice(0, limit)
    .map((date) => ({ date, citySlugs }));
}
