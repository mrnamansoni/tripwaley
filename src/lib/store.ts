/**
 * Runtime data store — SERVER ONLY.
 *
 * All site content lives in ./data (catalog, reviews, bookings) and all
 * imagery in ./public. The admin panel writes here; the site reads here.
 * On the VPS both directories are Docker volumes, so content survives
 * deploys — and swapping this file for a Postgres client later changes
 * nothing above it.
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_CAPTAINS } from "./types";
import type { Booking, Catalog, Review } from "./types";

/** Bump when src/data/catalog.json gains packages/prices/departures that an
 *  already-running install should receive. mergeSeedContent() then adds only
 *  the rows whose keys are missing — admin edits are never overwritten. */
const SEED_VERSION = 8;

const DATA_DIR = path.join(process.cwd(), "data");
const SEED_CATALOG = path.join(process.cwd(), "src", "data", "catalog.json");
const SEED_REVIEWS = path.join(process.cwd(), "src", "data", "reviews.json");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const FILES = {
  catalog: path.join(DATA_DIR, "catalog.json"),
  reviews: path.join(DATA_DIR, "reviews.json"),
  bookings: path.join(DATA_DIR, "bookings.json"),
};

/* ------------------------------------------------ bootstrap & seeding */

let seeded = false;

function ensureSeeded() {
  // once per process — a single page render fans out to hundreds of catalog
  // reads; re-running 5 fs.existsSync checks each time is pure blocking waste.
  if (seeded) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILES.catalog)) fs.copyFileSync(SEED_CATALOG, FILES.catalog);
  if (!fs.existsSync(FILES.reviews)) fs.copyFileSync(SEED_REVIEWS, FILES.reviews);
  if (!fs.existsSync(FILES.bookings)) fs.writeFileSync(FILES.bookings, "[]");
  const uploads = path.join(PUBLIC_DIR, "uploads");
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
  seeded = true; // set before merging: mergeSeedContent reads through readJson
  mergeSeedContent();
}

/**
 * Fill in fields the seed has gained on rows that ALREADY exist live.
 *
 * The merge below only ever adds whole rows, which is the right default —
 * but it means a genuinely new *field* (per-day meals, a creator epithet)
 * can never reach a package that was merged in an earlier seed version.
 *
 * This fills such a field ONLY where the live row has no value for it. An
 * admin's value always wins; nothing is ever replaced, only filled. Keep it
 * to additive, low-risk fields — never prices, dates or copy the owner edits.
 */
function backfill(next: Catalog, seed: Catalog): number {
  let n = 0;

  const seedPkgs = new Map((seed.packages ?? []).map((p) => [p.slug, p]));
  next.packages = next.packages.map((live) => {
    const from = seedPkgs.get(live.slug);
    if (!from?.itinerary?.length || !live.itinerary?.length) return live;

    const byDay = new Map(from.itinerary.map((d) => [d.day, d]));
    let touched = false;
    const itinerary = live.itinerary.map((d) => {
      const src = byDay.get(d.day);
      if (!src) return d;
      const patch: Partial<typeof d> = {};
      if (d.meals === undefined && src.meals !== undefined) patch.meals = src.meals;
      if (d.stay === undefined && src.stay !== undefined) patch.stay = src.stay;
      if (!Object.keys(patch).length) return d;
      touched = true;
      return { ...d, ...patch };
    });
    if (!touched) return live;
    n++;
    return { ...live, itinerary };
  });

  // settings is a single object that always exists live, so a genuinely new
  // key (the analytics IDs) can only ever arrive through a backfill
  for (const key of ["gaId", "metaPixelId", "legalName", "entityType", "address", "grievance"] as const) {
    if (next.settings[key] === undefined && seed.settings?.[key] !== undefined) {
      next.settings = { ...next.settings, [key]: seed.settings[key] };
      n++;
    }
  }


  /* Captains move from a hardcoded array + a photo-only media slot into real
     editable rows. An existing install has already chosen those photos through
     media["captains"], so carry them across by index — otherwise turning on
     the new tab would silently reset the owner's pictures to the stock ones. */
  if (!next.captains?.length) {
    const chosen = next.media?.captains ?? [];
    next.captains = DEFAULT_CAPTAINS.map((c, i) => ({ ...c, photo: chosen[i] || c.photo }));
    n += next.captains.length;
  }

  const seedCreators = new Map((seed.creators ?? []).map((c) => [c.slug, c]));
  if (next.creators?.length) {
    next.creators = next.creators.map((live) => {
      const from = seedCreators.get(live.slug);
      if (!from || live.epithet !== undefined || from.epithet === undefined) return live;
      n++;
      return { ...live, epithet: from.epithet };
    });
  }

  return n;
}

/**
 * Additive, idempotent seed merge.
 *
 * The runtime catalog lives on a Docker volume and is never re-copied from the
 * seed, so new starter content shipped in src/data/catalog.json would otherwise
 * never reach an existing install. This adds ONLY rows whose key is absent —
 * an admin's edited copy of a row always wins, and nothing is ever deleted.
 */
function mergeSeedContent() {
  try {
    const live = readJson<Catalog>(FILES.catalog);
    if ((live.seedVersion ?? 0) >= SEED_VERSION) return;

    const seed = JSON.parse(fs.readFileSync(SEED_CATALOG, "utf8")) as Catalog;
    const next: Catalog = { ...live };
    let added = 0;

    const haveCities = new Set(live.cities.map((c) => c.slug));
    const newCities = (seed.cities ?? []).filter((c) => !haveCities.has(c.slug));
    if (newCities.length) { next.cities = [...live.cities, ...newCities]; added += newCities.length; }

    const havePkgs = new Set(live.packages.map((p) => p.slug));
    const newPkgs = (seed.packages ?? []).filter((p) => !havePkgs.has(p.slug));
    if (newPkgs.length) { next.packages = [...live.packages, ...newPkgs]; added += newPkgs.length; }

    const priceKey = (r: { packageSlug: string; citySlug: string }) => `${r.packageSlug}|${r.citySlug}`;
    const havePrices = new Set(live.prices.map(priceKey));
    const newPrices = (seed.prices ?? []).filter((r) => !havePrices.has(priceKey(r)));
    if (newPrices.length) { next.prices = [...live.prices, ...newPrices]; added += newPrices.length; }

    const depKey = (d: { date: string; packageSlug: string }) => `${d.date}|${d.packageSlug}`;
    const haveDeps = new Set(live.departures.map(depKey));
    const newDeps = (seed.departures ?? []).filter((d) => !haveDeps.has(depKey(d)));
    if (newDeps.length) { next.departures = [...live.departures, ...newDeps]; added += newDeps.length; }

    const haveColleges = new Set((live.colleges ?? []).map((c) => c.slug));
    const newColleges = (seed.colleges ?? []).filter((c) => !haveColleges.has(c.slug));
    if (newColleges.length) { next.colleges = [...(live.colleges ?? []), ...newColleges]; added += newColleges.length; }

    const haveCoupons = new Set((live.coupons ?? []).map((c) => c.code.toUpperCase()));
    const newCoupons = (seed.coupons ?? []).filter((c) => !haveCoupons.has(c.code.toUpperCase()));
    if (newCoupons.length) { next.coupons = [...(live.coupons ?? []), ...newCoupons]; added += newCoupons.length; }

    const haveCreators = new Set((live.creators ?? []).map((c) => c.slug));
    const newCreators = (seed.creators ?? []).filter((c) => !haveCreators.has(c.slug));
    if (newCreators.length) { next.creators = [...(live.creators ?? []), ...newCreators]; added += newCreators.length; }

    added += backfill(next, seed);

    next.seedVersion = SEED_VERSION;
    writeJson(FILES.catalog, next);
    if (added) console.log(`[store] seed v${SEED_VERSION}: merged ${added} new row(s)`);
  } catch (e) {
    // a bad merge must never take the site down — the existing catalog is fine
    console.error("[store] seed merge skipped:", e instanceof Error ? e.message : e);
  }
}

/* ------------------------------------------------ mtime-memoised reads */

const cache = new Map<string, { mtime: number; value: unknown }>();

function readJson<T>(file: string): T {
  ensureSeeded();
  const mtime = fs.statSync(file).mtimeMs;
  const hit = cache.get(file);
  if (hit && hit.mtime === mtime) return hit.value as T;
  const value = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  cache.set(file, { mtime, value });
  return value;
}

/** atomic write: tmp file + rename, then refresh the memo */
function writeJson(file: string, value: unknown) {
  ensureSeeded();
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 1));
  fs.renameSync(tmp, file);
  cache.set(file, { mtime: fs.statSync(file).mtimeMs, value });
}

/* ------------------------------------------------ public API */

export const readCatalog = (): Catalog => readJson<Catalog>(FILES.catalog);
export const writeCatalog = (c: Catalog) => writeJson(FILES.catalog, c);

export const readReviews = (): Review[] => readJson<Review[]>(FILES.reviews);
export const writeReviews = (r: Review[]) => writeJson(FILES.reviews, r);

export const readBookings = (): Booking[] => readJson<Booking[]>(FILES.bookings);
export function appendBooking(b: Omit<Booking, "id" | "ts">): Booking {
  const row: Booking = { id: randomUUID().slice(0, 8), ts: new Date().toISOString(), ...b };
  const all = [...readBookings(), row];
  writeJson(FILES.bookings, all.slice(-1000)); // keep the last 1000 leads
  return row;
}

/* ------------------------------------------------ media library */

export interface MediaItem { path: string; bytes: number; dir: "images" | "uploads"; kind: "image" | "video" }

const LIB_IMAGE = /\.(jpe?g|png|webp|avif|gif)$/i;
const LIB_VIDEO = /\.(mp4|webm|mov|m4v)$/i;

export function listMedia(): MediaItem[] {
  ensureSeeded();
  const out: MediaItem[] = [];
  for (const dir of ["images", "uploads"] as const) {
    const abs = path.join(PUBLIC_DIR, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      const isVid = LIB_VIDEO.test(f);
      if (!isVid && !LIB_IMAGE.test(f)) continue;
      out.push({
        path: `/${dir}/${f}`,
        bytes: fs.statSync(path.join(abs, f)).size,
        dir,
        kind: isVid ? "video" : "image",
      });
    }
  }
  // newest uploads first, then the bundled library — the admin almost always
  // wants the file they just added, not the alphabetical top of /images
  return out.sort((a, b) => (a.dir === b.dir ? a.path.localeCompare(b.path) : a.dir === "uploads" ? -1 : 1));
}

/** resolve a public web path (/images/x.jpg | /uploads/x.mp4) safely to disk */
export function resolvePublicMedia(webPath: string): string | null {
  if (!/^\/(images|uploads)\/[\w.\-]+\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|m4v)$/i.test(webPath)) return null;
  const abs = path.resolve(path.join(PUBLIC_DIR, webPath));
  const root = path.resolve(PUBLIC_DIR) + path.sep;
  if (!abs.startsWith(root)) return null; // path traversal guard
  return abs;
}

export function saveMedia(buffer: Buffer, opts: { replacePath?: string; name?: string; ext: string }): string {
  ensureSeeded();
  if (opts.replacePath) {
    const abs = resolvePublicMedia(opts.replacePath);
    if (!abs || !fs.existsSync(abs)) throw new Error("replace target not found");
    // a replace must keep the same URL, so it must keep the same file type —
    // swapping a .jpg's bytes for an .mp4 would break every <img> using it
    if (path.extname(abs).slice(1).toLowerCase() !== opts.ext.toLowerCase()) {
      throw new Error(`replace must be the same file type (${path.extname(abs)})`);
    }
    fs.writeFileSync(abs, buffer);
    return opts.replacePath;
  }
  const base = (opts.name ?? "photo").toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "photo";
  const file = `${base}-${randomUUID().slice(0, 6)}.${opts.ext}`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "uploads", file), buffer);
  return `/uploads/${file}`;
}
