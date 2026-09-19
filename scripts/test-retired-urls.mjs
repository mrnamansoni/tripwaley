#!/usr/bin/env node
/**
 * Trip URLs Google already indexed must not 404 once the trip is gone.
 *
 * Run: node scripts/test-retired-urls.mjs
 *
 * Search Console (19 Sept 2026) listed 13 indexed trip URLs that now 404 —
 * packages drafted, deleted or recreated under a new slug before slug aliases
 * existed. Each one gets a permanent redirect to the live trip that replaced
 * it, so the ranking those pages earned moves instead of evaporating.
 */

import assert from "node:assert/strict";
import { RETIRED_TRIPS, retiredTripTarget } from "../src/lib/retiredUrls.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const live = new Set(["mcleodganj-triund-trek", "chopta-tungnath"]);
const isLive = (s) => live.has(s);

console.log("\nretired trips — redirect to the replacement");
{
  assert.equal(retiredTripTarget("star-gazing-himachal", isLive), "/trips/mcleodganj-triund-trek");
  ok("a retired slug points at its live replacement");
}
{
  assert.equal(retiredTripTarget("golden-tringle-of-uttrakhand", isLive), "/trips");
  ok("a replacement that is itself gone falls back to /trips, never a 404 chain");
}
{
  assert.equal(retiredTripTarget("some-new-trip", isLive), undefined);
  ok("an unknown slug is not redirected — it 404s as it should");
}
{
  for (const [from, to] of Object.entries(RETIRED_TRIPS)) {
    assert.notEqual(from, to, `${from} redirects to itself`);
    assert.ok(!(to in RETIRED_TRIPS), `${from} -> ${to} is a chain`);
  }
  ok("no entry redirects to itself or to another retired slug");
}

console.log(`\n${n} passed\n`);
