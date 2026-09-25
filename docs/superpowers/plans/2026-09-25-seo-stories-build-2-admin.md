# SEO stories, build 2 — admin fields — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The owner can set a story's topic, destinations, keyword, summary and FAQs in the admin panel, and renaming a story there keeps its old URL alive.

**Architecture:** Build 1 taught the *site* to read six new `BlogPost` fields; nothing can write them except a script on the server. This build adds the admin controls, plus a server-side rename cascade so an old story URL survives a rename no matter which client saved it — the same protection packages already get from `slugCascade.ts`.

**Tech stack:** Next 16 App Router, React 19 client components (the admin panel is the one place `"use client"` is correct), TypeScript strict, Tailwind v4, file CMS.

## Global constraints

- **Read `node_modules/next/dist/docs/` before relying on any Next behaviour.** This version differs from training data (AGENTS.md).
- The admin panel is a client app (`src/components/admin/*` are all `"use client"`). That is the exception to the site-wide server-component rule; the public site keeps no new client JS.
- **`published` is authoritative for liveness** (`isStoryLive` in `src/lib/stories.ts`): `published: false` always hides a story, and `status`, when present, must be `"published"`. Any control this build adds must keep the two in step — never write one without the other.
- Every field stays optional on `BlogPost`. Stories written before this build must keep working.
- **Validate shape, never content.** The owner's decision (2026-09-19) was explicit: no automatic rejection of a story's substance. Reject a malformed value (a topic that isn't one of the four, a destination slug that does not exist) with a clear message; never reject a story for being short, thin, or duplicating a keyword — surface that as a warning the owner can ignore.
- Admin saves go through `PUT /api/admin/catalog` with `{ section: "posts", data: BlogPost[] }` — the whole array every time.
- Tests are plain Node scripts in `scripts/`, `node:assert/strict`, the `let n = 0; const ok = (label) => ...` pattern from `scripts/test-slug-aliases.mjs`.
- A module under `src/lib/` that a `scripts/test-*.mjs` runs directly needs an explicit `.ts` extension on *runtime* sibling imports; type-only imports stay extensionless (see `src/lib/stories.ts`).
- Before any commit: `npx tsc --noEmit`, `npx eslint <changed files>`, every `scripts/test-*.mjs`, then `npm run build`.
- **Verification limit, stated honestly:** the admin panel is password-protected and nobody in this build has the password, so no task can click through the real UI. Tasks verify with unit tests, typecheck, lint and build. The owner does the click-through after deploy.
- Do NOT `git push`. Commit locally only. Do not edit `data/catalog.json`.

## File structure

| File | Responsibility |
|---|---|
| `src/lib/storyCascade.ts` (create) | Pure: detect a story rename between two arrays, and record the old slug |
| `scripts/test-story-cascade.mjs` (create) | Its tests |
| `src/app/api/admin/catalog/route.ts` (modify) | Run the cascade on a `posts` save; validate the new fields' shape |
| `src/components/admin/StoryMeta.tsx` (create) | Topic, destinations, keyword + duplicate warning, summary |
| `src/components/admin/StoryFaqs.tsx` (create) | The FAQ repeater |
| `src/components/admin/StoriesEditor.tsx` (modify) | Renders both, and makes the status control write `published` + `status` together |

---

### Task 1: Story rename cascade

**Files:**
- Create: `src/lib/storyCascade.ts`
- Test: `scripts/test-story-cascade.mjs`

**Interfaces:**
- Consumes: `BlogPost` from `./types`
- Produces:
  - `interface StoryRename { from: string; to: string }`
  - `detectStoryRenames(before: BlogPost[], after: BlogPost[]): StoryRename[]`
  - `applyStoryRenames(posts: BlogPost[], renames: StoryRename[]): number` — mutates `posts`, returns how many stories recorded an old slug

- [ ] **Step 1: Write the failing test**

Create `scripts/test-story-cascade.mjs`:

```js
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd /Users/apple/Applications/tripwaley && node scripts/test-story-cascade.mjs`
Expected: `ERR_MODULE_NOT_FOUND` for `../src/lib/storyCascade.ts`.

- [ ] **Step 3: Write `src/lib/storyCascade.ts`**

```ts
/* A story's slug is its address, and the admin lets the owner edit it.
 *
 * Renaming one used to 404 every link and every Google result pointing at the
 * old address. /stories/[slug] redirects from `oldSlugs` (resolveStoryAlias in
 * stories.ts), so a rename simply has to record where it came from — the same
 * bargain slugCascade.ts strikes for packages. */

import type { BlogPost } from "./types";

export interface StoryRename { from: string; to: string }

/** Positional comparison: with the same rows in the same order, an edited slug
 *  at index i is a rename. A length change means rows were added or removed,
 *  so index i no longer identifies the same story — refuse to guess. */
export function detectStoryRenames(before: BlogPost[], after: BlogPost[]): StoryRename[] {
  if (before.length !== after.length) return [];

  const beforeSlugs = new Set(before.map((p) => p.slug));
  const afterSlugs = new Set(after.map((p) => p.slug));
  const out: StoryRename[] = [];

  for (let i = 0; i < before.length; i++) {
    const from = before[i].slug;
    const to = after[i].slug;
    if (!from || !to || from === to) continue;
    // the new slug must be genuinely new and the old one genuinely gone,
    // otherwise this is a swap or a collision rather than a clean rename
    if (afterSlugs.has(from) || beforeSlugs.has(to)) continue;
    out.push({ from, to });
  }
  return out;
}

/** Record each old address on the story that now owns it. Returns how many
 *  stories were touched. Mutates `posts`. */
export function applyStoryRenames(posts: BlogPost[], renames: StoryRename[]): number {
  let moved = 0;
  for (const { from, to } of renames) {
    const owner = posts.find((p) => p.slug === to);
    if (!owner) continue;
    const old = new Set(owner.oldSlugs ?? []);
    old.add(from);
    // a story can never be an alias of itself
    old.delete(to);
    owner.oldSlugs = [...old];
    moved++;
  }
  /* A slug that is a real story again must stop redirecting: otherwise
     /stories/b would 308 to /stories/a while b is itself a published page. */
  const live = new Set(posts.map((p) => p.slug));
  for (const p of posts) {
    if (!p.oldSlugs?.length) continue;
    p.oldSlugs = p.oldSlugs.filter((s) => !live.has(s));
  }
  return moved;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node scripts/test-story-cascade.mjs`
Expected: every line a `✓`, ending `7 passed`.

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npx eslint src/lib/storyCascade.ts
git add src/lib/storyCascade.ts scripts/test-story-cascade.mjs
git commit -m "feat: renaming a story records its old address"
```

---

### Task 2: Wire the cascade into the admin save, and validate the new fields

**Files:**
- Modify: `src/app/api/admin/catalog/route.ts` (the `"posts"` case of the validator, around line 222; the rename block around line 257; the `if (section === "posts")` assignment)

**Interfaces:**
- Consumes: `detectStoryRenames`, `applyStoryRenames` (Task 1); `DESTINATIONS` from `@/lib/destinations`
- Produces: nothing other tasks consume

- [ ] **Step 1: Tighten the `posts` validator**

Replace the `case "posts":` block with:

```ts
    case "posts": {
      /* Shape only. A story is never rejected for being short, thin, or
         sharing a keyword with another — that was the owner's explicit call
         on 2026-09-19. What is rejected is a value the site cannot render:
         a topic outside the four, or a destination slug that does not exist. */
      const kinds = new Set(["guide", "cost", "seasonal", "report"]);
      const places = new Set(DESTINATIONS.map((d) => d.slug));
      for (const p of data as BlogPost[]) {
        if (!isStr(p.slug) || !p.slug || !isStr(p.title) || typeof p.published !== "boolean") return "invalid post row";
        if (p.kind != null && !kinds.has(p.kind)) return `${p.slug}: unknown topic "${p.kind}"`;
        if (p.status != null && !["draft", "approved", "published"].includes(p.status)) return `${p.slug}: unknown status "${p.status}"`;
        if (p.destinations != null) {
          if (!Array.isArray(p.destinations)) return `${p.slug}: destinations must be a list`;
          const unknown = p.destinations.find((d) => !places.has(d));
          if (unknown) return `${p.slug}: "${unknown}" is not one of our destinations`;
        }
        if (p.faqs != null) {
          if (!Array.isArray(p.faqs)) return `${p.slug}: faqs must be a list`;
          if (p.faqs.some((f) => !isStr(f?.q) || !isStr(f?.a))) return `${p.slug}: every FAQ needs a question and an answer`;
        }
        if (p.oldSlugs != null && (!Array.isArray(p.oldSlugs) || p.oldSlugs.some((s) => !isStr(s)))) return `${p.slug}: oldSlugs must be a list of slugs`;
      }
      return null;
    }
```

Add `DESTINATIONS` to the file's imports from `@/lib/destinations` (check whether the file already imports from there before adding a second import line).

- [ ] **Step 2: Run the rename cascade on a posts save**

Directly below the existing `if (section === "packages") { … }` rename block, add:

```ts
    /* Same bargain as a package rename: a story's slug is its address, and
       the old one has to keep working. Done here rather than in the editor so
       it holds whoever saves — the admin UI, a script, or the draft writer. */
    if (section === "posts") {
      const renames = detectStoryRenames(cat.posts ?? [], data as BlogPost[]);
      if (renames.length) {
        const moved = applyStoryRenames(data as BlogPost[], renames);
        console.log(`[admin] story slug rename ${renames.map((r) => `${r.from} -> ${r.to}`).join(", ")} — kept ${moved} old url(s) alive`);
      }
    }
```

This must run **before** `cat.posts` is replaced with `data`. Find the line that assigns the posts section (it sits with the other `if (section === …) cat.X = data` lines) and confirm the ordering; if there is no `posts` assignment line, the section is handled generically — read the surrounding code and place the cascade so it still mutates `data` before it is stored.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npx eslint src/app/api/admin/catalog/route.ts
for t in scripts/test-*.mjs; do node "$t" > /dev/null || echo "FAIL $t"; done
npm run build
```

Expected: all clean. Nobody can exercise the real endpoint here (the panel is password-protected), so read your diff once more and confirm by eye that the cascade mutates the array that is stored, not a copy.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/catalog/route.ts
git commit -m "feat: admin story saves keep old urls and validate the new fields"
```

---

### Task 3: The story metadata fields

**Files:**
- Create: `src/components/admin/StoryMeta.tsx`
- Modify: `src/components/admin/StoriesEditor.tsx`

**Interfaces:**
- Consumes: `STORY_KINDS`, `duplicateKeywords` from `@/lib/stories`; `DESTINATIONS` from `@/lib/destinations`; `Field`, `Area`, `input`, `label` from `./ui`
- Produces: `export default function StoryMeta({ post, all, onChange }: { post: BlogPost; all: BlogPost[]; onChange: (patch: Partial<BlogPost>) => void })`

- [ ] **Step 1: Write the component**

```tsx
"use client";

/* The SEO half of a story: what it is, where it is about, and the search it
   is meant to own. The site has read these fields since build 1 — until now
   nothing could write them except a script on the server. */

import type { BlogPost } from "@/lib/types";
import { STORY_KINDS, duplicateKeywords } from "@/lib/stories";
import { DESTINATIONS } from "@/lib/destinations";
import { Field, Area, input, label } from "./ui";

export default function StoryMeta({
  post,
  all,
  onChange,
}: {
  post: BlogPost;
  all: BlogPost[];
  onChange: (patch: Partial<BlogPost>) => void;
}) {
  const picked = post.destinations ?? [];
  const toggle = (slug: string) =>
    onChange({ destinations: picked.includes(slug) ? picked.filter((s) => s !== slug) : [...picked, slug] });

  /* A warning, never a block: the owner decided a story is never refused for
     sharing a keyword. They are told, and they choose. */
  const clash = duplicateKeywords(all).get((post.keyword ?? "").trim().toLowerCase().replace(/\s+/g, " "));
  const others = (clash ?? []).filter((s) => s !== post.slug);

  const words = post.body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <label className={label}>topic
        <select value={post.kind ?? "report"} onChange={(e) => onChange({ kind: e.target.value as BlogPost["kind"] })} className={input}>
          {STORY_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>{k.label} — {k.blurb}</option>
          ))}
        </select>
      </label>

      <div>
        <Field l="keyword this story should own" v={post.keyword ?? ""} on={(v) => onChange({ keyword: v })} />
        {others.length > 0 && (
          <p className="mt-1 text-[0.68rem] text-gold">
            Also used by {others.join(", ")} — two pages chasing one search usually means neither wins.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <p className={label}>destinations — where this story is about</p>
        <p className="mt-1 text-[0.68rem] text-white/40">
          This is what puts the story on a trip page. Untagged, it only appears under Stories.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DESTINATIONS.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => toggle(d.slug)}
              className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${
                picked.includes(d.slug) ? "bg-gold text-ink" : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <Area l="short answer (shown above the story, and on cards)" v={post.summary ?? ""} on={(v) => onChange({ summary: v })} rows={3} />
        <p className="mt-1 text-[0.68rem] text-white/40">
          {words} words in the body · {post.summary?.trim() ? "has a short answer" : "no short answer yet"} · {post.faqs?.length ?? 0} questions
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Render it in the editor**

In `src/components/admin/StoriesEditor.tsx`, import it:

```tsx
import StoryMeta from "./StoryMeta";
```

and place it inside the `<div className="grid max-w-4xl gap-4 sm:grid-cols-2">`, directly after the tags `<Field>` (line 81):

```tsx
        <StoryMeta post={open} all={posts} onChange={upd} />
```

- [ ] **Step 3: Make the status control write both fields**

Replace the status `<select>` (lines 75-80) with:

```tsx
        <label className={label}>status
          <select
            value={open.published ? "1" : "0"}
            /* `published` is what the site actually obeys (isStoryLive), and
               `status` is what the draft writer will set in build 3. Write
               both together so they can never disagree. */
            onChange={(e) => {
              const live = e.target.value === "1";
              upd({ published: live, status: live ? "published" : "draft" });
            }}
            className={input}
          >
            <option value="1">published — live</option>
            <option value="0">draft — hidden</option>
          </select>
        </label>
```

and the list-row toggle (line 47-53) so it does the same:

```tsx
                onClick={() => setPosts((all) => all.map((x) => (x.slug === p.slug ? { ...x, published: !x.published, status: !x.published ? "published" : "draft" } : x)))}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npx eslint src/components/admin/StoryMeta.tsx src/components/admin/StoriesEditor.tsx
for t in scripts/test-*.mjs; do node "$t" > /dev/null || echo "FAIL $t"; done
npm run build
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/StoryMeta.tsx src/components/admin/StoriesEditor.tsx
git commit -m "feat: admin — topic, destinations, keyword and short answer on a story"
```

---

### Task 4: The FAQ editor

**Files:**
- Create: `src/components/admin/StoryFaqs.tsx`
- Modify: `src/components/admin/StoriesEditor.tsx`

**Interfaces:**
- Consumes: `StoryFaq`, `BlogPost` from `@/lib/types`; `Btn`, `Field`, `Area`, `label` from `./ui`
- Produces: `export default function StoryFaqs({ faqs, onChange }: { faqs: StoryFaq[]; onChange: (faqs: StoryFaq[]) => void })`

- [ ] **Step 1: Write the component**

```tsx
"use client";

/* Questions and answers on a story. These are output as FAQPage schema, which
   is what makes a story eligible for the expandable answers Google shows
   under a result — the cheapest visibility a page of writing can buy. */

import type { StoryFaq } from "@/lib/types";
import { Btn, Field, Area, label } from "./ui";

export default function StoryFaqs({
  faqs,
  onChange,
}: {
  faqs: StoryFaq[];
  onChange: (faqs: StoryFaq[]) => void;
}) {
  const set = (i: number, patch: Partial<StoryFaq>) =>
    onChange(faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="sm:col-span-2">
      <p className={label}>questions people ask</p>
      <div className="mt-2 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl border border-white/10 p-3">
            <Field l={`question ${i + 1}`} v={f.q} on={(v) => set(i, { q: v })} />
            <div className="mt-2"><Area l="answer" v={f.a} on={(v) => set(i, { a: v })} rows={3} /></div>
            <div className="mt-2 flex justify-end">
              <Btn tone="danger" onClick={() => onChange(faqs.filter((_, j) => j !== i))}>Remove</Btn>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-[0.72rem] text-white/40">None yet. Three to five real questions is the sweet spot.</p>
        )}
        <Btn tone="ghost" onClick={() => onChange([...faqs, { q: "", a: "" }])}>+ Add a question</Btn>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render it in the editor**

In `StoriesEditor.tsx`, import it:

```tsx
import StoryFaqs from "./StoryFaqs";
```

and place it directly below the `<StoryMeta …/>` line:

```tsx
        <StoryFaqs faqs={open.faqs ?? []} onChange={(faqs) => upd({ faqs })} />
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npx eslint src/components/admin/StoryFaqs.tsx src/components/admin/StoriesEditor.tsx
for t in scripts/test-*.mjs; do node "$t" > /dev/null || echo "FAIL $t"; done
npm run build
```

Expected: all clean. Confirm by reading the code that an empty question and answer can be saved and simply renders nothing on the site — `faqJsonLd` already drops blank pairs (`src/lib/schema.ts:180`), and the story page only renders the FAQ block when the list is non-empty.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/StoryFaqs.tsx src/components/admin/StoriesEditor.tsx
git commit -m "feat: admin — questions and answers on a story"
```

---

## Self-review

- **Spec coverage** (build 2 of the design doc: "Admin: drafts queue, approve/reject, destination/kind/keyword editing, slug rename for the 6 existing stories"): destination/kind/keyword/summary → Task 3; FAQs → Task 4; slug rename → Tasks 1-2. The six existing stories were already renamed by `scripts/tag-stories.mjs` on 2026-09-25, so nothing here repeats that.
- **Deliberately not built:** a separate drafts queue with approve/reject buttons. Until build 3 exists nothing creates a draft but the owner, and the status dropdown already is the approve step. Building a queue now would be a screen with nothing in it. It belongs in build 3, alongside the endpoint that fills it.
- **Naming:** `detectStoryRenames`, `applyStoryRenames`, `StoryRename`, `StoryMeta`, `StoryFaqs` are used with these exact names across tasks.
- **Order:** Task 1 → Task 2 (needs the cascade). Tasks 3 and 4 are independent of both, but Task 4 edits the same file as Task 3, so run them in order.
