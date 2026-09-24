#!/usr/bin/env node
/**
 * Live values inside story text.
 *
 * Run: node scripts/test-story-tokens.mjs
 *
 * A price typed into an article is wrong the first time the owner changes it
 * in admin, and nobody goes back to edit 200 articles. So a story writes
 * {{price kedarkantha-solo-winter-trek delhi}} and the page fills it in when
 * it renders. If the trip is gone, the sentence must still read properly and
 * must never show a number that is no longer true.
 */

import assert from "node:assert/strict";
import { expandTokens } from "../src/lib/storyTokens.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const lookup = {
  price: (trip, city) => (trip === "kedarkantha-solo-winter-trek" ? (city === "delhi" ? 8499 : 9299) : undefined),
  nextDeparture: (trip) => (trip === "kedarkantha-solo-winter-trek" ? "12 Dec 2026" : undefined),
};

console.log("\nprice token");
{
  assert.deepEqual(
    expandTokens("From {{price kedarkantha-solo-winter-trek delhi}} per person.", lookup),
    ["From ₹8,499 per person."]
  );
  ok("a price token becomes the live price in Indian format");

  assert.deepEqual(
    expandTokens("From {{price kedarkantha-solo-winter-trek}}.", lookup),
    ["From ₹9,299."]
  );
  ok("the city is optional — the lowest price is used");
}

console.log("\nmissing trip");
{
  assert.deepEqual(expandTokens("Costs {{price gone-trip delhi}} today.", lookup), [
    "Costs ",
    { text: "see current trips", href: "/trips" },
    " today.",
  ]);
  ok("a retired trip becomes a link, never a stale number");
}

console.log("\ndeparture token");
{
  assert.deepEqual(
    expandTokens("Next batch: {{next-departure kedarkantha-solo-winter-trek}}.", lookup),
    ["Next batch: 12 Dec 2026."]
  );
  ok("the next departure is filled in");

  assert.deepEqual(expandTokens("Next batch: {{next-departure gone-trip}}.", lookup), [
    "Next batch: ",
    { text: "see current dates", href: "/trips" },
    ".",
  ]);
  ok("no upcoming date becomes a link to the trips page");
}

console.log("\nplain and malformed text");
{
  assert.deepEqual(expandTokens("No tokens here.", lookup), ["No tokens here."]);
  ok("text without tokens passes through as a single node");
  assert.deepEqual(expandTokens("{{price}} and {{wat foo}}", lookup), ["{{price}} and {{wat foo}}"]);
  ok("a malformed or unknown token is left visible rather than silently dropped");
}

console.log(`\n${n} passed\n`);
