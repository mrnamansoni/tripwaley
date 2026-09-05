import type { Catalog } from "./types";

/**
 * Remembering what the admin DELETED, so the seed can't put it back.
 *
 * The seed catalog shipped inside the Docker image is a starting point, and
 * mergeSeedContent() adds any seed row the live catalog doesn't have. That is
 * right on day one and wrong forever after: once the site is live, a seed row
 * missing from the live catalog doesn't mean "not imported yet", it means
 * "the admin deleted it".
 *
 * The symptom was reported as departures coming back "whenever we push": the
 * seed carries 54 June 2026 departures, and every SEED_VERSION bump re-added
 * every one the admin had cleared out. Deleting them again didn't help,
 * because the next bump resurrected them again.
 *
 * So deletions are recorded as tombstones. Two ways in:
 *
 *   • on save — the admin panel PUTs a whole section, so any seed row absent
 *     from what they saved was deliberately removed. Precise and automatic.
 *   • once, at migration — installs that predate this file already have a
 *     backlog of deletions with no record, so the first merge captures them.
 *
 * Genuinely new seed content still arrives: a row that has never been in the
 * live catalog has no tombstone, so it merges as before.
 */

export interface SeedRemovals {
  cities?: string[];
  packages?: string[];
  prices?: string[];
  departures?: string[];
  colleges?: string[];
  coupons?: string[];
  creators?: string[];
}

export type SeedSection = keyof SeedRemovals;

/** the identity of a row within its collection — must match mergeSeedContent */
export const SEED_KEY: { [K in SeedSection]: (row: Record<string, unknown>) => string } = {
  cities: (c) => String(c.slug ?? ""),
  packages: (p) => String(p.slug ?? ""),
  prices: (r) => `${String(r.packageSlug ?? "")}|${String(r.citySlug ?? "")}`,
  departures: (d) => `${String(d.date ?? "")}|${String(d.packageSlug ?? "")}`,
  colleges: (c) => String(c.slug ?? ""),
  coupons: (c) => String(c.code ?? "").toUpperCase(),
  creators: (c) => String(c.slug ?? ""),
};

export const SEED_SECTIONS = Object.keys(SEED_KEY) as SeedSection[];

/** is this a collection the seed merge can add rows to? */
export function isSeedSection(name: string): name is SeedSection {
  return (SEED_SECTIONS as string[]).includes(name);
}

function rowsOf(cat: Catalog, section: SeedSection): Record<string, unknown>[] {
  const v = (cat as unknown as Record<string, unknown>)[section];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

export function keysOf(section: SeedSection, rows: readonly unknown[]): Set<string> {
  const key = SEED_KEY[section];
  const out = new Set<string>();
  for (const row of rows) {
    // a null or non-object row must not throw: mergeSeedContent runs inside a
    // try/catch, so one malformed row would silently abandon the whole
    // migration — including the tombstones that keep deletions deleted
    if (!row || typeof row !== "object") continue;
    const k = key(row as Record<string, unknown>);
    if (k) out.add(k);
  }
  return out;
}

/** the tombstones for one section, as a fast lookup */
export function removedSet(removals: SeedRemovals | undefined, section: SeedSection): Set<string> {
  return new Set(removals?.[section] ?? []);
}

/**
 * Seed rows that are not in `live` — i.e. rows the admin has removed.
 *
 * Only meaningful against a catalog that has already been seeded once. On a
 * fresh install live is a copy of the seed, so this is empty.
 */
export function collectRemovals(seed: Catalog, live: Catalog): SeedRemovals {
  const out: SeedRemovals = {};
  for (const section of SEED_SECTIONS) {
    const have = keysOf(section, rowsOf(live, section));
    const gone = [...keysOf(section, rowsOf(seed, section))].filter((k) => !have.has(k));
    if (gone.length) out[section] = gone;
  }
  return out;
}

/**
 * Tombstones for ONE section, given what the admin just saved.
 * Used by the admin PUT, which replaces a whole section at a time.
 */
export function removalsForSection(
  seed: Catalog,
  section: SeedSection,
  saved: readonly unknown[]
): string[] {
  const have = keysOf(section, saved);
  return [...keysOf(section, rowsOf(seed, section))].filter((k) => !have.has(k));
}

/** union of two tombstone sets — tombstones are only ever added, never dropped */
export function mergeRemovals(a: SeedRemovals | undefined, b: SeedRemovals | undefined): SeedRemovals {
  const out: SeedRemovals = {};
  for (const section of SEED_SECTIONS) {
    const merged = new Set([...(a?.[section] ?? []), ...(b?.[section] ?? [])]);
    if (merged.size) out[section] = [...merged];
  }
  return out;
}

/**
 * Re-adding a row the admin deliberately deleted is the bug. Re-adding one
 * they never had is the feature. This tells the two apart.
 */
export function keepForMerge<T>(
  section: SeedSection,
  candidates: T[],
  removals: SeedRemovals | undefined
): T[] {
  const dead = removedSet(removals, section);
  if (!dead.size) return candidates;
  const key = SEED_KEY[section];
  return candidates.filter((row) => !dead.has(key(row as Record<string, unknown>)));
}
