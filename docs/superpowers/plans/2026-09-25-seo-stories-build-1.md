# SEO stories, build 1 — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every story is a page that can rank on its own, reachable from the trip it sells, the destination it belongs to and a filterable hub.

**Architecture:** Stories stay `BlogPost` rows in `data/catalog.json` with six new optional fields. All new logic is pure functions in `src/lib/stories.ts` and `src/lib/storyTokens.ts`, tested with the project's `node scripts/test-*.mjs` pattern. Pages read those functions. No client JavaScript: the trip-page section is a `<details>` element, so every link is in the server HTML even while collapsed.

**Tech stack:** Next 16 (App Router, `force-dynamic` root layout), React 19, TypeScript strict, Tailwind v4, file CMS in `data/catalog.json`, `node --experimental-strip-types` test scripts.

## Global constraints

- **Read `node_modules/next/dist/docs/` before relying on any Next behaviour.** This version differs from training data (AGENTS.md).
- Every new `BlogPost` field is **optional**. The 6 existing live stories have none of them and must keep rendering unchanged.
- **No client components.** Nothing in this build gets `"use client"`.
- Stories with `status: "draft"` must never appear on the site or in the sitemap.
- Tests are plain Node scripts in `scripts/`, run with `node scripts/test-<name>.mjs`, using `node:assert/strict` and the `let n = 0; const ok = (label) => ...` pattern from `scripts/test-destinations.mjs`.
- Full verification before any commit that touches a page: `npx tsc --noEmit`, `npx eslint <changed files>`, every `scripts/test-*.mjs`, then `npm run build`.
- Do not push. The owner approves pushes.

## File structure

| File | Responsibility |
|---|---|
| `src/lib/types.ts` (modify) | The 6 new `BlogPost` fields + `StoryKind` |
| `src/lib/catalog.ts` (modify) | `getAllPosts()` — unfiltered rows, so status logic lives in one place |
| `src/lib/stories.ts` (create) | Pure story selection: kind, published test, by destination, by package, grouping, reading time, duplicate keywords |
| `src/lib/storyTokens.ts` (create) | `{{price …}}` / `{{next-departure …}}` expansion into text + link nodes |
| `src/components/site/StoryBody.tsx` (create) | Renders paragraphs with expanded tokens |
| `src/components/site/BeforeYouGo.tsx` (create) | The collapsed trip-page section |
| `src/components/site/StoryCard.tsx` (create) | One card, used by the hub, topic pages and related lists |
| `src/app/stories/page.tsx` (modify) | Hub with destination + topic filters |
| `src/app/stories/topic/[kind]/page.tsx` (create) | Topic landing pages |
| `src/app/stories/[slug]/page.tsx` (modify) | Summary first, FAQ, trip card, token rendering |
| `src/app/trips/[slug]/page.tsx` (modify) | Render `<BeforeYouGo />` |
| `src/app/destinations/[slug]/page.tsx` (modify) | "Guides" list |
| `src/app/sitemap.ts` (modify) | Topic pages; stories filtered by status |
| `scripts/test-stories.mjs`, `scripts/test-story-tokens.mjs` (create) | Tests for the two pure modules |

---

### Task 1: Story model and selection helpers

**Files:**
- Modify: `src/lib/types.ts:182-192` (the `BlogPost` interface)
- Modify: `src/lib/catalog.ts:57` (add `getAllPosts`)
- Create: `src/lib/stories.ts`
- Test: `scripts/test-stories.mjs`

**Interfaces:**
- Consumes: `BlogPost` (src/lib/types.ts), `destinationsFor(pkg)` and `DESTINATIONS` (src/lib/destinations.ts)
- Produces:
  - `type StoryKind = "guide" | "cost" | "seasonal" | "report"`
  - `STORY_KINDS: { kind: StoryKind; label: string; blurb: string }[]`
  - `storyKind(p: BlogPost): StoryKind`
  - `isStoryLive(p: BlogPost): boolean`
  - `liveStories(all: BlogPost[]): BlogPost[]`
  - `storiesForDestination(slug: string, all: BlogPost[]): BlogPost[]`
  - `storiesForPackage(pkg: { name?: string; destination?: string; route?: string }, all: BlogPost[]): BlogPost[]`
  - `groupByKind(posts: BlogPost[]): { kind: StoryKind; label: string; posts: BlogPost[] }[]`
  - `readingMinutes(body: string): number`
  - `duplicateKeywords(all: BlogPost[]): Map<string, string[]>`
  - `getAllPosts(): BlogPost[]` (src/lib/catalog.ts)

- [ ] **Step 1: Write the failing test**

Create `scripts/test-stories.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd /Users/apple/Applications/tripwaley && node scripts/test-stories.mjs`
Expected: `ERR_MODULE_NOT_FOUND` for `../src/lib/stories.ts`.

- [ ] **Step 3: Add the fields to `BlogPost`**

In `src/lib/types.ts`, replace the `BlogPost` interface (lines 182-192) with:

```ts
export type StoryKind = "guide" | "cost" | "seasonal" | "report";
export interface StoryFaq { q: string; a: string }
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  body: string; // paragraphs separated by blank lines
  author: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
  published: boolean;
  /* ---- SEO stories. All optional: the stories written before this build
     have none of them and must keep rendering exactly as they did. ---- */
  /** which section of the site this belongs to; missing = "report" */
  kind?: StoryKind;
  /** destination slugs from DESTINATIONS — the durable link to trips */
  destinations?: string[];
  /** the one search this page is meant to own */
  keyword?: string;
  /** the answer, in 2-3 lines, shown above the body */
  summary?: string;
  faqs?: StoryFaq[];
  /** draft -> approved -> published. Missing = read `published` */
  status?: "draft" | "approved" | "published";
}
```

- [ ] **Step 4: Add `getAllPosts` to the catalog**

In `src/lib/catalog.ts`, directly below line 57 (`export const getPosts = …`), add:

```ts
/** every story row, drafts included — story pages decide liveness themselves
 *  via isStoryLive(), because `published` alone can't express draft/approved */
export const getAllPosts = (): BlogPost[] => readCatalog().posts ?? [];
```

- [ ] **Step 5: Write `src/lib/stories.ts`**

```ts
/* STORIES — which story belongs where.
 *
 * Stories attach to DESTINATIONS rather than to trips. Trip slugs churn: 13
 * indexed trip URLs had to be redirected on 2026-09-19 after packages were
 * drafted, deleted or renamed. A destination does not change, so writing
 * attached to one survives the product churn and keeps its ranking. */

import type { BlogPost, StoryKind } from "./types";
import { destinationsFor } from "./destinations";

export const STORY_KINDS: { kind: StoryKind; label: string; blurb: string }[] = [
  { kind: "guide", label: "Plan", blurb: "Routes, difficulty, best time and what to carry." },
  { kind: "cost", label: "Cost", blurb: "What a trip actually costs, and what changes the number." },
  { kind: "seasonal", label: "By season", blurb: "Where to go this month, and what it looks like when you land." },
  { kind: "report", label: "Trip reports", blurb: "What happened, told by the people who were on the batch." },
];

const KINDS = new Set<string>(STORY_KINDS.map((k) => k.kind));

export function storyKind(p: BlogPost): StoryKind {
  return p.kind && KINDS.has(p.kind) ? p.kind : "report";
}

/** `status` decides when present; otherwise fall back to the old boolean. */
export function isStoryLive(p: BlogPost): boolean {
  return p.status ? p.status === "published" : p.published === true;
}

export const liveStories = (all: BlogPost[]): BlogPost[] => all.filter(isStoryLive);

export function storiesForDestination(slug: string, all: BlogPost[]): BlogPost[] {
  return liveStories(all).filter((p) => (p.destinations ?? []).includes(slug));
}

export function storiesForPackage(
  pkg: { name?: string; destination?: string; route?: string },
  all: BlogPost[]
): BlogPost[] {
  const slugs = new Set(destinationsFor(pkg).map((d) => d.slug));
  if (slugs.size === 0) return [];
  return liveStories(all).filter((p) => (p.destinations ?? []).some((d) => slugs.has(d)));
}

export function groupByKind(posts: BlogPost[]): { kind: StoryKind; label: string; posts: BlogPost[] }[] {
  return STORY_KINDS.map(({ kind, label }) => ({
    kind,
    label,
    posts: posts.filter((p) => storyKind(p) === kind),
  })).filter((g) => g.posts.length > 0);
}

/** 225 words a minute, never less than one minute */
export const readingMinutes = (body: string): number =>
  Math.max(1, Math.round((body ?? "").trim().split(/\s+/).filter(Boolean).length / 225));

/** keyword (normalised) -> the slugs claiming it, only where more than one does */
export function duplicateKeywords(all: BlogPost[]): Map<string, string[]> {
  const byKeyword = new Map<string, string[]>();
  for (const p of all) {
    const k = (p.keyword ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!k) continue;
    byKeyword.set(k, [...(byKeyword.get(k) ?? []), p.slug]);
  }
  return new Map([...byKeyword].filter(([, slugs]) => slugs.length > 1));
}
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `node scripts/test-stories.mjs`
Expected: `18 passed` (the exact count may differ; every line must be a `✓`).

- [ ] **Step 7: Typecheck and commit**

```bash
npx tsc --noEmit && npx eslint src/lib/stories.ts src/lib/catalog.ts src/lib/types.ts
git add src/lib/types.ts src/lib/catalog.ts src/lib/stories.ts scripts/test-stories.mjs
git commit -m "feat: story model — kind, destinations, keyword, status"
```

---

### Task 2: Live price and departure tokens

**Files:**
- Create: `src/lib/storyTokens.ts`
- Test: `scripts/test-story-tokens.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks (deliberately pure — the caller passes lookups in)
- Produces:
  - `type TokenNode = string | { text: string; href: string }`
  - `expandTokens(text: string, lookup: TokenLookup): TokenNode[]`
  - `interface TokenLookup { price(tripSlug: string, citySlug?: string): number | undefined; nextDeparture(tripSlug: string): string | undefined }`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-story-tokens.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node scripts/test-story-tokens.mjs`
Expected: `ERR_MODULE_NOT_FOUND` for `../src/lib/storyTokens.ts`.

- [ ] **Step 3: Write `src/lib/storyTokens.ts`**

```ts
/* LIVE VALUES IN STORY TEXT.
 *
 * {{price <trip-slug> [city-slug]}} and {{next-departure <trip-slug>}} are
 * filled in when the page renders, so a story can never quote a price the
 * admin has since changed. A token whose trip is gone renders a link, because
 * a wrong number costs more than a missing one. */

export type TokenNode = string | { text: string; href: string };

export interface TokenLookup {
  price(tripSlug: string, citySlug?: string): number | undefined;
  nextDeparture(tripSlug: string): string | undefined;
}

const TOKEN = /\{\{(price|next-departure)\s+([a-z0-9-]+)(?:\s+([a-z0-9-]+))?\}\}/g;

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function expandTokens(text: string, lookup: TokenLookup): TokenNode[] {
  const out: TokenNode[] = [];
  let at = 0;
  let buffer = "";
  const push = (s: string) => { buffer += s; };
  const flush = () => { if (buffer) { out.push(buffer); buffer = ""; } };

  for (const m of (text ?? "").matchAll(TOKEN)) {
    const [raw, kind, trip, city] = m;
    push(text.slice(at, m.index));
    at = m.index + raw.length;

    if (kind === "price") {
      const value = lookup.price(trip, city);
      if (value == null) { flush(); out.push({ text: "see current trips", href: "/trips" }); }
      else push(rupees(value));
    } else {
      const date = lookup.nextDeparture(trip);
      if (!date) { flush(); out.push({ text: "see current dates", href: "/trips" }); }
      else push(date);
    }
  }
  push(text.slice(at));
  flush();
  return out;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node scripts/test-story-tokens.mjs`
Expected: every line a `✓`, ending `9 passed`.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && npx eslint src/lib/storyTokens.ts
git add src/lib/storyTokens.ts scripts/test-story-tokens.mjs
git commit -m "feat: live price and departure tokens for story text"
```

---

### Task 3: Story body component

**Files:**
- Create: `src/components/site/StoryBody.tsx`

**Interfaces:**
- Consumes: `expandTokens`, `TokenLookup` (Task 2); `fromPrice`, `upcomingDepartures`, `shortDate` (src/lib/catalog.ts)
- Produces: `export default function StoryBody({ body }: { body: string })`, and `export function storyLookup(): TokenLookup`

- [ ] **Step 1: Write the component**

```tsx
import Link from "next/link";
import { expandTokens, type TokenLookup } from "@/lib/storyTokens";
import { fromPrice, upcomingDepartures, shortDate } from "@/lib/catalog";

/** the live-value lookups a rendering page hands to expandTokens */
export function storyLookup(): TokenLookup {
  return {
    price: (trip, city) => fromPrice(trip, city),
    nextDeparture: (trip) => {
      const next = upcomingDepartures({ packageSlug: trip, limit: 1 })[0];
      return next ? shortDate(next.date) : undefined;
    },
  };
}

/** Paragraphs split on blank lines, with {{price}} / {{next-departure}}
 *  filled in from the live catalog. */
export default function StoryBody({ body }: { body: string }) {
  const lookup = storyLookup();
  const paras = (body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/80">
      {paras.map((para, i) => (
        <p key={i}>
          {expandTokens(para, lookup).map((node, j) =>
            typeof node === "string" ? (
              node
            ) : (
              <Link key={j} href={node.href} className="font-semibold text-brand underline underline-offset-2 hover:text-brand-bright">
                {node.text}
              </Link>
            )
          )}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npx eslint src/components/site/StoryBody.tsx
git add src/components/site/StoryBody.tsx
git commit -m "feat: story body renders live price and departure tokens"
```

---

### Task 4: Story page — summary, FAQ, trip card

**Files:**
- Modify: `src/app/stories/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllPosts` (Task 1), `isStoryLive`, `storyKind`, `readingMinutes`, `STORY_KINDS`, `storiesForDestination` (Task 1), `StoryBody` (Task 3), `faqJsonLd` + `articleJsonLd` + `breadcrumbJsonLd` + `jsonLdScript` (src/lib/schema.ts), `getLivePackages`, `destinationsFor`, `getDestination`
- Produces: nothing other tasks consume

- [ ] **Step 1: Switch the page to status-aware lookup**

In `src/app/stories/[slug]/page.tsx`, replace the `getPost`/`getPosts` imports and both call sites. The import block becomes:

```tsx
import { getAllPosts, getSettings, shortDate, normalizeMediaUrl, getLivePackages, nightsLabel, fromPrice, inr } from "@/lib/catalog";
import { isStoryLive, storyKind, readingMinutes, STORY_KINDS, storiesForDestination } from "@/lib/stories";
import { destinationsFor, getDestination } from "@/lib/destinations";
import StoryBody from "@/components/site/StoryBody";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/schema";
```

and add, above `generateMetadata`:

```tsx
/** a story is readable only when live — a draft 404s like any unknown slug */
const liveStory = (slug: string) => getAllPosts().filter(isStoryLive).find((p) => p.slug === slug);
```

Then replace every `getPost(slug)` with `liveStory(slug)`, and in the "more" list replace `getPosts()` with `getAllPosts().filter(isStoryLive)`.

- [ ] **Step 2: Prefer `summary` for the description**

In `generateMetadata`, replace the description line:

```tsx
const description = post.summary?.trim() || post.excerpt?.trim() || summarise(post.body);
```

- [ ] **Step 3: Render summary, body, FAQ and the trip card**

Replace the `<article>` block with:

```tsx
<article className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
  {/* The answer first. Google lifts these into answer boxes and AI summaries,
      and a reader who only wanted the number leaves satisfied either way. */}
  {summaryLine && (
    <p className="mb-8 border-l-2 border-brand pl-5 font-display text-xl font-bold leading-snug text-ink/80">
      {summaryLine}
    </p>
  )}

  <StoryBody body={post.body} />

  {faqs.length > 0 && (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Questions people ask</h2>
      <dl className="mt-5 space-y-5">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-display text-base font-extrabold text-ink">{f.q}</dt>
            <dd className="mt-1.5 text-[0.98rem] leading-relaxed text-ink/75">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )}

  {trips.length > 0 && (
    <section className="mt-12 rounded-3xl border border-line bg-card p-6 shadow-card">
      <p className="font-script text-2xl text-brand">go and see it</p>
      <ul className="mt-4 space-y-3">
        {trips.map((t) => (
          <li key={t.slug}>
            <Link href={`/trips/${t.slug}`} className="group flex items-baseline justify-between gap-4 border-b border-line/70 pb-3">
              <span className="font-display text-lg font-extrabold leading-tight text-ink group-hover:text-brand">{t.name}</span>
              <span className="shrink-0 text-sm font-bold text-ink/70">
                {t.price != null ? `from ${inr(t.price)}` : t.nights}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )}

  <div className="mt-12 border-t border-line pt-8">
    <Link href="/stories" className="text-sm font-bold text-brand hover:text-brand-bright">← All stories</Link>
  </div>
</article>
```

and compute those three values immediately after `const more = …`:

```tsx
const kind = storyKind(post);
const summaryLine = post.summary?.trim() || post.excerpt?.trim() || "";
const faqs = post.faqs ?? [];
const destinationSlugs = post.destinations ?? [];
/* the live trips that go where this story is about — the whole point of an
   informational page is that it hands the reader a real batch at the end */
const trips = getLivePackages()
  .filter((p) => destinationsFor(p).some((d) => destinationSlugs.includes(d.slug)))
  .slice(0, 4)
  .map((p) => ({ slug: p.slug, name: p.name, nights: nightsLabel(p), price: fromPrice(p.slug) }));
```

- [ ] **Step 4: Add FAQ schema**

In the `jsonLdScript([...])` array, append after `breadcrumbJsonLd(...)`:

```tsx
...(faqJsonLd(faqs) ? [faqJsonLd(faqs)!] : []),
```

- [ ] **Step 5: Replace the related list with same-destination stories**

Replace the `const more = …` line with:

```tsx
/* related by place, not by date: someone reading about Kedarkantha wants the
   other Kedarkantha pages, not last week's Goa story */
const related = destinationSlugs.flatMap((d) => storiesForDestination(d, getAllPosts()));
const more = [...new Map(related.filter((p) => p.slug !== post.slug).map((p) => [p.slug, p])).values()].slice(0, 3);
```

Note: this must sit *below* the `destinationSlugs` line from Step 3; if that ordering is wrong TypeScript will report "used before declaration", which is the signal to move it.

- [ ] **Step 6: Show kind and reading time in the hero**

In the hero, replace the author line with:

```tsx
<p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">
  {STORY_KINDS.find((k) => k.kind === kind)?.label} · {post.author} · {shortDate(post.date)} · {readingMinutes(post.body)} min read
</p>
```

- [ ] **Step 7: Verify against a real story**

```bash
npx tsc --noEmit && npx eslint "src/app/stories/[slug]/page.tsx" && npm run build
(npx next start -p 3107 > /tmp/ns.log 2>&1 &) ; sleep 12
curl -s http://localhost:3107/stories/my-first-snowfall-experience | grep -c "keep reading\|All stories"
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3107/stories/my-first-snowfall-experience
pkill -f "next start -p 3107"
```

Expected: HTTP `200`, and the existing story renders unchanged (it has no summary, faqs or destinations, so no new block appears).

- [ ] **Step 8: Commit**

```bash
git add "src/app/stories/[slug]/page.tsx"
git commit -m "feat: story page — answer first, FAQ schema, trips for the destination"
```

---

### Task 5: "Before you go" on trip pages

**Files:**
- Create: `src/components/site/BeforeYouGo.tsx`
- Modify: `src/app/trips/[slug]/page.tsx` (the `<ExploreLinks />` line, around line 425)

**Interfaces:**
- Consumes: `storiesForPackage`, `groupByKind`, `readingMinutes` (Task 1); `getAllPosts` (Task 1)
- Produces: `export default function BeforeYouGo({ pkg }: { pkg: Package })`

- [ ] **Step 1: Write the component**

```tsx
import Link from "next/link";
import type { Package } from "@/lib/types";
import { getAllPosts } from "@/lib/catalog";
import { storiesForPackage, groupByKind, readingMinutes, STORY_KINDS } from "@/lib/stories";

/* BEFORE YOU GO — everything written about the places this trip visits.
 *
 * A <details>, so it needs no JavaScript and every link is in the server HTML
 * whether it is open or shut: Google reads and follows collapsed content, and
 * a reader gets a short page until they ask for more. What sits here is
 * titles and summaries; the writing itself lives on each story's own URL,
 * where it can rank. */
export default function BeforeYouGo({ pkg }: { pkg: Package }) {
  const groups = groupByKind(storiesForPackage(pkg, getAllPosts()));
  if (groups.length === 0) return null;
  const count = groups.reduce((n, g) => n + g.posts.length, 0);
  const where = pkg.destination || pkg.name;

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
      <details className="group rounded-3xl border border-line bg-card shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
          <span>
            <span className="block font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              Before you go — {where}
            </span>
            <span className="mt-1 block text-sm text-ink/65">
              {count} {count === 1 ? "piece" : "pieces"} on planning, cost and what it's actually like
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-2xl text-ink/40 transition-transform group-open:rotate-45">+</span>
        </summary>

        <div className="space-y-8 border-t border-line px-6 pb-7 pt-6">
          {groups.map((g) => (
            <div key={g.kind}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink/70">{g.label}</p>
              <p className="mt-1 text-xs text-ink/55">{STORY_KINDS.find((k) => k.kind === g.kind)?.blurb}</p>
              <ul className="mt-3 space-y-2.5">
                {g.posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/stories/${p.slug}`} className="group/row block rounded-xl px-3 py-2 transition-colors hover:bg-cream">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink group-hover/row:text-brand">{p.title}</span>
                        <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-wider text-ink/45">
                          {readingMinutes(p.body)} min
                        </span>
                      </span>
                      {p.summary && <span className="mt-0.5 block text-sm leading-snug text-ink/60">{p.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
```

- [ ] **Step 2: Render it on the trip page**

In `src/app/trips/[slug]/page.tsx`, add the import beside the `ExploreLinks` import:

```tsx
import BeforeYouGo from "@/components/site/BeforeYouGo";
```

and place the component immediately **above** `<MoreTrips`:

```tsx
        <BeforeYouGo pkg={pkg} />

        <MoreTrips
```

- [ ] **Step 3: Verify it is absent with no stories, and present with one**

```bash
npx tsc --noEmit && npx eslint src/components/site/BeforeYouGo.tsx "src/app/trips/[slug]/page.tsx" && npm run build
(npx next start -p 3107 > /tmp/ns.log 2>&1 &) ; sleep 12
curl -s http://localhost:3107/trips/kedarkantha-solo-winter-trek | grep -c "Before you go"
pkill -f "next start -p 3107"
```

Expected: `0` — no story in `data/catalog.json` has `destinations` yet, so the section correctly does not render. Then add a temporary story to `data/catalog.json` with `"kind": "guide"`, `"destinations": ["kedarkantha"]`, `"status": "published"`, rebuild, and confirm the count is `1` and the link appears in the HTML while collapsed. **Revert that temporary catalog edit before committing** (`git checkout data/catalog.json`).

- [ ] **Step 4: Commit**

```bash
git add src/components/site/BeforeYouGo.tsx "src/app/trips/[slug]/page.tsx"
git commit -m "feat: Before you go — destination stories on every trip page"
```

---

### Task 6: Story cards, hub filters and topic pages

**Files:**
- Create: `src/components/site/StoryCard.tsx`
- Modify: `src/app/stories/page.tsx`
- Create: `src/app/stories/topic/[kind]/page.tsx`

**Interfaces:**
- Consumes: Task 1 helpers, `getAllPosts`, `getDestination`, `DESTINATIONS`
- Produces: `export default function StoryCard({ post }: { post: BlogPost })`

- [ ] **Step 1: Write the card**

```tsx
import Link from "next/link";
import SiteMedia from "./SiteMedia";
import type { BlogPost } from "@/lib/types";
import { storyKind, readingMinutes, STORY_KINDS } from "@/lib/stories";
import { shortDate } from "@/lib/catalog";

export default function StoryCard({ post }: { post: BlogPost }) {
  const label = STORY_KINDS.find((k) => k.kind === storyKind(post))?.label;
  return (
    <Link href={`/stories/${post.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-transform hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <SiteMedia src={post.cover} alt="" fill sizes="(max-width:640px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.25em] text-brand">{label}</p>
        <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink transition-colors group-hover:text-brand">{post.title}</h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink/65">{post.summary || post.excerpt}</p>
        <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-widest text-ink/55">
          {shortDate(post.date)} · {readingMinutes(post.body)} min read
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Rewrite the hub to filter**

Replace the body of `src/app/stories/page.tsx` below the hero `<section>` with a filter row and a grid. The page takes `searchParams` so a filter is a plain link, with no client JavaScript:

```tsx
export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const { place } = await searchParams;
  const settings = getSettings();
  const all = getAllPosts().filter(isStoryLive).sort((a, b) => b.date.localeCompare(a.date));
  const posts = place ? all.filter((p) => (p.destinations ?? []).includes(place)) : all;
  /* only offer a place filter where something is actually written, so the row
     never sends a reader to an empty page */
  const places = DESTINATIONS.filter((d) => all.some((p) => (p.destinations ?? []).includes(d.slug)));
```

and the filter row plus grid:

```tsx
<nav aria-label="Filter stories" className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8">
  <div className="flex flex-wrap gap-2">
    <Link href="/stories" className={`rounded-full border px-4 py-1.5 text-sm font-bold ${!place ? "border-brand bg-brand text-white" : "border-line bg-card text-ink/75 hover:border-brand hover:text-brand"}`}>
      Everything
    </Link>
    {STORY_KINDS.map((k) => (
      <Link key={k.kind} href={`/stories/topic/${k.kind}`} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm font-bold text-ink/75 hover:border-brand hover:text-brand">
        {k.label}
      </Link>
    ))}
  </div>
  {places.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {places.map((d) => (
        <Link key={d.slug} href={`/stories?place=${d.slug}`} className={`rounded-full border px-3 py-1 text-xs font-bold ${place === d.slug ? "border-brand bg-brand text-white" : "border-line bg-card text-ink/70 hover:border-brand hover:text-brand"}`}>
          {d.name}
        </Link>
      ))}
    </div>
  )}
</nav>
```

Keep the existing empty state (`No stories published yet — check back soon.`) and swap each card for `<StoryCard key={p.slug} post={p} />`. Imports to add: `getAllPosts`, `isStoryLive`, `STORY_KINDS`, `DESTINATIONS`, `StoryCard`.

- [ ] **Step 3: Add the topic pages**

Create `src/app/stories/topic/[kind]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import SiteFooter from "@/components/site/SiteFooter";
import StoryCard from "@/components/site/StoryCard";
import { getAllPosts, getSettings } from "@/lib/catalog";
import { isStoryLive, storyKind, STORY_KINDS } from "@/lib/stories";
import { canonical } from "@/lib/seo";

export function generateStaticParams() {
  return STORY_KINDS.map((k) => ({ kind: k.kind }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  const meta = STORY_KINDS.find((k) => k.kind === kind);
  if (!meta) return {};
  const title = `${meta.label} — travel stories & guides | Tripwaley`;
  return { ...canonical(`/stories/topic/${kind}`), title, description: meta.blurb, openGraph: { title, description: meta.blurb, type: "website" } };
}

export default async function TopicPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const meta = STORY_KINDS.find((k) => k.kind === kind);
  if (!meta) notFound();

  const settings = getSettings();
  const posts = getAllPosts()
    .filter(isStoryLive)
    .filter((p) => storyKind(p) === meta.kind)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Navbar overDarkHero />
      <main id="main" className="bg-cream">
        <section className="bg-ink px-5 pb-14 pt-36 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Link href="/stories" className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-white/45 hover:text-gold">← all stories</Link>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl">
              {meta.label}<span className="text-gold">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70">{meta.blurb}</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-ink/60">Nothing here yet — <Link href="/stories" className="font-bold text-brand">read everything else</Link>.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <StoryCard key={p.slug} post={p} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter whatsappLink={settings.whatsappLink} whatsapp={settings.whatsapp} announcement={settings.announcement} />
    </>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npx eslint src/components/site/StoryCard.tsx src/app/stories "src/app/stories/topic/[kind]/page.tsx" && npm run build
(npx next start -p 3107 > /tmp/ns.log 2>&1 &) ; sleep 12
for u in /stories /stories/topic/guide /stories/topic/report /stories/topic/nonsense "/stories?place=spiti"; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3107$u") $u"; done
pkill -f "next start -p 3107"
```

Expected: `200` for the first four URLs and the filtered one, `404` for `/stories/topic/nonsense`.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/StoryCard.tsx src/app/stories
git commit -m "feat: stories hub filters and topic pages"
```

---

### Task 7: Guides on destination pages, and the sitemap

**Files:**
- Modify: `src/app/destinations/[slug]/page.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `storiesForDestination`, `isStoryLive`, `readingMinutes`, `STORY_KINDS` (Task 1), `getAllPosts`
- Produces: nothing other tasks consume

- [ ] **Step 1: Add the Guides list to the destination page**

Find the closing `</main>` in `src/app/destinations/[slug]/page.tsx` and insert immediately above it:

```tsx
{guides.length > 0 && (
  <section className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8">
    <p className="font-script text-2xl text-brand">read first</p>
    <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
      Everything we have written about {dest.name}
    </h2>
    <ul className="mt-6 divide-y divide-line">
      {guides.map((p) => (
        <li key={p.slug}>
          <Link href={`/stories/${p.slug}`} className="group flex items-baseline justify-between gap-4 py-3.5">
            <span>
              <span className="font-display text-lg font-extrabold leading-tight text-ink group-hover:text-brand">{p.title}</span>
              {p.summary && <span className="mt-0.5 block text-sm text-ink/60">{p.summary}</span>}
            </span>
            <span className="shrink-0 text-[0.68rem] font-bold uppercase tracking-wider text-ink/45">{readingMinutes(p.body)} min</span>
          </Link>
        </li>
      ))}
    </ul>
  </section>
)}
```

Compute it beside the page's other data (the destination object is `dest`, from `getDestination(slug)` at line 77):

```tsx
const guides = storiesForDestination(dest.slug, getAllPosts());
```

with imports:

```tsx
import { storiesForDestination, readingMinutes } from "@/lib/stories";
import { getAllPosts } from "@/lib/catalog";
```

- [ ] **Step 2: Put topic pages in the sitemap and filter stories by status**

In `src/app/sitemap.ts`, add the import:

```tsx
import { getAllPosts } from "@/lib/catalog";
import { isStoryLive, STORY_KINDS } from "@/lib/stories";
```

Replace the `for (const post of getPosts())` loop with:

```tsx
/* drafts must never be handed to Google — isStoryLive is the same test the
   story page itself uses to decide whether to 404 */
for (const post of getAllPosts().filter(isStoryLive)) {
  entries.push({
    url: url(`/stories/${post.slug}`),
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly",
    priority: 0.5,
  });
}
for (const k of STORY_KINDS) {
  entries.push({ url: url(`/stories/topic/${k.kind}`), lastModified: now, changeFrequency: "weekly", priority: 0.5 });
}
```

Remove `getPosts` from the `@/lib/catalog` import if nothing else in the file uses it.

- [ ] **Step 3: Verify the whole build**

```bash
npx tsc --noEmit && npx eslint "src/app/destinations/[slug]/page.tsx" src/app/sitemap.ts
for t in scripts/test-*.mjs; do node "$t" > /dev/null || echo "FAIL $t"; done
npm run build
(npx next start -p 3107 > /tmp/ns.log 2>&1 &) ; sleep 12
curl -s http://localhost:3107/sitemap.xml | grep -c "stories/topic"
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3107/destinations/kedarkantha
pkill -f "next start -p 3107"
```

Expected: `4` topic URLs in the sitemap, and `200` for the destination page.

- [ ] **Step 4: Commit**

```bash
git add "src/app/destinations/[slug]/page.tsx" src/app/sitemap.ts
git commit -m "feat: destination guides list, story topic pages in sitemap"
```

---

### Task 8: Rename the six existing stories and tag them

**Files:**
- Modify: `data/catalog.json` **on the production server only** (the live catalog is a Docker volume; the repo copy is stale)
- Create: `scripts/test-story-aliases.mjs`
- Modify: `src/lib/stories.ts`, `src/app/stories/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 1
- Produces: `resolveStoryAlias(slug: string, all: BlogPost[]): string | undefined`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-story-aliases.mjs`:

```js
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node scripts/test-story-aliases.mjs`
Expected: `SyntaxError` / `does not provide an export named 'resolveStoryAlias'`.

- [ ] **Step 3: Add the field and the resolver**

In `src/lib/types.ts`, add to `BlogPost`:

```ts
  /** addresses this story used to live at; each 308s to the current slug */
  oldSlugs?: string[];
```

In `src/lib/stories.ts`:

```ts
/** The story that now owns an old address, if it is live. */
export function resolveStoryAlias(slug: string, all: BlogPost[]): string | undefined {
  const owner = all.find((p) => (p.oldSlugs ?? []).includes(slug));
  return owner && isStoryLive(owner) && owner.slug !== slug ? owner.slug : undefined;
}
```

- [ ] **Step 4: Redirect instead of 404 on the story page**

In `src/app/stories/[slug]/page.tsx`, change the import `import { notFound } from "next/navigation";` to `import { notFound, permanentRedirect } from "next/navigation";`, import `resolveStoryAlias`, and replace `if (!post) notFound();` with:

```tsx
  if (!post) {
    const to = resolveStoryAlias(slug, getAllPosts());
    if (to) permanentRedirect(`/stories/${to}`);
    notFound();
  }
```

- [ ] **Step 5: Run the tests, build, commit**

```bash
node scripts/test-story-aliases.mjs && npx tsc --noEmit && npm run build
git add src/lib/types.ts src/lib/stories.ts "src/app/stories/[slug]/page.tsx" scripts/test-story-aliases.mjs
git commit -m "feat: story slug aliases so a rename keeps its URL"
```

- [ ] **Step 6: Hand the owner the content step**

The rename itself is data, not code, and the live catalog only exists on the server. Write the owner a short list: for each of the 6 live stories, the new slug, `kind: "report"`, and the destination slugs to tag. **Do not edit the production catalog directly.** Until build 2 gives admin these fields, the owner applies them, or approves our editing `data/catalog.json` on the server.

---

## Self-review

- **Spec coverage:** story model → Task 1; live tokens → Tasks 2–3; story page with summary, FAQ, trip card, related → Task 4; trip-page section → Task 5; hub and topic pages → Task 6; destination guides and sitemap → Task 7; the `new-story-N` renames with aliases → Task 8. Admin (build 2), draft endpoints (build 3) and n8n (build 4) are deliberately absent.
- **Deviation from the spec, stated openly:** the spec drew the trip-page section as *tabs*. Tabs need client JavaScript, which would cost blocking time on the page that sells. Task 5 ships the same content as labelled groups inside one `<details>`. If the owner wants real tabs later, it's a contained change to one component.
- **Naming:** `isStoryLive`, `storyKind`, `readingMinutes`, `storiesForDestination`, `storiesForPackage`, `groupByKind`, `STORY_KINDS`, `expandTokens`, `storyLookup`, `resolveStoryAlias`, `getAllPosts` are used with these exact names in every task that consumes them.
- **Order:** Tasks 1 and 2 are independent. Tasks 3–7 depend on 1 (and 3 on 2). Task 8 depends on 1.
