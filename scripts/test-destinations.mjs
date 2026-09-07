#!/usr/bin/env node
/**
 * The destination taxonomy behind /destinations/[slug].
 *
 * Run: node scripts/test-destinations.mjs
 *
 * The page this replaces grouped trips with a hardcoded regex list matched
 * against `name + destination + route` CONCATENATED, first-match-wins. It failed
 * the same two ways the old weather lookup did:
 *
 *   • Anything the list didn't name was invisible. Kerala, Andaman and both
 *     Meghalaya trips matched no group and appeared nowhere on /destinations.
 *   • Concatenation threw away the information that would have decided a tie: a
 *     Manali trip whose route mentions Kasol could be filed under Kasol.
 *
 * So matching is by specificity — destination, then name, then route — and a
 * package that matches nothing is a bug this file is meant to catch.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DESTINATIONS, destinationsFor, getDestination } from "../src/lib/destinations.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

console.log("\ndestinations — specificity beats route mentions");
{
  const manali = {
    name: "Manali Exploration",
    destination: "Manali",
    route: "Manali → Hadimba → Old Manali → Kasol → Vashisht",
  };
  const hits = destinationsFor(manali).map((d) => d.slug);
  assert.deepEqual(hits, ["manali"], `route mention of Kasol must not win — got ${hits}`);
  ok("a Manali trip whose route passes Kasol is filed under Manali");

  // route is still used when nothing more specific says anything
  const vague = { name: "Winter Escape", destination: "", route: "Delhi → Jibhi → Shoja" };
  assert.deepEqual(destinationsFor(vague).map((d) => d.slug), ["jibhi-tirthan-valley"]);
  ok("route is consulted when destination and name are silent");

  const byName = { name: "Rishikesh Solo Weekend", destination: "", route: "Delhi → Haridwar" };
  assert.deepEqual(destinationsFor(byName).map((d) => d.slug), ["rishikesh"]);
  ok("the trip's own name beats a stop on the route");
}

console.log("\ndestinations — a trip really can belong to two places");
{
  const both = { name: "Golden Triangle of Uttarakhand", destination: "Chopta · Tungnath · Rishikesh", route: "" };
  const hits = destinationsFor(both).map((d) => d.slug).sort();
  assert.deepEqual(hits, ["chopta-tungnath", "rishikesh"]);
  ok("a two-destination trip is listed under both, not silently assigned to one");
}

console.log("\ndestinations — EVERY live package is reachable");
{
  /* The regression that matters: a package matching no destination appears on
     no landing page and is invisible to that whole surface. */
  const cat = JSON.parse(readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8"));
  const live = cat.packages.filter((p) => p.status === "live");
  const orphans = live.filter((p) => destinationsFor(p).length === 0).map((p) => p.slug);
  assert.deepEqual(orphans, [], `these live packages match no destination: ${orphans.join(", ")}`);
  ok(`all ${live.length} live packages match at least one destination`);
}

console.log("\ndestinations — the taxonomy itself is well-formed");
{
  const slugs = DESTINATIONS.map((d) => d.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in DESTINATIONS");
  ok("slugs are unique");

  for (const d of DESTINATIONS) {
    assert.match(d.slug, /^[a-z0-9-]+$/, `${d.slug} is not URL-safe`);
    // a name is a place name — "Goa" and "Manali" are perfectly valid lengths
    for (const field of ["name", "state"]) {
      assert.ok(d[field]?.trim().length >= 3, `${d.slug}.${field} is missing`);
    }
    // a tagline is one line under the h1; it is meant to be short
    assert.ok(d.tagline.trim().length > 20, `${d.slug}.tagline is missing`);
    // the planning answers are the ones that must actually say something —
    // "best time: all year round" is the non-answer these pages exist to avoid
    for (const field of ["bestTime", "gettingThere", "know"]) {
      assert.ok(d[field]?.trim().length > 80, `${d.slug}.${field} is too thin to be worth reading`);
    }
    // the editorial fields are the only reason these pages deserve indexing —
    // a stub would make them the thin doorway pages they exist to replace
    assert.ok(d.intro.length >= 120, `${d.slug}.intro is too thin (${d.intro.length} chars)`);
    assert.ok(d.image.startsWith("/"), `${d.slug}.image must be a site-relative path`);
  }
  ok(`all ${DESTINATIONS.length} entries carry real editorial content`);

  assert.equal(getDestination("spiti")?.name, "Spiti Valley");
  assert.equal(getDestination("no-such-place"), undefined);
  ok("lookup by slug works and returns undefined for an unknown place");
}

console.log("\ndestinations — an unknown place matches nothing, rather than guessing");
{
  assert.deepEqual(destinationsFor({ name: "Antarctic Expedition", destination: "Antarctica", route: "" }), []);
  ok("no match returns empty, so no page is generated for it");
}

console.log(`\n${n} assertions passed.\n`);
