/**
 * Admin data endpoint — the single gateway the panel talks to.
 * GET  → everything (catalog + reviews + bookings + media library)
 * PUT  → { section, data } where section ∈ settings | cities | packages |
 *        prices | departures | reviews. Every save revalidates the site.
 * Auth is enforced upstream by src/proxy.ts; origin re-checked here.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sameOrigin } from "@/lib/auth";
import { listMedia, readBookings, readCatalog, readReviews, writeCatalog, writeReviews } from "@/lib/store";
import { SLOT_DEFS, CONTENT_DEFS, resolveSlot, PAGE_SECTION_DEFS, isValidMediaRef, CATEGORY_DEFS, CREATOR_POSE_DEFS } from "@/lib/types";
import type { BlogPost, Catalog, City, Creator, Departure, Faq, Package, PriceRule, Review, WireEntry } from "@/lib/types";

export async function GET() {
  const cat = readCatalog();
  // resolved slot values so the admin shows what's actually rendering
  const slots = Object.fromEntries(SLOT_DEFS.map((d) => [d.key, resolveSlot(cat.media, d.key)]));
  return NextResponse.json({
    catalog: cat,
    reviews: readReviews(),
    bookings: [...readBookings()].reverse(),
    media: listMedia(),
    slots,
  });
}

const CATEGORY_KEYS = new Set<string>(CATEGORY_DEFS.map((c) => c.key));
const POSE_KEYS = new Set<string>(CREATOR_POSE_DEFS.map((p) => p.key));
/** every value in a figures map must be a real, known pose + valid media */
const okFigures = (v: unknown, where: string): string | null => {
  if (v == null) return null;
  if (typeof v !== "object") return `invalid figures on ${where}`;
  for (const [pose, ref] of Object.entries(v as Record<string, unknown>)) {
    if (!POSE_KEYS.has(pose)) return `unknown figure placement "${pose}" on ${where}`;
    if (!okMedia(ref)) return `invalid figure media for ${pose} on ${where}`;
  }
  return null;
};

const isStr = (v: unknown): v is string => typeof v === "string";
/** optional media ref: unset/blank is fine, otherwise must be a real ref */
const okMedia = (v: unknown): boolean => v == null || v === "" || isValidMediaRef(v);
/** optional link the admin pastes (itinerary PDF, etc.) */
const okLink = (v: unknown): boolean =>
  v == null || v === "" || (typeof v === "string" && /^https?:\/\//i.test(v) && v.length <= 500);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
/** real calendar date, not just the right shape (rejects 2026-13-45) */
const isValidISODate = (s: unknown): boolean => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const dt = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === s;
};

function validate(section: string, data: unknown): string | null {
  const objectSections = new Set(["settings", "media", "content", "pageSections"]);
  if (!Array.isArray(data) && !objectSections.has(section)) return "expected an array";
  switch (section) {
    case "settings": {
      const s = data as Record<string, unknown>;
      if (!isStr(s.whatsapp) || !isStr(s.brand) || !isStr(s.defaultCity)) return "settings missing required fields";
      if (!isNum(s.advancePercent) || s.advancePercent < 0 || s.advancePercent > 100) return "advancePercent must be 0–100";
      return null;
    }
    case "cities":
      return (data as City[]).every((c) => isStr(c.slug) && c.slug && isStr(c.name) && isNum(c.lat) && isNum(c.lng)) ? null : "invalid city row";
    case "packages": {
      for (const p of data as Package[]) {
        if (!isStr(p.slug) || !p.slug || !isStr(p.name) || (p.status !== "live" && p.status !== "draft")) return "invalid package row";
        if (p.categories != null && (!Array.isArray(p.categories) || !p.categories.every((c) => CATEGORY_KEYS.has(c)))) {
          return `invalid categories on ${p.slug}`;
        }
        if (!okLink(p.itineraryPdf)) return `itinerary PDF on ${p.slug} must be a full http(s) link`;
        if (!okMedia(p.heroMedia)) return `invalid hero media on ${p.slug}`;
        if (p.images != null && (!Array.isArray(p.images) || !p.images.every(isValidMediaRef))) return `invalid gallery on ${p.slug}`;
        if (p.itinerary != null && (!Array.isArray(p.itinerary) || !p.itinerary.every((d) => okMedia(d.image)))) {
          return `invalid day photo on ${p.slug}`;
        }
      }
      return null;
    }
    case "prices":
      return (data as PriceRule[]).every((r) => isStr(r.packageSlug) && isStr(r.citySlug) && (r.triple == null || isNum(r.triple)) && (r.double == null || isNum(r.double))) ? null : "invalid price rule";
    case "departures":
      return (data as Departure[]).every((d) => isValidISODate(d.date) && isStr(d.packageSlug) && Array.isArray(d.citySlugs)) ? null : "invalid departure row";
    case "reviews":
      return (data as Review[]).every((r) => isStr(r.name) && isStr(r.text) && isNum(r.rating) && r.rating >= 1 && r.rating <= 5) ? null : "invalid review row";
    case "media": {
      const m = data as Record<string, unknown>;
      const known = new Set(SLOT_DEFS.map((d) => d.key));
      for (const [key, arr] of Object.entries(m)) {
        if (!known.has(key)) return `unknown slot ${key}`;
        if (!Array.isArray(arr) || !arr.every(isValidMediaRef)) return `invalid media for slot ${key}`;
      }
      return null;
    }
    case "content": {
      const c = data as Record<string, unknown>;
      const known = new Set(CONTENT_DEFS.map((d) => d.key));
      for (const [key, val] of Object.entries(c)) {
        if (!known.has(key)) return `unknown content key ${key}`;
        if (typeof val !== "string") return `content ${key} must be a string`;
      }
      return null;
    }
    case "faqs":
      return (data as Faq[]).every((f) => isStr(f.q) && isStr(f.a)) ? null : "invalid faq row";
    case "pageSections": {
      const ps = data as Record<string, unknown>;
      const known = new Set(PAGE_SECTION_DEFS.map((d) => `${d.page}.${d.key}`));
      for (const [page, sections] of Object.entries(ps)) {
        if (typeof sections !== "object" || sections === null) return `invalid sections for page ${page}`;
        for (const [key, val] of Object.entries(sections as Record<string, unknown>)) {
          if (!known.has(`${page}.${key}`)) return `unknown page section ${page}.${key}`;
          if (typeof val !== "boolean") return `section ${page}.${key} must be boolean`;
        }
      }
      return null;
    }
    case "creators": {
      const seen = new Set<string>();
      for (const c of data as Creator[]) {
        if (!isStr(c.slug) || !/^[a-z0-9-]+$/.test(c.slug)) return "creator slug must be lowercase letters, numbers and dashes";
        if (seen.has(c.slug)) return `duplicate creator slug ${c.slug}`;
        seen.add(c.slug);
        if (!isStr(c.name) || !c.name.trim()) return `creator ${c.slug} needs a name`;
        if (!isStr(c.firstName) || !c.firstName.trim()) return `creator ${c.slug} needs a first name`;
        if (c.accent !== "gold" && c.accent !== "brand") return `creator ${c.slug} has an invalid accent`;
        if (typeof c.published !== "boolean") return `creator ${c.slug} needs a published flag`;
        if (!okMedia(c.portrait) || !okMedia(c.cover) || !okMedia(c.cutout)) return `invalid media on creator ${c.slug}`;
        if (c.gallery != null && (!Array.isArray(c.gallery) || !c.gallery.every(okMedia))) return `invalid gallery on ${c.slug}`;
        const figErr = okFigures(c.figures, c.slug);
        if (figErr) return figErr;
        if (!Array.isArray(c.trips)) return `creator ${c.slug} needs a trips array`;

        const usedPkgs = new Set<string>();
        for (const t of c.trips) {
          if (!isStr(t.packageSlug) || !t.packageSlug) return `creator ${c.slug} has a trip with no package`;
          if (usedPkgs.has(t.packageSlug)) return `creator ${c.slug} lists ${t.packageSlug} twice`;
          usedPkgs.add(t.packageSlug);
          if (typeof t.published !== "boolean") return `trip ${t.packageSlug} needs a published flag`;
          if (t.price != null && (!isNum(t.price) || t.price < 0)) return `invalid price on ${c.slug}/${t.packageSlug}`;
          if (!okMedia(t.heroMedia)) return `invalid hero on ${c.slug}/${t.packageSlug}`;
          const tripFigErr = okFigures(t.figures, `${c.slug}/${t.packageSlug}`);
          if (tripFigErr) return tripFigErr;
          if (!Array.isArray(t.dates)) return `trip ${t.packageSlug} needs a dates array`;
          for (const d of t.dates) {
            if (!isValidISODate(d.date)) return `invalid date on ${c.slug}/${t.packageSlug}`;
            if (!isNum(d.seats) || d.seats < 0) return `invalid seat count on ${c.slug}/${t.packageSlug} ${d.date}`;
            if (!isNum(d.seatsLeft) || d.seatsLeft < 0 || d.seatsLeft > d.seats) {
              return `seats left must be between 0 and ${d.seats} on ${c.slug}/${t.packageSlug} ${d.date}`;
            }
          }
          if (t.itinerary != null && (!Array.isArray(t.itinerary) || !t.itinerary.every((x) => isNum(x.day) && isStr(x.title) && okMedia(x.image)))) {
            return `invalid itinerary override on ${c.slug}/${t.packageSlug}`;
          }
        }
      }
      return null;
    }
    case "wire":
      return (data as WireEntry[]).every((w) => isStr(w.name) && isStr(w.city) && isStr(w.act) && isStr(w.trip)) ? null : "invalid wire row";
    case "posts":
      return (data as BlogPost[]).every(
        (p) => isStr(p.slug) && p.slug && isStr(p.title) && typeof p.published === "boolean"
      ) ? null : "invalid post row";
    default:
      return "unknown section";
  }
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { section?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { section, data } = body;
  if (!section || data === undefined) return NextResponse.json({ error: "section and data required" }, { status: 400 });

  const problem = validate(section, data);
  if (problem) return NextResponse.json({ error: problem }, { status: 422 });

  if (section === "reviews") {
    writeReviews(data as Review[]);
  } else {
    const cat: Catalog = { ...readCatalog() };
    if (section === "settings") cat.settings = { ...cat.settings, ...(data as Catalog["settings"]) };
    if (section === "cities") cat.cities = data as City[];
    if (section === "packages") cat.packages = data as Package[];
    if (section === "prices") cat.prices = data as PriceRule[];
    if (section === "departures") cat.departures = data as Departure[];
    if (section === "media") cat.media = { ...cat.media, ...(data as Record<string, string[]>) };
    if (section === "content") cat.content = { ...cat.content, ...(data as Record<string, string>) };
    if (section === "faqs") cat.faqs = data as Faq[];
    if (section === "posts") cat.posts = data as BlogPost[];
    if (section === "pageSections") cat.pageSections = data as Record<string, Record<string, boolean>>;
    if (section === "wire") cat.wire = data as WireEntry[];
    if (section === "creators") cat.creators = data as Creator[];
    writeCatalog(cat);
  }

  revalidatePath("/", "layout"); // the whole site re-renders with fresh data
  return NextResponse.json({ ok: true });
}
