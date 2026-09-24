/* STORIES — which story belongs where.
 *
 * Stories attach to DESTINATIONS rather than to trips. Trip slugs churn: 13
 * indexed trip URLs had to be redirected on 2026-09-19 after packages were
 * drafted, deleted or renamed. A destination does not change, so writing
 * attached to one survives the product churn and keeps its ranking. */

import type { BlogPost, StoryKind } from "./types.ts";
import { destinationsFor } from "./destinations.ts";

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
