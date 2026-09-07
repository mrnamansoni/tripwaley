/**
 * Catalog repository — SERVER ONLY data gateway.
 * Reads the runtime store (./data), which the admin panel writes to.
 * Client components import types/formatters from lib/types instead.
 */

import { cache } from "react";
import { readCatalog as readCatalogRaw, readReviews as readReviewsRaw } from "./store";

/* One disk stat per request, not per read.
 *
 * store.ts memoises the parsed catalog by mtime, but the freshness check runs
 * a synchronous fs.statSync on EVERY read — and a single page render fans out
 * to hundreds of catalog reads, each one blocking the event loop. React's
 * cache() is request-scoped, so the stat happens once per request and every
 * later read in that render reuses the result.
 *
 * Freshness is unaffected: the catalog cannot change midway through rendering
 * one page, and the next request stats again — so an admin save is still live
 * on the very next request, which is the property the whole design rests on. */
const readCatalog = cache(readCatalogRaw);
const readReviews = cache(readReviewsRaw);
import type { BlogPost, Captain, City, CollegeTrip, Coupon, Creator, CreatorPose, CreatorTrip, CreatorTripDate, Departure, Faq, Package, PriceRule, Review, Settings, TripCategory, VideoTestimonial, WireEntry } from "./types";
import { DEFAULT_CAPTAINS, DEFAULT_HOLD_PERCENT, DEFAULT_GST_PERCENT, normalizeCaptain, normalizeCollegeTrip, normalizeCouponCode, resolveSlot as resolveSlotPure, resolveContent as resolveContentPure, resolvePageSection, minRate, inCategory, normalizeCreator, packageImages, resolveFigure, DEFAULT_FAQS, DEFAULT_VIDEO_TESTIMONIAL } from "./types";
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

/** The three percentages the booking ladder runs on, resolved to real numbers.
 *  holdPercent/gstPercent are optional on Settings so a catalog written before
 *  payments existed still type-checks — this is the one place that decides what
 *  they mean when absent, so no caller has to remember a fallback. */
export const holdRates = (): { holdPercent: number; gstPercent: number; advancePercent: number } => {
  const s = getSettings();
  return {
    holdPercent: s.holdPercent ?? DEFAULT_HOLD_PERCENT,
    gstPercent: s.gstPercent ?? DEFAULT_GST_PERCENT,
    advancePercent: s.advancePercent,
  };
};

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
/** live trips that belong on a given landing page (group / honeymoon / solo) */
/**
 * The slug that replaced an old one, or undefined if this isn't a renamed slug.
 * Used by /trips/[slug] to 301 an old URL instead of 404ing it — a rename in
 * the admin used to silently throw away that address's ranking and any links
 * pointing at it.
 */
export const resolveSlugAlias = (slug: string): string | undefined => {
  const to = readCatalog().slugAliases?.[slug];
  // never redirect to a package that no longer exists, or to itself
  if (!to || to === slug) return undefined;
  return readCatalog().packages.some((p) => p.slug === to && p.status === "live") ? to : undefined;
};

export const getPackagesByCategory = (cat: TripCategory): Package[] =>
  getLivePackages().filter((p) => inCategory(p, cat));
export const getRichPackages = (): Package[] => getLivePackages().filter((p) => p.rich || p.itinerary.length > 0);
export const getPackage = (slug: string): Package | undefined => {
  const p = readCatalog().packages.find((x) => x.slug === slug);
  return p ? normalizePackage(p) : undefined;
};

export const getReviews = (): Review[] => readReviews();

/* ------------------------------------------------ creators */

export const getCreators = (): Creator[] =>
  (readCatalog().creators ?? []).filter((c) => c.published).map(normalizeCreator);
export const getAllCreators = (): Creator[] => (readCatalog().creators ?? []).map(normalizeCreator);
export const getCreator = (slug: string): Creator | undefined =>
  getCreators().find((c) => c.slug === slug);


/* ------------------------------------------------ captains */

/** Published captains, newest edits first. Falls back to the shipped defaults
 *  only when the catalog has no captains at all, so a fresh install still
 *  renders a populated band. */
export const getCaptains = (): Captain[] => {
  const rows = (readCatalog().captains ?? []).map(normalizeCaptain).filter((c) => c.published);
  return rows.length ? rows : DEFAULT_CAPTAINS;
};
export const getAllCaptains = (): Captain[] =>
  (readCatalog().captains ?? DEFAULT_CAPTAINS).map(normalizeCaptain);

/* ------------------------------------------------ college trips */

export const getCollegeTrips = (): CollegeTrip[] =>
  (readCatalog().colleges ?? []).filter((c) => c.published).map(normalizeCollegeTrip);
export const getAllCollegeTrips = (): CollegeTrip[] =>
  (readCatalog().colleges ?? []).map(normalizeCollegeTrip);

/** headline counters for the college page, derived from real batches */
export function collegeStats() {
  const runs = getCollegeTrips();
  return {
    batches: runs.length,
    students: runs.reduce((n, r) => n + (r.students || 0), 0),
    colleges: new Set(runs.map((r) => r.college.trim().toLowerCase()).filter(Boolean)).size,
    destinations: new Set(runs.map((r) => r.destination.trim().toLowerCase()).filter(Boolean)).size,
  };
}

/* ------------------------------------------------ coupons

   SERVER ONLY on purpose: the list of live codes (and their limits) is not
   something the public bundle should carry. The site validates a typed code
   through /api/coupon, which returns only the outcome for that one code. */

export const getCoupons = (): Coupon[] => readCatalog().coupons ?? [];

export const findCoupon = (code: string): Coupon | undefined => {
  const want = normalizeCouponCode(code);
  if (!want) return undefined;
  return getCoupons().find((c) => normalizeCouponCode(c.code) === want);
};

/**
 * A creator trip with every field resolved: the creator's overrides win,
 * otherwise it inherits the underlying package. Pages render this, so they
 * never have to know which half a value came from.
 */
export interface CreatorTripView {
  creator: Creator;
  trip: CreatorTrip;
  package: Package;
  headline: string;
  itinerary: Package["itinerary"];
  inclusions: string[];
  exclusions: string[];
  gallery: string[];
  heroMedia: string;
  price?: number;
  /** future dates only, soonest first */
  dates: CreatorTripDate[];
  nextDate?: CreatorTripDate;
  seatsLeft: number;
  /** creator figure per placement, trip override winning over the creator's */
  figure: (pose: CreatorPose) => string;
}

function resolveTrip(creator: Creator, trip: CreatorTrip, floor: string): CreatorTripView | null {
  const pkg = getPackage(trip.packageSlug);
  if (!pkg || pkg.status !== "live") return null;
  const dates = trip.dates.filter((d) => d.date >= floor).sort((a, b) => a.date.localeCompare(b.date));
  const pick = <T,>(a: T[] | undefined, b: T[]): T[] => (a && a.length ? a : b);
  return {
    creator,
    trip,
    package: pkg,
    headline: trip.headline?.trim() || pkg.name,
    itinerary: pick(trip.itinerary, pkg.itinerary),
    inclusions: pick(trip.inclusions, pkg.inclusions),
    exclusions: pick(trip.exclusions, pkg.exclusions),
    gallery: pick(trip.gallery, packageImages(pkg)),
    heroMedia: trip.heroMedia || pkg.heroMedia || packageImages(pkg)[0],
    price: trip.price ?? fromPrice(pkg.slug),
    dates,
    nextDate: dates[0],
    seatsLeft: dates.reduce((n, d) => n + d.seatsLeft, 0),
    figure: (pose) => resolveFigure(creator, pose, trip),
  };
}

/** every live trip a creator runs (or all creators when no slug given) */
export function creatorTrips(opts: { creatorSlug?: string; from?: string; includeEmpty?: boolean } = {}): CreatorTripView[] {
  const floor = opts.from ?? new Date().toISOString().slice(0, 10);
  const out: CreatorTripView[] = [];
  for (const creator of getCreators()) {
    if (opts.creatorSlug && creator.slug !== opts.creatorSlug) continue;
    for (const trip of creator.trips) {
      if (!trip.published) continue;
      const view = resolveTrip(creator, trip, floor);
      if (!view) continue;
      // a trip whose dates have all passed drops off the site by itself
      if (!opts.includeEmpty && view.dates.length === 0) continue;
      out.push(view);
    }
  }
  return out.sort((a, b) => (a.nextDate?.date ?? "9999").localeCompare(b.nextDate?.date ?? "9999"));
}

export const creatorTrip = (creatorSlug: string, packageSlug: string): CreatorTripView | undefined =>
  creatorTrips({ creatorSlug, includeEmpty: true }).find((t) => t.package.slug === packageSlug);

/** flattened one-row-per-date view, for the tour calendar */
export interface CreatorDateView {
  creator: Creator;
  date: CreatorTripDate;
  view: CreatorTripView;
}
export function creatorDates(opts: { creatorSlug?: string; from?: string } = {}): CreatorDateView[] {
  return creatorTrips(opts)
    .flatMap((view) => view.dates.map((date) => ({ creator: view.creator, date, view })))
    .sort((a, b) => a.date.date.localeCompare(b.date.date));
}

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
