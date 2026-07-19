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
import type { Booking, Catalog, Review } from "./types";

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
  seeded = true;
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

export interface MediaItem { path: string; bytes: number; dir: "images" | "uploads" }

export function listMedia(): MediaItem[] {
  ensureSeeded();
  const out: MediaItem[] = [];
  for (const dir of ["images", "uploads"] as const) {
    const abs = path.join(PUBLIC_DIR, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      out.push({ path: `/${dir}/${f}`, bytes: fs.statSync(path.join(abs, f)).size, dir });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** resolve a public web path (/images/x.jpg | /uploads/x.jpg) safely to disk */
export function resolvePublicImage(webPath: string): string | null {
  if (!/^\/(images|uploads)\/[\w.\-]+\.(jpe?g|png|webp)$/i.test(webPath)) return null;
  const abs = path.resolve(path.join(PUBLIC_DIR, webPath));
  const root = path.resolve(PUBLIC_DIR) + path.sep;
  if (!abs.startsWith(root)) return null; // path traversal guard
  return abs;
}

export function saveImage(buffer: Buffer, opts: { replacePath?: string; name?: string; ext: string }): string {
  ensureSeeded();
  if (opts.replacePath) {
    const abs = resolvePublicImage(opts.replacePath);
    if (!abs || !fs.existsSync(abs)) throw new Error("replace target not found");
    fs.writeFileSync(abs, buffer);
    return opts.replacePath;
  }
  const base = (opts.name ?? "photo").toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "photo";
  const file = `${base}-${randomUUID().slice(0, 6)}.${opts.ext}`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "uploads", file), buffer);
  return `/uploads/${file}`;
}
