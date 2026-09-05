#!/usr/bin/env node
/**
 * Deleted seed rows must stay deleted — but new ones must still arrive.
 *
 * Run: node scripts/test-seed-guard.mjs
 *
 * Background: the seed catalog shipped in the image carries 54 June 2026
 * departures. mergeSeedContent() adds any seed row the live catalog lacks, so
 * every SEED_VERSION bump used to resurrect every departure the admin had
 * deleted — the "old June dates come back whenever we push" bug.
 *
 * The fix records tombstones. The risk in that fix is over-correcting: if a
 * tombstone is too broad, genuinely NEW seed content stops arriving and the
 * merge becomes useless. Both directions are tested here.
 */

import assert from "node:assert/strict";
import {
  SEED_KEY,
  SEED_SECTIONS,
  isSeedSection,
  keysOf,
  collectRemovals,
  removalsForSection,
  mergeRemovals,
  keepForMerge,
} from "../src/lib/seedGuard.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const dep = (date, packageSlug) => ({ date, packageSlug, citySlugs: ["delhi"] });

console.log("\nseed guard — keys match what the merge uses");
{
  assert.equal(SEED_KEY.departures(dep("2026-06-02", "manali")), "2026-06-02|manali");
  assert.equal(SEED_KEY.prices({ packageSlug: "manali", citySlug: "delhi" }), "manali|delhi");
  assert.equal(SEED_KEY.packages({ slug: "manali" }), "manali");
  assert.equal(SEED_KEY.coupons({ code: "firsttrip" }), "FIRSTTRIP", "coupon codes compare uppercase");
  ok("departure/price/package/coupon keys are stable and match mergeSeedContent");

  assert.ok(isSeedSection("departures"));
  assert.ok(!isSeedSection("settings"), "settings is not row-merged, so it has no tombstones");
  assert.equal(SEED_SECTIONS.length, 7);
  ok("only the seven row-merged collections are guarded");
}

console.log("\nseed guard — a deletion is detected");
{
  const seed = {
    departures: [dep("2026-06-02", "manali"), dep("2026-06-09", "manali"), dep("2026-10-10", "spiti")],
    packages: [{ slug: "manali" }, { slug: "spiti" }],
    cities: [], prices: [], colleges: [], coupons: [], creators: [],
  };
  // the admin has cleared out the June batches
  const live = {
    departures: [dep("2026-10-10", "spiti")],
    packages: [{ slug: "manali" }, { slug: "spiti" }],
    cities: [], prices: [], colleges: [], coupons: [], creators: [],
  };

  const removals = collectRemovals(seed, live);
  assert.deepEqual(removals.departures.sort(), ["2026-06-02|manali", "2026-06-09|manali"]);
  assert.equal(removals.packages, undefined, "nothing was deleted from packages");
  ok("both deleted June departures are recorded, and nothing else is");
}

console.log("\nseed guard — a tombstoned row is never re-added");
{
  const removals = { departures: ["2026-06-02|manali", "2026-06-09|manali"] };
  const candidates = [
    dep("2026-06-02", "manali"),   // deleted — must stay gone
    dep("2026-06-09", "manali"),   // deleted — must stay gone
    dep("2027-03-14", "manali"),   // brand new — must arrive
  ];
  const kept = keepForMerge("departures", candidates, removals);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].date, "2027-03-14");
  ok("2 deleted departures blocked, 1 genuinely new one still merges");
}

console.log("\nseed guard — new content is NOT collateral damage");
{
  // the real shape of the bug's fix: 54 tombstones must not block a new batch
  const dead = Array.from({ length: 54 }, (_, i) =>
    `2026-06-${String(i % 28 + 1).padStart(2, "0")}|manali`);
  const fresh = [dep("2027-05-01", "ladakh"), dep("2027-05-08", "ladakh")];
  const kept = keepForMerge("departures", [...fresh], { departures: dead });
  assert.equal(kept.length, 2, "a big tombstone list must not block unrelated new rows");
  ok("54 tombstones do not stop 2 new departures arriving");

  // and with no tombstones at all, nothing is filtered
  assert.equal(keepForMerge("departures", [...fresh], undefined).length, 2);
  assert.equal(keepForMerge("departures", [...fresh], {}).length, 2);
  ok("an install with no tombstones behaves exactly as before");
}

console.log("\nseed guard — re-adding a row clears its tombstone");
{
  const seed = { departures: [dep("2026-06-02", "manali"), dep("2026-06-09", "manali")],
                 packages: [], cities: [], prices: [], colleges: [], coupons: [], creators: [] };

  // admin deletes both
  let gone = removalsForSection(seed, "departures", []);
  assert.deepEqual(gone.sort(), ["2026-06-02|manali", "2026-06-09|manali"]);

  // admin changes their mind and puts one back
  gone = removalsForSection(seed, "departures", [dep("2026-06-02", "manali")]);
  assert.deepEqual(gone, ["2026-06-09|manali"], "the restored row must lose its tombstone");
  ok("a section's tombstones are recomputed from what was saved, not accumulated");
}

console.log("\nseed guard — tombstones survive across sections and merges");
{
  const merged = mergeRemovals(
    { departures: ["a|x"], packages: ["p1"] },
    { departures: ["b|y"], cities: ["delhi"] }
  );
  assert.deepEqual(merged.departures.sort(), ["a|x", "b|y"]);
  assert.deepEqual(merged.packages, ["p1"]);
  assert.deepEqual(merged.cities, ["delhi"]);
  ok("the one-time migration capture unions with anything already recorded");

  const deduped = mergeRemovals({ departures: ["a|x"] }, { departures: ["a|x"] });
  assert.deepEqual(deduped.departures, ["a|x"]);
  ok("repeated captures don't duplicate a tombstone");
}

console.log("\nseed guard — a fresh install records nothing");
{
  const seed = { departures: [dep("2026-06-02", "manali")], packages: [{ slug: "manali" }],
                 cities: [], prices: [], colleges: [], coupons: [], creators: [] };
  // ensureSeeded() copies the seed verbatim, so live === seed on day one
  const removals = collectRemovals(seed, JSON.parse(JSON.stringify(seed)));
  assert.deepEqual(removals, {}, "a brand-new install must have no tombstones");
  ok("day-one install starts with a clean slate");
}

console.log("\nseed guard — malformed rows can't poison the key set");
{
  const keys = keysOf("departures", [dep("2026-06-02", "manali"), {}, null, undefined]);
  assert.ok(keys.has("2026-06-02|manali"));
  assert.ok(!keys.has(""), "empty keys are dropped rather than tombstoning everything");
  ok("junk rows are ignored instead of producing an empty-string tombstone");
}

console.log(`\n${n} assertions passed.\n`);
