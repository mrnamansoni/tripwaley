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
import { SLOT_DEFS, CONTENT_DEFS, resolveSlot } from "@/lib/types";
import type { BlogPost, Catalog, City, Departure, Faq, Package, PriceRule, Review } from "@/lib/types";

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

const IMG_PATH = /^\/(images|uploads)\/[\w.\-]+\.(jpe?g|png|webp)$/i;

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function validate(section: string, data: unknown): string | null {
  const objectSections = new Set(["settings", "media", "content"]);
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
    case "packages":
      return (data as Package[]).every((p) => isStr(p.slug) && p.slug && isStr(p.name) && (p.status === "live" || p.status === "draft")) ? null : "invalid package row";
    case "prices":
      return (data as PriceRule[]).every((r) => isStr(r.packageSlug) && isStr(r.citySlug) && (r.triple == null || isNum(r.triple)) && (r.double == null || isNum(r.double))) ? null : "invalid price rule";
    case "departures":
      return (data as Departure[]).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && isStr(d.packageSlug) && Array.isArray(d.citySlugs)) ? null : "invalid departure row";
    case "reviews":
      return (data as Review[]).every((r) => isStr(r.name) && isStr(r.text) && isNum(r.rating) && r.rating >= 1 && r.rating <= 5) ? null : "invalid review row";
    case "media": {
      const m = data as Record<string, unknown>;
      const known = new Set(SLOT_DEFS.map((d) => d.key));
      for (const [key, arr] of Object.entries(m)) {
        if (!known.has(key)) return `unknown slot ${key}`;
        if (!Array.isArray(arr) || !arr.every((p) => typeof p === "string" && IMG_PATH.test(p))) return `invalid images for slot ${key}`;
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
    writeCatalog(cat);
  }

  revalidatePath("/", "layout"); // the whole site re-renders with fresh data
  return NextResponse.json({ ok: true });
}
