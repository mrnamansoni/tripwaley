#!/usr/bin/env node
/**
 * Renaming a package slug must not throw away its URL.
 *
 * Run: node scripts/test-slug-aliases.mjs
 *
 * Renaming a slug in the admin already cascades through prices, departures and
 * creator trips — but the OLD URL just started 404ing, losing whatever ranking
 * and inbound links that address had earned. That is precisely what makes an
 * owner unwilling to fix a typo in a slug, and there is one to fix:
 * /trips/rajasthan-bagpacking-from-ayodhaya misspells both "backpacking" and
 * "ayodhya", in the URL and the title.
 *
 * So a rename now records an alias, and /trips/[slug] redirects on it.
 */

import assert from "node:assert/strict";
import { applySlugRenames, detectSlugRenames } from "../src/lib/slugCascade.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const cat = (packages, extra = {}) => ({
  packages, prices: [], departures: [], creators: [], cities: [], ...extra,
});

console.log("\nslug aliases — the old URL keeps working");
{
  const c = cat([{ slug: "rajasthan-backpacking-from-ayodhya", status: "live" }]);
  applySlugRenames(c, [{ from: "rajasthan-bagpacking-from-ayodhaya", to: "rajasthan-backpacking-from-ayodhya" }]);
  assert.equal(c.slugAliases["rajasthan-bagpacking-from-ayodhaya"], "rajasthan-backpacking-from-ayodhya");
  ok("a rename records the old slug as an alias of the new one");
}

console.log("\nslug aliases — renamed twice still resolves in ONE hop");
{
  /* Chained redirects lose PageRank and Google gives up after a few. If a slug
     is renamed a → b and later b → c, the alias for `a` must point at `c`, not
     at `b` — otherwise the original URL 301s to a URL that 301s again. */
  const c = cat([{ slug: "b", status: "live" }]);
  applySlugRenames(c, [{ from: "a", to: "b" }]);
  c.packages = [{ slug: "c", status: "live" }];
  applySlugRenames(c, [{ from: "b", to: "c" }]);
  assert.equal(c.slugAliases["a"], "c", "the original URL must jump straight to the current slug");
  assert.equal(c.slugAliases["b"], "c");
  ok("a → b → c leaves a pointing directly at c, never at b");
}

console.log("\nslug aliases — a slug reused as a real package stops redirecting");
{
  /* If "kasol" is renamed away and later a NEW package takes the slug "kasol",
     the alias must not survive: redirecting a live package's own URL elsewhere
     would make it unreachable. */
  const c = cat([{ slug: "kasol-2026", status: "live" }]);
  applySlugRenames(c, [{ from: "kasol", to: "kasol-2026" }]);
  assert.equal(c.slugAliases["kasol"], "kasol-2026");

  c.packages = [{ slug: "kasol", status: "live" }];
  applySlugRenames(c, [{ from: "kasol-2026", to: "kasol" }]);
  assert.equal(c.slugAliases["kasol"], undefined, "a slug that is a real package again must not be an alias");
  ok("renaming back releases the alias instead of trapping the page in a loop");
}

console.log("\nslug aliases — existing aliases are preserved, not replaced");
{
  const c = cat([{ slug: "y", status: "live" }], { slugAliases: { old: "kept" } });
  applySlugRenames(c, [{ from: "x", to: "y" }]);
  assert.equal(c.slugAliases.old, "kept", "an unrelated alias must survive a later rename");
  assert.equal(c.slugAliases.x, "y");
  ok("unrelated aliases from earlier renames survive");
}

console.log("\nslug aliases — nothing is recorded when nothing was renamed");
{
  const before = [{ slug: "a" }, { slug: "b" }];
  assert.deepEqual(detectSlugRenames(before, before), [], "identical arrays are not a rename");
  const c = cat([{ slug: "a", status: "live" }]);
  applySlugRenames(c, []);
  assert.equal(c.slugAliases, undefined, "a no-op rename must not create an alias map");
  ok("a no-op leaves the catalog untouched");
}

console.log(`\n${n} assertions passed.\n`);
