#!/usr/bin/env node
/**
 * Story selection — which stories a trip, a destination and a topic page show.
 *
 * Run: node scripts/test-stories.mjs
 *
 * Stories attach to DESTINATIONS, not to trips: a trip slug can be renamed or
 * retired (13 were, on 2026-09-19) and the writing must survive it. So a trip
 * page asks "what is written about the places this trip goes to".
 */

import assert from "node:assert/strict";
import {
  storyKind, isStoryLive, liveStories, storiesForDestination,
  storiesForPackage, groupByKind, readingMinutes, duplicateKeywords, STORY_KINDS,
} from "../src/lib/stories.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const post = (over = {}) => ({
  slug: "s", title: "T", excerpt: "", cover: "/c.jpg", body: "b",
  author: "Tripwaley", date: "2026-09-01", tags: [], published: true, ...over,
});

console.log("\nstory kind");
{
  assert.equal(storyKind(post()), "report");
  ok("a story with no kind is a trip report — what the 6 existing ones are");
  assert.equal(storyKind(post({ kind: "cost" })), "cost");
  ok("an explicit kind wins");
  assert.equal(storyKind(post({ kind: "nonsense" })), "report");
  ok("an unknown kind falls back to report rather than throwing");
}

console.log("\nlive vs draft");
{
  assert.equal(isStoryLive(post({ published: true })), true);
  ok("an old row with published:true and no status is live");
  assert.equal(isStoryLive(post({ published: true, status: "draft" })), false);
  ok("status:draft beats published:true — a draft never reaches the site");
  assert.equal(isStoryLive(post({ published: false, status: "published" })), true);
  ok("status:published is enough on a new row");
  assert.equal(isStoryLive(post({ published: true, status: "approved" })), false);
  ok("approved is not published: a human still has to publish it");
  assert.deepEqual(liveStories([post({ slug: "a" }), post({ slug: "b", status: "draft" })]).map((p) => p.slug), ["a"]);
  ok("liveStories drops drafts");
}

console.log("\nby destination and by package");
{
  const all = [
    post({ slug: "kk-cost", kind: "cost", destinations: ["kedarkantha"] }),
    post({ slug: "spiti-time", kind: "guide", destinations: ["spiti"] }),
    post({ slug: "draft", kind: "guide", destinations: ["kedarkantha"], status: "draft" }),
    post({ slug: "untagged", kind: "guide" }),
  ];
  assert.deepEqual(storiesForDestination("kedarkantha", all).map((p) => p.slug), ["kk-cost"]);
  ok("a destination shows its own live stories only");
  assert.deepEqual(storiesForDestination("goa", all), []);
  ok("a destination with nothing written about it shows nothing");

  const pkg = { name: "Kedarkantha — Solo Winter Trek", destination: "Sankri · Kedarkantha summit", route: "" };
  assert.deepEqual(storiesForPackage(pkg, all).map((p) => p.slug), ["kk-cost"]);
  ok("a trip inherits the stories of the destinations it goes to");
}

console.log("\ngrouping and reading time");
{
  const groups = groupByKind([
    post({ slug: "r", kind: "report" }),
    post({ slug: "g", kind: "guide" }),
    post({ slug: "c", kind: "cost" }),
  ]);
  assert.deepEqual(groups.map((g) => g.kind), ["guide", "cost", "report"]);
  ok("groups come back in reading order, and an empty kind is omitted");
  assert.equal(groups[0].label, STORY_KINDS.find((k) => k.kind === "guide").label);
  ok("each group carries the label the tabs display");

  assert.equal(readingMinutes(Array(400).fill("word").join(" ")), 2);
  ok("400 words is 2 minutes at 225 wpm");
  assert.equal(readingMinutes(""), 1);
  ok("never 0 minutes");
}

console.log("\nduplicate keywords");
{
  const dupes = duplicateKeywords([
    post({ slug: "a", keyword: "kedarkantha trek cost" }),
    post({ slug: "b", keyword: "Kedarkantha Trek Cost " }),
    post({ slug: "c", keyword: "spiti best time" }),
    post({ slug: "d" }),
  ]);
  assert.deepEqual(dupes.get("kedarkantha trek cost"), ["a", "b"]);
  ok("the same keyword, differing in case and spacing, is one clash");
  assert.equal(dupes.size, 1);
  ok("a keyword used once, or missing, is not a clash");
}

console.log(`\n${n} passed\n`);
