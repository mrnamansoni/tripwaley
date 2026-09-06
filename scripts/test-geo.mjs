#!/usr/bin/env node
/**
 * Destination coordinates for the trip-page weather card.
 *
 * Run: node scripts/test-geo.mjs
 *
 * The old lookup regex-matched `name + destination + route` CONCATENATED,
 * first-match-wins over an ordered table. Two failures came out of that:
 *
 *   • Trips whose destination the table never listed showed no weather at all
 *     — Lansdowne, Andaman, Meghalaya, Kerala.
 *   • Worse, a trip could match the WRONG entry. "Manali Exploration" has
 *     destination "Manali", but its route mentions Kasol further along, and the
 *     Kasol pattern sits earlier in the table — so the page showed Kasol's
 *     weather on a Manali trip.
 *
 * So specificity beats table order: an explicit per-package coordinate wins,
 * then `destination`, then `name`, and only then the rambling `route`.
 */

import assert from "node:assert/strict";
import { resolveGeo, GEO_TABLE } from "../src/lib/geo.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

console.log("\ngeo — the reported bug: Manali showing Kasol's weather");
{
  const manali = {
    name: "Manali Exploration",
    destination: "Manali",
    route: "Manali → Hadimba Devi Temple → Old Manali → Kasol → Manu Temple → Vashisht",
  };
  const g = resolveGeo(manali);
  assert.equal(g?.place, "Manali", `destination must win over a route mention — got ${g?.place}`);
  ok("a Manali trip whose route mentions Kasol resolves to Manali");
}

console.log("\ngeo — specificity order");
{
  // route alone still works when nothing more specific matches
  const g = resolveGeo({ name: "Winter Escape", destination: "", route: "Delhi → Jibhi → Shoja" });
  assert.equal(g?.place, "Jibhi");
  ok("route is still used when destination and name say nothing");

  // name beats route
  const g2 = resolveGeo({ name: "Rishikesh Weekend", destination: "", route: "Delhi → Haridwar → Kasol" });
  assert.equal(g2?.place, "Rishikesh", "the trip's own name beats a stop on the route");
  ok("name beats route");

  // and an explicit coordinate beats everything
  const g3 = resolveGeo({
    name: "Manali Exploration", destination: "Manali", route: "Kasol",
    lat: 12.34, lng: 56.78, weatherPlace: "Somewhere Specific",
  });
  assert.equal(g3?.lat, 12.34);
  assert.equal(g3?.lng, 56.78);
  assert.equal(g3?.place, "Somewhere Specific");
  ok("an admin-set coordinate overrides the table entirely");
}

console.log("\ngeo — the destinations that had no weather at all");
{
  const cases = [
    ["Lansdowne Weekend Escape", "Lansdowne"],
    ["Andaman Honeymoon — Private Shores", "Andaman"],
    ["Meghalaya Solo Explorer", "Meghalaya"],
    ["Mystic Meghalaya", "Meghalaya"],
    ["Kerala Honeymoon — Hills & Backwaters", "Kerala"],
  ];
  for (const [name, destination] of cases) {
    const g = resolveGeo({ name, destination, route: "" });
    assert.ok(g, `"${name}" still resolves to nothing`);
    assert.ok(Number.isFinite(g.lat) && Number.isFinite(g.lng), `${name} has no usable coordinates`);
  }
  ok("all 5 previously-blank destinations now resolve");
}

console.log("\ngeo — coordinates are plausible for India");
{
  for (const [, geo] of GEO_TABLE) {
    assert.ok(geo.lat > 5 && geo.lat < 37, `${geo.place} latitude ${geo.lat} is outside India`);
    assert.ok(geo.lng > 67 && geo.lng < 98, `${geo.place} longitude ${geo.lng} is outside India`);
    assert.ok(geo.place.trim().length > 0, "every entry needs a display name");
  }
  ok(`all ${GEO_TABLE.length} table entries sit inside India's bounding box`);
}

console.log("\ngeo — an explicit half-coordinate is not trusted");
{
  // lat without lng is a data-entry slip; falling back beats plotting the ocean
  const g = resolveGeo({ name: "Manali Exploration", destination: "Manali", route: "", lat: 32.24 });
  assert.equal(g?.place, "Manali", "an incomplete override must fall back to the table");
  ok("lat without lng falls back rather than resolving to a bogus point");

  const g2 = resolveGeo({ name: "Nowhere", destination: "Nowhere", route: "", lat: 0, lng: 0 });
  assert.equal(g2, null, "0,0 is the Atlantic, not a trip");
  ok("null island is rejected");
}

console.log("\ngeo — an unknown destination resolves to nothing, not a guess");
{
  const g = resolveGeo({ name: "Antarctic Expedition", destination: "Antarctica", route: "" });
  assert.equal(g, null, "showing the wrong city's weather is worse than showing none");
  ok("no match returns null so the card simply doesn't render");
}

console.log(`\n${n} assertions passed.\n`);
