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
