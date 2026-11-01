#!/usr/bin/env node
/**
 * Deleting a package or a city must take its dependants with it.
 *
 * Run: node scripts/test-delete-cascade.mjs
 *
 * Prices, departures and creator trips point at a package by slug; prices and
 * departures point at a city by slug. Deleting the parent used to leave those
 * rows behind — inert at best, and a published creator trip silently
 * vanishing at worst. The admin PUT now cascades a deletion, but only when it
 * is unambiguous: if the same save also introduces a slug that wasn't there
 * before, a "missing" slug might be a rename, and purging its prices would
 * destroy live data. Then nothing is cascaded.
 */

import assert from "node:assert/strict";
import { applyCityDeletions, applyPackageDeletions, detectDeletions } from "../src/lib/slugCascade.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const cat = () => ({
  packages: [{ slug: "spiti" }, { slug: "kasol" }],
  cities: [{ slug: "delhi" }, { slug: "jaipur" }],
  prices: [
    { packageSlug: "spiti", citySlug: "delhi", triple: 1 },
    { packageSlug: "spiti", citySlug: "jaipur", triple: 2 },
    { packageSlug: "kasol", citySlug: "delhi", triple: 3 },
  ],
  departures: [
    { date: "2026-12-01", packageSlug: "spiti", citySlugs: ["delhi"] },
    { date: "2026-12-02", packageSlug: "kasol", citySlugs: ["delhi", "jaipur"] },
    { date: "2026-12-03", packageSlug: "kasol", citySlugs: ["jaipur"] },
  ],
  creators: [
    { slug: "asha", trips: [{ packageSlug: "spiti" }, { packageSlug: "kasol" }] },
  ],
  slugAliases: { "spiti-old": "spiti", "kasol-old": "kasol" },
});

console.log("\ndetectDeletions — only when it can't be a rename");
{
  assert.deepEqual(detectDeletions(["a", "b", "c"], ["a", "c"]), ["b"]);
  ok("a slug missing from the save is a deletion");
  assert.deepEqual(detectDeletions(["a", "b"], ["a", "b"]), []);
  ok("nothing missing, nothing deleted");
  assert.deepEqual(detectDeletions(["a", "b"], ["a", "z"]), []);
  ok("a missing slug alongside a NEW slug may be a rename — refuse to guess");
  assert.deepEqual(detectDeletions(["a", "b"], ["a", "", "a"]), ["b"]);
  ok("blank and duplicate slugs in the save are ignored");
}

console.log("\napplyPackageDeletions");
{
  const c = cat();
  const r = applyPackageDeletions(c, ["spiti"]);
  assert.deepEqual(c.prices.map((p) => p.packageSlug), ["kasol"]);
  assert.deepEqual(c.departures.map((d) => d.date), ["2026-12-02", "2026-12-03"]);
  assert.deepEqual(c.creators[0].trips.map((t) => t.packageSlug), ["kasol"]);
  assert.deepEqual(c.slugAliases, { "kasol-old": "kasol" });
  assert.deepEqual(r, { prices: 2, departures: 1, creatorTrips: 1 });
  ok("drops its prices, departures, creator trips and aliases — and counts them");
  const untouched = cat();
  applyPackageDeletions(untouched, []);
  assert.deepEqual(untouched, cat());
  ok("no deletions leaves the catalog exactly as it was");
}

console.log("\napplyCityDeletions");
{
  const c = cat();
  const r = applyCityDeletions(c, ["jaipur"]);
  assert.deepEqual(c.prices.map((p) => `${p.packageSlug}|${p.citySlug}`), ["spiti|delhi", "kasol|delhi"]);
  assert.deepEqual(c.departures.map((d) => [d.date, d.citySlugs]), [
    ["2026-12-01", ["delhi"]],
    ["2026-12-02", ["delhi"]],
  ]);
  assert.deepEqual(r, { prices: 1, departures: 1, departuresTrimmed: 1 });
  ok("drops its prices, strips it from shared batches, drops batches it alone boarded");
}

console.log(`\n${n} passed\n`);
