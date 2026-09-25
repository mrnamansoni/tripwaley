#!/usr/bin/env node
/**
 * Renaming a story in the admin must not throw away its URL.
 *
 * Run: node scripts/test-story-cascade.mjs
 *
 * /stories/[slug] already 308s from an old address recorded in `oldSlugs`
 * (resolveStoryAlias). Until now the only thing that ever wrote `oldSlugs`
 * was a one-off script on the server, so an owner renaming a story in the
 * admin silently broke every link and every Google result pointing at it —
 * exactly the failure the packages side already solved in slugCascade.ts.
 */

import assert from "node:assert/strict";
import { detectStoryRenames, applyStoryRenames } from "../src/lib/storyCascade.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const post = (slug, over = {}) => ({
  slug, title: "T", excerpt: "", cover: "/c.jpg", body: "b", author: "A",
  date: "2026-09-01", tags: [], published: true, ...over,
});

console.log("\ndetecting a rename");
{
  const before = [post("new-story-6"), post("keep")];
  const after = [post("manali-solo-trip"), post("keep")];
  assert.deepEqual(detectStoryRenames(before, after), [{ from: "new-story-6", to: "manali-solo-trip" }]);
  ok("a slug changed in place is a rename");
}
{
  const before = [post("a")];
  const after = [post("a"), post("b")];
  assert.deepEqual(detectStoryRenames(before, after), []);
  ok("adding a story is not a rename — positions no longer line up, so refuse to guess");
}
{
  const before = [post("a"), post("b")];
  const after = [post("b"), post("a")];
  assert.deepEqual(detectStoryRenames(before, after), []);
  ok("two stories swapping slugs is not a clean rename");
}

console.log("\nrecording the old address");
{
  const posts = [post("manali-solo-trip")];
  const moved = applyStoryRenames(posts, [{ from: "new-story-6", to: "manali-solo-trip" }]);
  assert.equal(moved, 1);
  assert.deepEqual(posts[0].oldSlugs, ["new-story-6"]);
  ok("the old address is recorded on the renamed story");
}
{
  const posts = [post("c", { oldSlugs: ["a"] })];
  applyStoryRenames(posts, [{ from: "b", to: "c" }]);
  assert.deepEqual(posts[0].oldSlugs, ["a", "b"]);
  ok("renamed twice: BOTH old addresses keep working, in one hop each");
}
{
  const posts = [post("c", { oldSlugs: ["b"] })];
  applyStoryRenames(posts, [{ from: "b", to: "c" }]);
  assert.deepEqual(posts[0].oldSlugs, ["b"]);
  ok("the same old address is never recorded twice");
}
{
  const posts = [post("b"), post("a", { oldSlugs: ["b"] })];
  applyStoryRenames(posts, [{ from: "x", to: "b" }]);
  assert.deepEqual(posts[1].oldSlugs, [], "a slug reused by a live story must stop being an alias");
  ok("a slug that becomes a real story again stops redirecting elsewhere");
}

console.log(`\n${n} passed\n`);
