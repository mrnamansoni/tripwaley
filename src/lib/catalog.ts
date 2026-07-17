/**
 * Catalog repository — SERVER ONLY data gateway.
 * Reads the runtime store (./data), which the admin panel writes to.
 * Client components import types/formatters from lib/types instead.
 */

import { readCatalog, readReviews } from "./store";
import type { BlogPost, City, Departure, Faq, Package, PriceRule, Review, Settings, VideoTestimonial } from "./types";
import { resolveSlot as resolveSlotPure, resolveContent as resolveContentPure, DEFAULT_VIDEO_TESTIMONIAL } from "./types";
import {
  collections as collectionDefaults,
  galleryPhotos as galleryDefaults,
  moments as momentDefaults,
  type Collection,
  type Moment,
} from "./data";

export * from "./types";

/* ------------------------------------------------ image slots */

/** the photo(s) assigned to a named slot (admin-editable, falls to defaults) */
export function slot(key: string): string[] {
  return resolveSlotPure(readCatalog().media, key);
}
/** convenience for single-image slots */
export const slotOne = (key: string): string => slot(key)[0];

/* ------------------------------------------------ editable section copy */

/** resolved section-copy string for a ContentDef key (admin-editable). */
export function text(key: string): string {
  return resolveContentPure(readCatalog().content, key);
}

/* ------------------------------------------------ global FAQ + blog */

export const getFaqs = (): Faq[] => {
  const f = readCatalog().faqs;
  return f && f.length ? f : DEFAULT_FAQS;
};
export const getPosts = (): BlogPost[] => (readCatalog().posts ?? []).filter((p) => p.published);
export const getAllPosts = (): BlogPost[] => readCatalog().posts ?? [];
export const getPost = (slug: string): BlogPost | undefined => getPosts().find((p) => p.slug === slug);

export const DEFAULT_FAQS: Faq[] = [
  { q: "Are these trips solo-friendly?", a: "Completely. Most of our travellers join solo — you're placed in a small batch with a certified trip captain, and by day two it feels like a friend group." },
  { q: "What does the price include?", a: "Stays, most meals, all transport from the boarding city, permits, and your trip captain. The exact inclusions are listed on every trip page — no hidden costs." },
  { q: "How do I hold a seat?", a: "Tap 'Hold a seat', drop your number, and we block it free for 24 hours while you decide. No payment needed to hold." },
  { q: "What's the cancellation policy?", a: "Free cancellation until 7 days before departure. Closer to the date, partial refunds apply — the full policy is shared before you pay." },
];

/* ------------------------------------------------ photo overlays

   Each decorative group keeps its text in lib/data but its images come from an
   admin slot, overlaid by index (falls back to the data default per card). So
   every card photo across the site is swappable from the Media tab. */

function overlayImages<T>(items: T[], slotKey: string, apply: (item: T, img: string) => T): T[] {
  const imgs = slot(slotKey);
  return items.map((item, i) => (imgs[i] ? apply(item, imgs[i]) : item));
}

export const getCollections = (): Collection[] =>
  overlayImages(collectionDefaults, "collections.cards", (c, image) => ({ ...c, image }));
export const getMoments = (): Moment[] =>
  overlayImages(momentDefaults, "home.moments", (m, image) => ({ ...m, image }));
export const getGalleryPhotos = (): { src: string; label: string }[] => {
  const imgs = slot("home.gallery");
  // gallery is variable-length: use the slot as source of truth, labels by index
  return imgs.map((src, i) => ({ src, label: galleryDefaults[i]?.label ?? "" }));
};

/* ------------------------------------------------ accessors */

export const getSettings = (): Settings => readCatalog().settings;

/** the destinations-page video testimonial, merged over sensible defaults */
export const getVideoTestimonial = (): VideoTestimonial => ({
  ...DEFAULT_VIDEO_TESTIMONIAL,
  ...(readCatalog().settings.videoTestimonial ?? {}),
});
export const getCities = (): City[] => readCatalog().cities;
export const getPricedCities = (): City[] => readCatalog().cities.filter((c) => c.priced);
export const getCity = (slug: string): City | undefined => readCatalog().cities.find((c) => c.slug === slug);

export const getLivePackages = (): Package[] => readCatalog().packages.filter((p) => p.status === "live");
export const getRichPackages = (): Package[] => getLivePackages().filter((p) => p.rich || p.itinerary.length > 0);
export const getPackage = (slug: string): Package | undefined => readCatalog().packages.find((p) => p.slug === slug);

export const getReviews = (): Review[] => readReviews();

export function priceFor(packageSlug: string, citySlug: string): PriceRule | undefined {
  return readCatalog().prices.find((r) => r.packageSlug === packageSlug && r.citySlug === citySlug);
}
export function fromPrice(packageSlug: string, citySlug?: string): number | undefined {
  const prices = readCatalog().prices;
  if (citySlug) {
    const r = prices.find((x) => x.packageSlug === packageSlug && x.citySlug === citySlug);
    if (r) return Math.min(...([r.triple, r.double, r.quad].filter(Boolean) as number[]));
  }
  const all = prices.filter((r) => r.packageSlug === packageSlug);
  if (!all.length) return undefined;
  return Math.min(...all.flatMap((r) => [r.triple, r.double, r.quad].filter(Boolean) as number[]));
}
export function citiesPricedFor(packageSlug: string): { city: City; rule: PriceRule }[] {
  const cat = readCatalog();
  return cat.prices
    .filter((r) => r.packageSlug === packageSlug)
    .map((rule) => ({ city: cat.cities.find((c) => c.slug === rule.citySlug)!, rule }))
    .filter((x) => x.city);
}

export interface DepartureView {
  date: string;
  package: Package;
  cities: City[];
  fromCity?: City;
}
export function upcomingDepartures(opts: { citySlug?: string; packageSlug?: string; limit?: number; from?: string } = {}): DepartureView[] {
  const cat = readCatalog();
  const { citySlug, packageSlug, limit = 50, from } = opts;
  const sorted = [...cat.departures].sort((a, b) => a.date.localeCompare(b.date));
  const floor = from ?? sorted[0]?.date ?? "";
  const out: DepartureView[] = [];
  for (const d of sorted) {
    if (d.date < floor) continue;
    if (packageSlug && d.packageSlug !== packageSlug) continue;
    if (citySlug && !d.citySlugs.includes(citySlug)) continue;
    const pkg = cat.packages.find((p) => p.slug === d.packageSlug);
    if (!pkg || pkg.status !== "live") continue;
    out.push({
      date: d.date,
      package: pkg,
      cities: d.citySlugs.map((c) => cat.cities.find((x) => x.slug === c)!).filter(Boolean),
      fromCity: citySlug ? cat.cities.find((c) => c.slug === citySlug) : undefined,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export type { Departure };
