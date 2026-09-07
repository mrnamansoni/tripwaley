#!/usr/bin/env node
/**
 * Which dates the booking bar may offer.
 *
 * Run: node scripts/test-departure-dates.mjs
 *
 * A real paid booking reached the CRM with `departureDate: null`. The trip's
 * batches existed only on the creator's record; the booking bar reads the
 * shared `departures` collection, found nothing, rendered no date picker, and
 * its hero CTA submitted an empty date that every layer downstream accepted.
 *
 * So creator dates now fill that gap — and, just as importantly, ONLY that gap.
 * Merging the two lists would put seats back on sale for a batch ops had
 * deliberately deleted from the departures list, which is worse than the bug.
 */

import assert from "node:assert/strict";
import { resolveBarDepartures } from "../src/lib/departureDates.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const CITIES = ["delhi", "jaipur"];
const SHARED = [
  { date: "2026-10-26", citySlugs: ["delhi"] },
  { date: "2026-11-19", citySlugs: ["delhi", "jaipur"] },
];

console.log("\ndepartures — the shared list is authoritative when it has anything");
{
  const out = resolveBarDepartures(SHARED, ["2026-12-25"], CITIES);
  assert.deepEqual(out, SHARED, "the shared list must be returned untouched");
  assert.ok(
    !out.some((d) => d.date === "2026-12-25"),
    "a creator date must NOT be merged in — ops deleted batches would come back on sale"
  );
  ok("creator dates are ignored entirely when the shared list is non-empty");
}

console.log("\ndepartures — the gap that produced a dateless paid booking");
{
  assert.deepEqual(resolveBarDepartures([], [], CITIES), [], "nothing in, nothing out");
  ok("no dates anywhere still yields an empty list, so the bar can say so honestly");

  const out = resolveBarDepartures([], ["2026-11-05", "2026-12-01"], CITIES);
  assert.equal(out.length, 2, "the creator's dates must become bookable");
  assert.deepEqual(out[0], { date: "2026-11-05", citySlugs: CITIES });
  ok("creator dates fill an empty shared list");

  assert.deepEqual(
    out.map((d) => d.citySlugs),
    [CITIES, CITIES],
    "a creator batch is bookable from every city the trip is priced from"
  );
  ok("each fallback date carries the package's priced cities");
}

console.log("\ndepartures — the fallback is cleaned, not trusted");
{
  const out = resolveBarDepartures([], ["2026-12-01", "2026-11-05", "2026-12-01"], CITIES);
  assert.deepEqual(out.map((d) => d.date), ["2026-11-05", "2026-12-01"]);
  ok("duplicates are dropped and the list comes back in date order");

  // a malformed date renders as "Invalid Date" and submits as garbage — exactly
  // the class of value that caused this bug in the first place
  const dirty = resolveBarDepartures([], ["", "12 Jul", "flexible dates", "2026-11-05", null], CITIES);
  assert.deepEqual(dirty.map((d) => d.date), ["2026-11-05"]);
  ok("blank, label-shaped and null dates are refused, not passed through");

  const many = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
  assert.equal(resolveBarDepartures([], many, CITIES, 12).length, 12);
  ok("the limit is respected, so the picker can't grow unbounded");
}

console.log(`\n${n} assertions passed.\n`);
