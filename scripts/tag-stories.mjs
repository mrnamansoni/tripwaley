#!/usr/bin/env node
/**
 * One-off: give the six live stories real addresses and SEO tags.
 *
 * Run on the server, against the live catalog:
 *   docker exec <container> node /tmp/tag-stories.mjs
 * Or locally against any catalog file:
 *   node scripts/tag-stories.mjs path/to/catalog.json
 *
 * Four of the six stories live at /stories/new-story-3 … new-story-6, which
 * tell a reader and Google nothing. Renaming them is free as long as the old
 * address keeps working, so each rename records the old slug in `oldSlugs`
 * and /stories/[slug] 308s on it (see resolveStoryAlias in src/lib/stories.ts).
 *
 * Also sets `kind` and `destinations`, which is what puts a story on the trip
 * and destination pages for the place it is about.
 *
 * Safe to run twice: a story already renamed is left alone. The catalog is
 * copied to catalog.backup-<timestamp>.json before anything is written.
 */

import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] ?? "/app/data/catalog.json";

/** old slug -> what it becomes. `to: null` keeps the current slug. */
const PLAN = [
  {
    from: "new-story-3",
    to: "kedarkantha-winter-trek-experience",
    kind: "report",
    destinations: ["kedarkantha"],
  },
  {
    from: "new-story-4",
    to: "kedarnath-trip-with-friends",
    kind: "report",
    // the live trip is Kedarnath–Chopta–Tungnath–Rishikesh; "Chopta & Tungnath"
    // is the destination entry that matches it
    destinations: ["chopta-tungnath"],
  },
  {
    from: "new-story-5",
    to: "solo-trip-with-strangers-under-the-stars",
    kind: "report",
    // the story names no place — the owner tags this one
    destinations: [],
  },
  {
    from: "new-story-6",
    to: "manali-solo-trip-made-new-friends",
    kind: "report",
    destinations: ["manali"],
  },
  {
    from: "my-first-snowfall-experience",
    to: null,
    kind: "report",
    destinations: ["manali"],
  },
  {
    from: "a-trip-through-triund-jibhi-beyond",
    to: null,
    kind: "report",
    destinations: ["mcleodganj-triund", "jibhi-tirthan-valley"],
  },
];

const cat = JSON.parse(fs.readFileSync(file, "utf8"));
const posts = cat.posts ?? [];
if (posts.length === 0) {
  console.error(`No stories in ${file} — nothing to do. Is this the live catalog?`);
  process.exit(1);
}

const backup = path.join(path.dirname(file), `catalog.backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.copyFileSync(file, backup);
console.log(`backup: ${backup}\n`);

let changed = 0;
for (const step of PLAN) {
  // find it under its old address, or under the new one if this already ran
  const post = posts.find((p) => p.slug === step.from) ?? (step.to ? posts.find((p) => p.slug === step.to) : undefined);
  if (!post) {
    console.log(`skip   ${step.from} — not in this catalog`);
    continue;
  }

  const before = post.slug;
  if (step.to && post.slug !== step.to) {
    post.oldSlugs = [...new Set([...(post.oldSlugs ?? []), post.slug])];
    post.slug = step.to;
  }
  post.kind = step.kind;
  if (step.destinations.length > 0) post.destinations = step.destinations;
  // these six are published today; make that explicit in the new field
  post.status = post.published === false ? "draft" : "published";

  changed++;
  const moved = before === post.slug ? "" : `  (was /stories/${before})`;
  console.log(`tag    /stories/${post.slug}${moved}\n       ${step.kind} · ${post.destinations?.length ? post.destinations.join(", ") : "NO DESTINATION — tag this one in admin"}`);
}

/* Written the same way the app writes it (store.ts:219): indent 1, and a
   temp file renamed into place, so a request that reads the catalog while
   this runs can never see a half-written file. */
const tmp = `${file}.tmp-${process.pid}`;
fs.writeFileSync(tmp, JSON.stringify(cat, null, 1));
fs.renameSync(tmp, file);
console.log(`\n${changed} stories updated in ${file}`);
