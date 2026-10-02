#!/usr/bin/env node
/**
 * Fares — which price a visitor from a given city is shown.
 *
 * Run: node scripts/test-fares.mjs
 *
 * The rule: a city sees ITS OWN fare or nothing. Six places used to read
 * `prices[city] ?? Object.values(prices)[0]`, so a visitor from Kochi was shown
 * Delhi's rate labelled "ex-Kochi", and the server then refused to take the
 * booking at that price (it prices strictly per city). "On request" is honest;
 * a borrowed number is not.
 */

import assert from "node:assert/strict";
import { fareFor, lowestFare } from "../src/lib/fares.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

console.log("\nfareFor — a map of city → fare, as client components receive it");
{
  const prices = { delhi: 11500, dehradun: 9999 };
  assert.equal(fareFor(prices, "delhi"), 11500);
  ok("a priced city gets its own fare");
  assert.equal(fareFor(prices, "kochi"), undefined);
  ok("an unpriced city gets nothing — never Delhi's fare");
  assert.equal(fareFor({}, "delhi"), undefined);
  ok("a trip with no prices at all gets nothing");
  assert.equal(fareFor({ delhi: 0 }, "delhi"), undefined);
  ok("a zero fare is treated as unpriced, not as free");
}

console.log("\nlowestFare — price rules as the catalog stores them");
{
  const rows = [
    { packageSlug: "kasol", citySlug: "delhi", triple: 6999, double: 7999 },
    { packageSlug: "kasol", citySlug: "dehradun", triple: 5999, double: 6999 },
    { packageSlug: "spiti", citySlug: "delhi", quad: 21000, triple: 24500 },
  ];
  assert.equal(lowestFare(rows, "kasol", "delhi"), 6999);
  ok("a city's cheapest room type is its 'from' price");
  assert.equal(lowestFare(rows, "kasol", "kochi"), undefined);
  ok("asking for an unpriced city returns nothing, not another city's fare");
  assert.equal(lowestFare(rows, "kasol"), 5999);
  ok("with no city asked for, the cheapest fare anywhere is the honest 'from' price");
  assert.equal(lowestFare(rows, "spiti", "delhi"), 21000);
  ok("quad counts when it is the cheapest room");
  assert.equal(lowestFare(rows, "ladakh"), undefined);
  ok("a trip with no price rules has no price");
  assert.equal(lowestFare([{ packageSlug: "x", citySlug: "delhi" }], "x", "delhi"), undefined);
  ok("a rule with no rates set is unpriced");
}

console.log(`\n${n} passed\n`);
