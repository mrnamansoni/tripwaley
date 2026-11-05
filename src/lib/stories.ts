/* STORIES — which story belongs where.
 *
 * Stories attach to DESTINATIONS rather than to trips. Trip slugs churn: 13
 * indexed trip URLs had to be redirected on 2026-09-19 after packages were
 * drafted, deleted or renamed. A destination does not change, so writing
 * attached to one survives the product churn and keeps its ranking. */

import type { BlogPost, StoryKind } from "./types";
// .ts extension required: scripts/test-stories.mjs runs this module directly
// under Node, whose ESM resolver cannot add the extension for us.
import { destinationsFor } from "./destinations.ts";
import { storyPlainText } from "./storyMarkdown.ts";

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

/** Both switches must agree: admin's `published` toggle can always take a
 *  story down (published === false wins outright), and when `status` is
 *  present it must also say "published". StoriesEditor writes both together,
 *  but a row can still arrive with only one of them — from the tag-stories
 *  migration, or from the draft writer — and the owner's publish toggle has
 *  to stay in control of whatever arrives. */
export function isStoryLive(p: BlogPost): boolean {
  return p.published !== false && (p.status ? p.status === "published" : true);
}

export const liveStories = (all: BlogPost[]): BlogPost[] => all.filter(isStoryLive);

/** Where a story is about. The admin's picks when there are any; otherwise
 *  read from the story itself — its target search, then its title, then its
 *  tags — with the same matcher trips use. Most live stories were written
 *  before the destinations field existed, and without this they linked to no
 *  destination page and no trip page at all. */
export function storyDestinations(p: BlogPost): string[] {
  if (p.destinations?.length) return p.destinations;
  return destinationsFor({ destination: p.keyword, name: p.title, route: (p.tags ?? []).join(" ") }).map((d) => d.slug);
}

export function storiesForDestination(slug: string, all: BlogPost[]): BlogPost[] {
  return liveStories(all).filter((p) => storyDestinations(p).includes(slug));
}

const newestFirst = (a: BlogPost, b: BlogPost) => (b.date ?? "").localeCompare(a.date ?? "");

/** The "Related stories" under a story: same place first, then the same
 *  topic, then the newest — always `n` when that many other live stories
 *  exist, so the internal links never thin out on an indexed page. */
export function relatedStories(post: BlogPost, all: BlogPost[], n = 3): BlogPost[] {
  const others = liveStories(all).filter((p) => p.slug !== post.slug).sort(newestFirst);
  const places = new Set(storyDestinations(post));
  const kind = storyKind(post);
  const picked: BlogPost[] = [];
  const take = (pred: (p: BlogPost) => boolean) => {
    for (const p of others) if (picked.length < n && !picked.includes(p) && pred(p)) picked.push(p);
  };
  take((p) => storyDestinations(p).some((d) => places.has(d)));
  take((p) => storyKind(p) === kind);
  take(() => true);
  return picked;
}

export function storiesForPackage(
  pkg: { name?: string; destination?: string; route?: string },
  all: BlogPost[]
): BlogPost[] {
  const slugs = new Set(destinationsFor(pkg).map((d) => d.slug));
  if (slugs.size === 0) return [];
  return liveStories(all).filter((p) => storyDestinations(p).some((d) => slugs.has(d)));
}

export function groupByKind(posts: BlogPost[]): { kind: StoryKind; label: string; posts: BlogPost[] }[] {
  return STORY_KINDS.map(({ kind, label }) => ({
    kind,
    label,
    posts: posts.filter((p) => storyKind(p) === kind),
  })).filter((g) => g.posts.length > 0);
}

/** Topics worth a page: only a kind that at least one LIVE story actually
 *  uses. Three of the four topics have no live story behind them yet, so
 *  offering all four hands Google (and the hub's filter row) empty pages. */
export function kindsWithStories(all: BlogPost[]): { kind: StoryKind; label: string; blurb: string }[] {
  const live = liveStories(all);
  return STORY_KINDS.filter((k) => live.some((p) => storyKind(p) === k.kind));
}

/** 225 words a minute, never less than one minute */
export const readingMinutes = (body: string): number =>
  Math.max(1, Math.round(storyPlainText(body).split(/\s+/).filter(Boolean).length / 225));

/** The story that now owns an old address, if it is live. */
export function resolveStoryAlias(slug: string, all: BlogPost[]): string | undefined {
  const owner = all.find((p) => (p.oldSlugs ?? []).includes(slug));
  return owner && isStoryLive(owner) && owner.slug !== slug ? owner.slug : undefined;
}

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
