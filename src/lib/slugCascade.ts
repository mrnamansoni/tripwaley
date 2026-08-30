/**
 * Package slug renames, and the references they would otherwise orphan.
 *
 * A package's slug is its identity: prices, departures and creator trips all
 * point at it by value. But the slug is also an editable field in the admin
 * Packages tab, so renaming one silently breaks every row that referenced it.
 *
 * That is not hypothetical — it already happened. A package renamed away from
 * "jibhi-shoja-raghupur-fort-trip" left behind 2 price rules, 1 departure and
 * 1 creator trip pointing at a slug with no package. The creator trip simply
 * vanished from the site, with no error anywhere: resolveTrip() looks the
 * package up, gets undefined, and returns null.
 *
 * `code` cannot serve as the stable identity instead — it is editable too, and
 * auto-generated as `TRWLY-N{length+1}`, so it collides after any deletion.
 *
 * So the rename is detected positionally. The admin editor maps the packages
 * array in place and never reorders it, so when the array length is unchanged,
 * index i before corresponds to index i after. Anything more ambiguous than
 * that (a length change, or a slug colliding with another package) is left
 * alone rather than guessed at — a missed cascade is a visible bug the admin
 * can fix, while a wrong cascade silently rewrites the wrong rows.
 */

import type { Catalog, Package } from "./types";

export interface SlugRename {
  from: string;
  to: string;
}

export interface CascadeResult {
  renames: SlugRename[];
  prices: number;
  departures: number;
  creatorTrips: number;
}

/** Rename pairs implied by an in-place edit of the packages array. */
export function detectSlugRenames(before: Package[], after: Package[]): SlugRename[] {
  // A length change means rows were added or removed, so index i no longer
  // reliably identifies the same package. Refuse to guess.
  if (before.length !== after.length) return [];

  const beforeSlugs = new Set(before.map((p) => p.slug));
  const afterSlugs = new Set(after.map((p) => p.slug));
  const out: SlugRename[] = [];

  for (let i = 0; i < before.length; i++) {
    const from = before[i].slug;
    const to = after[i].slug;
    if (!from || !to || from === to) continue;
    // the new slug must be genuinely new, and the old one genuinely gone —
    // otherwise this is a swap or a collision, not a clean rename
    if (afterSlugs.has(from) || beforeSlugs.has(to)) continue;
    out.push({ from, to });
  }
  return out;
}

/**
 * Rewrite every reference to a renamed package, in place on `cat`.
 * Returns how many rows each rename touched, for the audit log.
 */
export function applySlugRenames(cat: Catalog, renames: SlugRename[]): CascadeResult {
  const result: CascadeResult = { renames, prices: 0, departures: 0, creatorTrips: 0 };
  if (!renames.length) return result;

  const map = new Map(renames.map((r) => [r.from, r.to]));
  const remap = (slug: string) => map.get(slug) ?? slug;

  cat.prices = (cat.prices ?? []).map((r) => {
    const to = remap(r.packageSlug);
    if (to === r.packageSlug) return r;
    result.prices++;
    return { ...r, packageSlug: to };
  });

  cat.departures = (cat.departures ?? []).map((d) => {
    const to = remap(d.packageSlug);
    if (to === d.packageSlug) return d;
    result.departures++;
    return { ...d, packageSlug: to };
  });

  if (cat.creators?.length) {
    cat.creators = cat.creators.map((c) => ({
      ...c,
      trips: (c.trips ?? []).map((t) => {
        const to = remap(t.packageSlug);
        if (to === t.packageSlug) return t;
        result.creatorTrips++;
        return { ...t, packageSlug: to };
      }),
    }));
  }

  return result;
}

/* ------------------------------------------------ orphan reporting */

export interface Orphans {
  prices: string[];
  departures: string[];
  creatorTrips: { creator: string; packageSlug: string; headline: string }[];
}

/**
 * References pointing at a package slug that does not exist.
 *
 * Orphaned prices and departures are inert — nothing reads them for a package
 * that isn't there. An orphaned creator trip is the damaging one: it is
 * published, it has dates, and it is invisible on the site with no warning.
 */
export function findOrphans(cat: Catalog): Orphans {
  const have = new Set((cat.packages ?? []).map((p) => p.slug));
  return {
    prices: [...new Set((cat.prices ?? []).filter((r) => !have.has(r.packageSlug)).map((r) => r.packageSlug))],
    departures: [...new Set((cat.departures ?? []).filter((d) => !have.has(d.packageSlug)).map((d) => d.packageSlug))],
    creatorTrips: (cat.creators ?? []).flatMap((c) =>
      (c.trips ?? [])
        .filter((t) => !have.has(t.packageSlug))
        .map((t) => ({ creator: c.slug, packageSlug: t.packageSlug, headline: t.headline ?? "" }))
    ),
  };
}
