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

  /* Remember the old address so it can 301 rather than 404. Any alias that
     pointed at the OLD slug is re-pointed at the new one, so a slug renamed
     twice still resolves from its original URL in one hop. */
  const aliases: Record<string, string> = { ...(cat.slugAliases ?? {}) };
  for (const [from, to] of map) {
    aliases[from] = to;
    for (const key of Object.keys(aliases)) if (aliases[key] === from) aliases[key] = to;
    // a slug reused as a real package again must stop being an alias
    delete aliases[to];
  }
  cat.slugAliases = aliases;

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

/* ------------------------------------------------ deletions */

/**
 * Slugs the admin deleted in this save.
 *
 * Only answered when it is unambiguous: if the save also carries a slug that
 * did not exist before, a "missing" slug may really be a rename (handled
 * above, or deliberately not guessed at), and cascading it would purge the
 * prices of a package that still exists. Then this returns nothing.
 */
export function detectDeletions(before: string[], after: string[]): string[] {
  const had = new Set(before.filter(Boolean));
  const has = new Set(after.filter(Boolean));
  for (const s of has) if (!had.has(s)) return [];
  return [...had].filter((s) => !has.has(s));
}

/** Drop every row that pointed at a deleted package. Mutates `cat`. */
export function applyPackageDeletions(cat: Catalog, slugs: string[]) {
  const result = { prices: 0, departures: 0, creatorTrips: 0 };
  if (!slugs.length) return result;
  const dead = new Set(slugs);

  const prices = (cat.prices ?? []).filter((r) => !dead.has(r.packageSlug));
  result.prices = (cat.prices ?? []).length - prices.length;
  cat.prices = prices;

  const departures = (cat.departures ?? []).filter((d) => !dead.has(d.packageSlug));
  result.departures = (cat.departures ?? []).length - departures.length;
  cat.departures = departures;

  if (cat.creators?.length) {
    cat.creators = cat.creators.map((c) => {
      const trips = (c.trips ?? []).filter((t) => !dead.has(t.packageSlug));
      result.creatorTrips += (c.trips ?? []).length - trips.length;
      return trips.length === (c.trips ?? []).length ? c : { ...c, trips };
    });
  }

  // an old address that redirected to the deleted package would now 301 to a 404
  if (cat.slugAliases) {
    cat.slugAliases = Object.fromEntries(Object.entries(cat.slugAliases).filter(([, to]) => !dead.has(to)));
  }
  return result;
}

/**
 * Drop a deleted city's prices and take it off every batch. A batch it was
 * the only boarding point for has nowhere left to board, so it goes too.
 * Mutates `cat`.
 */
export function applyCityDeletions(cat: Catalog, slugs: string[]) {
  const result = { prices: 0, departures: 0, departuresTrimmed: 0 };
  if (!slugs.length) return result;
  const dead = new Set(slugs);

  const prices = (cat.prices ?? []).filter((r) => !dead.has(r.citySlug));
  result.prices = (cat.prices ?? []).length - prices.length;
  cat.prices = prices;

  const departures: Catalog["departures"] = [];
  for (const d of cat.departures ?? []) {
    const citySlugs = d.citySlugs.filter((s) => !dead.has(s));
    if (citySlugs.length === d.citySlugs.length) departures.push(d);
    else if (citySlugs.length) {
      result.departuresTrimmed++;
      departures.push({ ...d, citySlugs });
    } else result.departures++;
  }
  cat.departures = departures;
  return result;
}
