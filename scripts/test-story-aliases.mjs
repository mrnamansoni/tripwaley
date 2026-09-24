#!/usr/bin/env node
/**
 * Renaming a story slug must not throw away its URL.
 *
 * Run: node scripts/test-story-aliases.mjs
 *
 * Four live stories sit at /stories/new-story-3 … new-story-6, which say
 * nothing to a reader or to Google. Renaming them to their titles is worth
 * doing, and costs nothing as long as the old address redirects.
 */

import assert from "node:assert/strict";
import { resolveStoryAlias } from "../src/lib/stories.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const post = (slug, over = {}) => ({
  slug, title: "T", excerpt: "", cover: "/c.jpg", body: "b", author: "A",
  date: "2026-09-01", tags: [], published: true, ...over,
});

{
  const all = [post("manali-first-snowfall", { oldSlugs: ["new-story-6"] })];
  assert.equal(resolveStoryAlias("new-story-6", all), "manali-first-snowfall");
  ok("an old slug resolves to the story that replaced it");
  assert.equal(resolveStoryAlias("unknown", all), undefined);
  ok("an unknown slug is not redirected");
}
{
  const all = [post("a", { oldSlugs: ["b"], status: "draft" })];
  assert.equal(resolveStoryAlias("b", all), undefined);
  ok("never redirect to a story that is not live");
}

console.log(`\n${n} passed\n`);
