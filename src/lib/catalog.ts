/**
 * Catalog repository — SERVER ONLY data gateway.
 * Reads the runtime store (./data), which the admin panel writes to.
 * Client components import types/formatters from lib/types instead.
 */

import { readCatalog, readReviews } from "./store";
import type { BlogPost, City, Departure, Faq, Package, PriceRule, Review, Settings, VideoTestimonial, WireEntry } from "./types";
import { resolveSlot as resolveSlotPure, resolveContent as resolveContentPure, resolvePageSection, minRate, DEFAULT_FAQS, DEFAULT_VIDEO_TESTIMONIAL } from "./types";
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

/** the destinations-page video testimonial, merged over sensible defaults.
 *  Empty text fields fall back to the default (a plain spread would let a
 *  cleared quote blank the reel); videoUrl "" is kept — it's the intentional
 *  poster-only signal. */
export const getVideoTestimonial = (): VideoTestimonial => {
  const saved = readCatalog().settings.videoTestimonial;
  const d = DEFAULT_VIDEO_TESTIMONIAL;
  if (!saved) return { ...d };
  const nonEmpty = (v: string | undefined, def: string) => (v && v.trim() ? v : def);
  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : d.enabled,
    videoUrl: saved.videoUrl ?? d.videoUrl,
    poster: nonEmpty(saved.poster, d.poster),
    quote: nonEmpty(saved.quote, d.quote),
    name: nonEmpty(saved.name, d.name),
    trip: nonEmpty(saved.trip, d.trip),
    location: nonEmpty(saved.location, d.location),
  };
};

/** is a page section switched on? (admin Pages tab; unset = registry default) */
export const sectionOn = (page: "trips" | "destinations", key: string): boolean =>
  resolvePageSection(readCatalog().pageSections, page, key);

const DEFAULT_WIRE: WireEntry[] = [
  { name: "Sneha", city: "Pune", act: "held a seat on", trip: "Manali · next batch" },
  { name: "Kabir", city: "Delhi", act: "just booked", trip: "Jibhi · next batch" },
  { name: "Ishita", city: "Mumbai", act: "joined the waitlist for", trip: "Kashmir · Aug" },
  { name: "Dev", city: "Bengaluru", act: "paid the balance for", trip: "Kedarkantha · Dec" },
  { name: "Mira", city: "Jaipur", act: "just booked", trip: "Manikaran · next batch" },
  { name: "Aarav", city: "Kochi", act: "held a seat on", trip: "Rishikesh · next batch" },
];

/** admin-curated live-booking wire entries (falls back to a seeded set) */
export const getWire = (): WireEntry[] => {
  const w = readCatalog().wire;
  return w && w.length ? w : DEFAULT_WIRE;
};
export const getCities = (): City[] => readCatalog().cities;
export const getPricedCities = (): City[] => readCatalog().cities.filter((c) => c.priced);
export const getCity = (slug: string): City | undefined => readCatalog().cities.find((c) => c.slug === slug);

/** Guarantee every array/record field exists, so a package saved via the API
 *  without (say) an `itinerary` can never crash a page that reads `.length`. */
function normalizePackage(p: Package): Package {
  return {
    ...p,
    inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
    exclusions: Array.isArray(p.exclusions) ? p.exclusions : [],
    addons: Array.isArray(p.addons) ? p.addons : [],
    itinerary: Array.isArray(p.itinerary) ? p.itinerary : [],
    trekOptions: Array.isArray(p.trekOptions) ? p.trekOptions : [],
    travelTips: Array.isArray(p.travelTips) ? p.travelTips : [],
    thingsToCarry: Array.isArray(p.thingsToCarry) ? p.thingsToCarry : [],
    cityDetails: p.cityDetails ?? {},
  };
}

export const getLivePackages = (): Package[] => readCatalog().packages.filter((p) => p.status === "live").map(normalizePackage);
export const getRichPackages = (): Package[] => getLivePackages().filter((p) => p.rich || p.itinerary.length > 0);
export const getPackage = (slug: string): Package | undefined => {
  const p = readCatalog().packages.find((x) => x.slug === slug);
  return p ? normalizePackage(p) : undefined;
};

export const getReviews = (): Review[] => readReviews();

export function priceFor(packageSlug: string, citySlug: string): PriceRule | undefined {
  return readCatalog().prices.find((r) => r.packageSlug === packageSlug && r.citySlug === citySlug);
}
export function fromPrice(packageSlug: string, citySlug?: string): number | undefined {
  const prices = readCatalog().prices;
  if (citySlug) {
    const r = prices.find((x) => x.packageSlug === packageSlug && x.citySlug === citySlug);
    if (r) return minRate(r.triple, r.double, r.quad);
  }
  const all = prices.filter((r) => r.packageSlug === packageSlug);
  if (!all.length) return undefined;
  return minRate(...all.flatMap((r) => [r.triple, r.double, r.quad]));
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
  // "upcoming" means today or later — the previous default (earliest departure
  // in the catalog) let already-passed batches through as if they were next.
  const floor = from ?? new Date().toISOString().slice(0, 10);
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
