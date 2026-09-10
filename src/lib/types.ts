/**
 * Shared types + pure formatters — safe to import from BOTH server and
 * client components (no fs, no node APIs). The server-only data access
 * lives in lib/catalog.ts / lib/store.ts.
 */

import { localDrivePath } from "./localDriveImages";

export interface AnnouncementBar {
  enabled: boolean;
  text: string;
  href: string; // "" = no link
  emoji: string; // "" = none
}
export interface LeadPopup {
  enabled: boolean;
  delaySeconds: number;
  title: string;
  subtitle: string;
  incentive: string; // e.g. "₹500 off your first batch"
  cta: string;
  image: string; // side image — editable photo
}
export interface Seo {
  title: string;
  description: string;
  ogImage: string;
}
export interface Socials {
  instagram: string;
  youtube: string;
  facebook: string;
}
export interface VideoTestimonial {
  enabled: boolean;
  videoUrl: string; // "" = poster runs as a silent Ken-Burns cut
  poster: string; // frame shown before/behind the video
  quote: string;
  name: string;
  trip: string; // e.g. "Spiti Valley · June batch"
  location: string; // e.g. "Bengaluru"
}
export const DEFAULT_VIDEO_TESTIMONIAL: VideoTestimonial = {
  enabled: true,
  videoUrl: "",
  poster: "/images/group-mountains.jpg",
  quote: "I booked a seat, not a friend group. Six days later I had fourteen. That's the part no itinerary can promise you.",
  name: "Ananya Sharma",
  trip: "Spiti Valley · June batch",
  location: "Bengaluru",
};
export interface Settings {
  brand: string;
  whatsapp: string;
  whatsappLink: string;
  defaultCity: string;
  /** the advance that CONFIRMS a booking, as a % of the trip total. Collected
   *  by the team offline, roughly a week before departure. */
  advancePercent: number;
  /** what the website charges to HOLD a seat, as a % of the trip total. This is
   *  stage one of three and the only stage collected online; it counts toward
   *  advancePercent rather than adding to it. Optional for back-compat with a
   *  catalog written before payments existed — read it through holdRates(). */
  holdPercent?: number;
  /** GST charged on the HOLD FEE itself, not on the trip total. 0 turns it off
   *  (set it to 0 if displayed trip prices are already GST-inclusive). */
  gstPercent?: number;
  refundPolicy: string;
  instagram: string;
  announcement: string;
  /* ---- expanded (all optional for back-compat) ---- */
  email?: string;
  address?: string;
  n8nWebhook?: string;
  announcementBar?: AnnouncementBar;
  leadPopup?: LeadPopup;
  seo?: Seo;
  socials?: Socials;
  videoTestimonial?: VideoTestimonial;
  /** GA4 measurement ID, e.g. G-XXXXXXXXXX. Empty = analytics off. */
  gaId?: string;
  /** Meta Pixel / dataset ID. Empty = pixel off. */
  metaPixelId?: string;
  /* ---- legal identity: shown on the policy pages a payment gateway reviews.
     Kept separate from `brand` because the registered entity is often not the
     trading name, and a gateway checks the registered one. ---- */
  /** registered entity, e.g. "Tripwaley Travels Pvt Ltd" */
  legalName?: string;
  /** GSTIN, printed on the policy pages when set */
  gstin?: string;
  /** legal form, e.g. "a sole proprietorship registered as an MSME". Printed
   *  in clause 1 of the policies — a gateway matches this against your KYC,
   *  and the wrong form (e.g. claiming to be a company) is a rejection. */
  entityType?: string;
  /** Udyam / MSME registration number, printed when set */
  udyam?: string;
  /** grievance/support contact hours, e.g. "Mon–Sat, 10am–7pm IST" */
  supportHours?: string;
  /** Grievance Officer — MANDATORY under Rule 5(9) of the IT (Reasonable
   *  Security Practices and Procedures and Sensitive Personal Data or
   *  Information) Rules, 2011, and the first thing a payment gateway looks
   *  for on a privacy policy. Name, designation and a reachable channel must
   *  all be published. */
  grievance?: GrievanceOfficer;
}

export interface GrievanceOfficer {
  name: string;
  designation: string;
  email: string;
  phone: string;
  /** e.g. "Monday - Friday (9:00 - 18:00 IST)" */
  hours: string;
}

/* The booking ladder's defaults, used when a catalog predates payments.
   5% + 5% GST holds the seat online; 20% (inclusive of that 5%) confirms it. */
export const DEFAULT_HOLD_PERCENT = 5;
export const DEFAULT_GST_PERCENT = 5;

export const DEFAULT_GRIEVANCE: GrievanceOfficer = {
  name: "",
  designation: "Grievance Officer",
  email: "",
  phone: "",
  hours: "Monday - Friday (9:00 - 18:00 IST)",
};
export interface City {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  priced: boolean;
}
export type Meal = "breakfast" | "lunch" | "dinner";

export interface ItineraryDay {
  day: number;
  title: string;
  body: string;
  image?: string;
  /** which meals this day covers — rendered as chips so the answer to
   *  "is dinner included on day 3" is scannable instead of buried in prose */
  meals?: Meal[];
  /** does the night's stay come with the package? */
  stay?: boolean;
}

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
export interface Faq { q: string; a: string }
/** The live-site FAQ fallback (used when catalog.faqs is unset). Defined here
 *  in the client-safe module so the admin FAQ editor seeds from the exact same
 *  list the site renders — no divergent hardcoded copy. */
export const DEFAULT_FAQS: Faq[] = [
  { q: "Are these trips solo-friendly?", a: "Completely. Most of our travellers join solo — you're placed in a small batch with a certified trip captain, and by day two it feels like a friend group." },
  { q: "What does the price include?", a: "Stays, most meals, all transport from the boarding city, permits, and your trip captain. The exact inclusions are listed on every trip page — no hidden costs." },
  { q: "How do I hold a seat?", a: "Tap 'Hold a seat', drop your number, and we block it free for 24 hours while you decide. No payment needed to hold." },
  { q: "What's the cancellation policy?", a: "Free cancellation until 7 days before departure. Closer to the date, partial refunds apply — the full policy is shared before you pay." },
];
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  body: string; // paragraphs separated by blank lines
  author: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
  published: boolean;
}
export interface Addon { name: string; price: number | null; priceMax: number | null }
export interface Package {
  code: string;
  slug: string;
  name: string;
  destination: string;
  summaryFromDelhi: string;
  type: string;
  departureHubs: string;
  transport: string;
  route: string;
  inclusions: string[];
  exclusions: string[];
  addons: Addon[];
  itinerary: ItineraryDay[];
  nights: number;
  bestTime: string;
  trekOptions: string[];
  travelTips: string[];
  thingsToCarry: string[];
  socialProof: string;
  scarcityNote: string;
  cityDetails: Record<string, string>;
  status: "live" | "draft";
  rich: boolean;
  hasDepartures: boolean;
  /** admin-curated gallery; falls back to keyword rules when empty */
  images?: string[];
  /** which landing pages this trip appears on — unset behaves as ["group"] */
  categories?: TripCategory[];
  /** Google Drive (or any) link to the printable itinerary PDF */
  itineraryPdf?: string;
  /** hero override — image OR video, upload or pasted link. Falls to images[0] */
  heroMedia?: string;
  /** can this trip be PAID for online? Unset means yes, so every package that
   *  existed before the toggle keeps taking payments. When false the site shows
   *  the seat-hold flow only — lead + WhatsApp + webhook — and /api/pay/create
   *  refuses the order, because a client-only toggle would be decorative. */
  bookingEnabled?: boolean;
  /* ---- weather: the trip page shows live conditions at the destination.
     Coordinates were a hardcoded regex table keyed on the trip name, so any
     package it failed to match showed nothing — 9 of 22 live trips. These
     override the table, so a new package is self-service. ---- */
  lat?: number;
  lng?: number;
  /** label under the temperature, e.g. "Srinagar". Defaults to `destination`. */
  weatherPlace?: string;
}
export interface PriceRule { packageSlug: string; citySlug: string; triple?: number; double?: number; quad?: number }
export interface Departure { date: string; packageSlug: string; citySlugs: string[] }
export interface Review {
  source: "google" | "instagram";
  rating: number;
  name: string;
  city: string;
  trip: string;
  text: string;
}
export interface Booking {
  id: string;
  ts: string;
  name: string;
  phone: string;
  package: string;
  city: string;
  date: string;
  occupancy: string;
  price: number | null;
  /** the control that produced the lead — booking-bar, hold-modal, … */
  source: string;
  /* ---- attribution (optional for back-compat with rows written earlier) ----
     "source" alone could not answer "which page did this come from" or "which
     creator sent it", which is what the CRM actually needs to credit a lead. */
  /** the path the visitor was on, e.g. /travel-with/rashi/spiti-solo-circuit */
  sourcePage?: string;
  /** creator slug when the lead came through a creator page */
  creator?: string;
  /** how many travellers the lead is for */
  pax?: number;
  /** the booking modal requires this now; older rows predate it */
  email?: string;
}
/** one entry on the live-booking wire band (admin-curated, no real PII) */
export interface WireEntry {
  name: string;
  city: string;
  act: string; // e.g. "held a seat on" / "just booked"
  trip: string; // e.g. "Spiti · 19 Jul"
}

export interface Catalog {
  /** Seed rows the admin has deleted. The seed merge must never re-add these —
   *  see lib/seedGuard.ts. Keys are per-section; the shape is SeedRemovals. */
  /* Old package slugs, mapped to the slug that replaced them.
     A rename in the admin cascades through prices, departures and creator
     trips (see slugCascade.ts) but the OLD URL simply started 404ing — losing
     whatever ranking and inbound links that address had earned, which is
     exactly what makes owners frightened of fixing a typo in a slug. Recorded
     here so /trips/[slug] can 301 instead. */
  slugAliases?: Record<string, string>;
  seedRemovals?: {
    cities?: string[];
    packages?: string[];
    prices?: string[];
    departures?: string[];
    colleges?: string[];
    coupons?: string[];
    creators?: string[];
  };
  settings: Settings;
  cities: City[];
  packages: Package[];
  prices: PriceRule[];
  departures: Departure[];
  /** named image slots — which photo appears where. Keyed by SlotDef.key. */
  media?: Record<string, string[]>;
  /** editable section copy, keyed by ContentDef.key. */
  content?: Record<string, string>;
  /** global FAQ (about page + footer). */
  faqs?: Faq[];
  /** blog / stories. */
  posts?: BlogPost[];
  /** per-page section on/off switches, keyed [page][sectionKey] (admin Pages tab) */
  pageSections?: Record<string, Record<string, boolean>>;
  /** live-booking wire entries (admin-curated) */
  wire?: WireEntry[];
  /** creator collabs (Travel with a Creator pages) */
  creators?: Creator[];
  /** college batches already run — the proof wall on /college-trips */
  colleges?: CollegeTrip[];
  /** trip captains (About, Vibe Check, and the trip-page feed) */
  captains?: Captain[];
  /** discount codes applied at booking (admin Coupons tab) */
  coupons?: Coupon[];
  /** highest seed batch already merged in — see mergeSeedContent() in store.ts */
  seedVersion?: number;
}

/* ------------------------------------------------ media references

   Anywhere the site shows a photo it accepts a "media ref": either a file
   uploaded to the VPS (/images/… or /uploads/…) or a pasted external link.
   Either one may be a video instead of a photo — <SiteMedia> picks the right
   element. Refs are plain strings, so every existing slot/gallery value keeps
   working untouched. */

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)(\?|#|$)/i;

/** absolute http(s) link (pasted) rather than a file on our own server */
export const isExternalMedia = (src: string): boolean => /^https?:\/\//i.test(src.trim());
/** a file we host ourselves under /public */
export const isLocalMedia = (src: string): boolean => /^\/(images|uploads)\//i.test(src.trim());

/** Should this ref render as <video> rather than <img>?
 *  Extension-driven, and Drive/Dropbox video links are normalised first. */
export function isVideoMedia(src: string): boolean {
  const s = normalizeMediaUrl(src);
  if (VIDEO_EXT.test(s)) return true;
  // a normalised Drive link keeps its original extension in the id-less form,
  // so fall back to the raw string too
  return VIDEO_EXT.test(src.trim());
}
export const isImageMedia = (src: string): boolean => !!src && !isVideoMedia(src);

/** pull the file id out of any Google Drive share URL shape */
function driveId(url: string): string | null {
  const u = url.trim();
  /* lh3.googleusercontent.com is included because normalizeMediaUrl() has been
     rewriting share links into that form for a long time, so the catalog now
     holds both shapes. Recognising only drive.google.com would have left every
     already-normalised URL pointing at Google. */
  if (!/drive\.google\.com|docs\.google\.com|lh3\.googleusercontent\.com/i.test(u)) return null;
  const m =
    u.match(/\/file\/d\/([\w-]{10,})/) ??
    u.match(/[?&]id=([\w-]{10,})/) ??
    u.match(/\/d\/([\w-]{10,})/);
  return m ? m[1] : null;
}

/** A pasted share link is a *preview page*, not a file. Rewrite the ones we
 *  can into something an <img>/<video> can actually load. Anything else is
 *  passed straight through. */
export function normalizeMediaUrl(raw: string): string {
  const src = (raw ?? "").trim();
  if (!src) return "";
  const id = driveId(src);
  if (id) {
    /* If we have pulled this file onto our own domain, serve that copy. A
       third-party URL cannot go through next/image, so a Drive-hosted photo
       arrives at full original resolution with no resize and no AVIF: eight of
       them made up 2,843KB of the homepage's 2,924KB payload, one of them
       displayed at 42x304 and downloaded at 1116x1600. Cloudflare cannot help
       either, because those bytes never touch our domain.

       Checked here rather than migrated into the catalog because the catalog
       lives on the production volume and is admin-owned — this way the data
       keeps its Drive links, every render uses the local copy, and reverting is
       deleting one branch. An id we have not pulled still falls through to
       Drive exactly as before. */
    const local = localDrivePath(id);
    if (local) return local;
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  // Dropbox: ?dl=0 serves an HTML page; raw=1 serves the bytes
  if (/dropbox\.com/i.test(src)) return src.replace(/([?&])dl=0/, "$1raw=1");
  return src;
}

/** Direct-download form, for the "Download itinerary" button. */
export function fileDownloadUrl(raw: string): string {
  const src = (raw ?? "").trim();
  if (!src) return "";
  const id = driveId(src);
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  if (/dropbox\.com/i.test(src)) return src.replace(/([?&])dl=0/, "$1dl=1");
  return src;
}

/** Validation shared by the admin API and the media picker. */
export function isValidMediaRef(src: unknown): src is string {
  if (typeof src !== "string" || !src.trim()) return false;
  const s = src.trim();
  if (isLocalMedia(s)) return (IMAGE_EXT.test(s) || VIDEO_EXT.test(s)) && !s.includes("..");
  if (isExternalMedia(s)) return s.length <= 500;
  return false;
}

/* ------------------------------------------------ creators

   Creator collabs: a creator rides along on a real departure and their
   audience books the same seat. Every creator gets a promotable page of
   their own, so these records carry portfolio material (gallery, reel,
   quote, Q&A) as well as the dates they're actually on. */

export interface CreatorSocial {
  platform: "instagram" | "youtube" | "x" | "tiktok";
  handle: string;
  /** display string, e.g. "412K" — kept as text so the owner types it as-is */
  followers: string;
  url: string;
}

/* ---- where a creator figure appears -------------------------------------

   Each placement wants a different pose: a wow face for the hero, a pointing
   arm beside the itinerary, arms wide between the in/out columns. So every
   placement is its own slot rather than one cutout reused five times.

   Resolution cascade, most specific first:
     trip.figures[pose] → creator.figures[pose] → creator.cutout → portrait
   so a creator can set one figure and have it used everywhere, or a different
   one per placement, or a different one again for a single trip.

   Any slot takes a transparent PNG, an ordinary photo, or a video. */

export type CreatorPose = "hero" | "tripHero" | "itinerary" | "inout" | "perks";

export interface CreatorPoseDef {
  key: CreatorPose;
  label: string;
  hint: string;
}

export const CREATOR_POSE_DEFS: CreatorPoseDef[] = [
  { key: "hero", label: "Profile hero", hint: "The big figure on their own page — a wow / greeting pose works best" },
  { key: "tripHero", label: "Trip page hero", hint: "Fronts each individual trip page" },
  { key: "itinerary", label: "Beside the itinerary", hint: "Stands next to the day-by-day — a pointing or explaining pose" },
  { key: "inout", label: "Between what's in / out", hint: "Centre figure with both arms out, framing the two lists" },
  { key: "perks", label: "Perks band", hint: "Next to 'what you get because they're there'" },
];

export type CreatorFigures = Partial<Record<CreatorPose, string>>;

/** one departure of a creator trip */
export interface CreatorTripDate {
  date: string; // ISO yyyy-mm-dd
  seats: number;
  seatsLeft: number;
  /** one line in the creator's voice about this specific batch */
  hook?: string;
}

/**
 * A creator running ONE package — the real unit of a collab.
 *
 * A creator usually runs several different trips, each with its own dates,
 * its own price and often its own itinerary (a creator-led batch adds their
 * sessions to the days). Each one gets its own page, because that is what a
 * creator actually promotes: "come to Spiti with me", not "here is my
 * profile". Anything left unset falls back to the underlying package.
 */
export interface CreatorTrip {
  packageSlug: string;
  /** the creator's own title for this trip */
  headline?: string;
  /** why they picked this one, in their voice */
  pitch?: string;
  /** overrides the package hero on this page */
  heroMedia?: string;
  /** per-placement creator figures, overriding the creator's own for this trip */
  figures?: CreatorFigures;
  gallery?: string[];
  /** creator-led batches are often priced differently to the public batch */
  price?: number;
  /** overrides — empty/unset means "use the package's own" */
  itinerary?: ItineraryDay[];
  inclusions?: string[];
  exclusions?: string[];
  dates: CreatorTripDate[];
  published: boolean;
}

/** legacy shape — creators were once a flat list of dates */
export interface CreatorDeparture {
  packageSlug: string;
  date: string;
  seats: number;
  seatsLeft: number;
  hook?: string;
}

export interface Creator {
  slug: string;
  name: string;
  /** used for "Travel with ___" headlines */
  firstName: string;
  handle: string;
  /** short positioning label — "The Spiti Regular". Sits above the name and
   *  gives the creator an identity beyond their handle. */
  epithet?: string;
  tagline: string;
  bio: string;
  city: string;
  niche: string;
  /** which brand accent this creator's page leans on — palette stays locked */
  accent: "gold" | "brand";
  /** default figure used by any placement without its own. Transparent PNG
   *  renders bare (the poster look); a photo gets the panel treatment. */
  cutout?: string;
  /** a different figure per placement — see CREATOR_POSE_DEFS */
  figures?: CreatorFigures;
  /** ordinary photo of the creator, used when no cutout exists */
  portrait: string;
  /** object-position for `portrait`, so the face stays framed on any crop */
  focal?: string;
  /** wide backdrop behind the hero */
  cover: string;
  gallery: string[];
  reel?: string;
  socials: CreatorSocial[];
  quote: string;
  qa: { q: string; a: string }[];
  /** what you specifically get because THEY are on the bus */
  perks: string[];
  /** one entry per package they run; each becomes its own page */
  trips: CreatorTrip[];
  /** legacy flat date list — normalised into `trips` on read */
  departures?: CreatorDeparture[];
  published: boolean;
}

export const creatorSeatsLabel = (d: CreatorTripDate): string =>
  d.seatsLeft <= 0 ? "Sold out" : `${d.seatsLeft} of ${d.seats} seats left`;

/** 0..1 — how full this departure is, for the seat meter */
export const creatorFillRatio = (d: CreatorTripDate): number =>
  d.seats > 0 ? Math.min(1, Math.max(0, (d.seats - d.seatsLeft) / d.seats)) : 0;

/** The figure to use for one placement, most specific source first. */
export function resolveFigure(
  creator: Pick<Creator, "figures" | "cutout">,
  pose: CreatorPose,
  trip?: Pick<CreatorTrip, "figures">
): string {
  return (trip?.figures?.[pose] || creator.figures?.[pose] || creator.cutout || "").trim();
}

/** Fold any legacy flat `departures` list into the `trips` shape, grouping
 *  by package. Lets old records keep working without a data migration. */
export function normalizeCreator(c: Creator): Creator {
  const trips = [...(c.trips ?? [])];
  for (const d of c.departures ?? []) {
    const existing = trips.find((t) => t.packageSlug === d.packageSlug);
    const date: CreatorTripDate = { date: d.date, seats: d.seats, seatsLeft: d.seatsLeft, hook: d.hook };
    if (existing) {
      if (!existing.dates.some((x) => x.date === d.date)) existing.dates.push(date);
    } else {
      trips.push({ packageSlug: d.packageSlug, dates: [date], published: true });
    }
  }
  for (const t of trips) t.dates.sort((a, b) => a.date.localeCompare(b.date));
  return { ...c, trips, departures: undefined };
}

/* ------------------------------------------------ trip categories

   Which landing page a trip belongs to. Group departures are the historical
   default, so a package with no categories set still shows up exactly where
   it always did. */

export type TripCategory = "group" | "honeymoon" | "solo" | "college";

export interface CategoryDef {
  key: TripCategory;
  label: string;
  href: string;
  /** the price row that headlines this page's cards */
  rateLabel: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { key: "group", label: "Group departures", href: "/group-departures", rateLabel: "per seat" },
  { key: "honeymoon", label: "Honeymoon", href: "/honeymoon", rateLabel: "per couple" },
  { key: "solo", label: "Solo", href: "/solo", rateLabel: "per seat" },
  { key: "college", label: "College trips", href: "/college-trips", rateLabel: "per student" },
];

const CATEGORY_KEYS = new Set<string>(CATEGORY_DEFS.map((c) => c.key));

/** A package's categories, defaulted so legacy rows keep their old home. */
export function packageCategories(p: Pick<Package, "categories">): TripCategory[] {
  const set = (p.categories ?? []).filter((c): c is TripCategory => CATEGORY_KEYS.has(c));
  return set.length ? set : ["group"];
}
export const inCategory = (p: Pick<Package, "categories">, cat: TripCategory): boolean =>
  packageCategories(p).includes(cat);

/* ------------------------------------------------ page section registry

   Every toggleable band on /trips and /destinations. The registry is code;
   the on/off state lives in Catalog.pageSections (admin "Pages" tab).
   Missing state = the default below, so new sections ship on. */

export interface PageSectionDef {
  page: "trips" | "destinations";
  key: string;
  label: string;
  hint?: string;
  default: boolean;
}

export const PAGE_SECTION_DEFS: PageSectionDef[] = [
  { page: "trips", key: "rack", label: "Departures rack", hint: "boarding-pass stubs of the next real departures", default: true },
  { page: "trips", key: "countdown", label: "Final Boarding countdown", hint: "flip-clock to the next departure + pulsing seat map", default: true },
  { page: "trips", key: "grid", label: "Catalog grid", hint: "the filterable all-trips grid", default: true },
  { page: "trips", key: "wire", label: "Live booking wire", hint: "the ticking feed of recent bookings (entries below)", default: true },
  { page: "trips", key: "atlas", label: "Atlas table", hint: "grab-and-throw photo map of destinations", default: true },
  { page: "destinations", key: "zodiac", label: "Zodiac orbit ring", hint: "regions orbiting a spinning ring of type", default: true },
  { page: "destinations", key: "regions", label: "Region groups", hint: "the per-region package sections", default: true },
  { page: "destinations", key: "daynight", label: "Day / Night seam", hint: "draggable before-after of day vs night", default: true },
  { page: "destinations", key: "reel", label: "Video reel", hint: "also needs Settings → Video testimonial enabled", default: true },
  { page: "destinations", key: "album", label: "Album wall", hint: "three-lane parallax photo masonry", default: true },
  { page: "destinations", key: "weather", label: "Weather strip", default: true },
  { page: "destinations", key: "seasons", label: "Seasons band", default: true },
  { page: "destinations", key: "cta", label: "CTA band", default: true },
];

export function resolvePageSection(
  sections: Record<string, Record<string, boolean>> | undefined,
  page: string,
  key: string
): boolean {
  const def = PAGE_SECTION_DEFS.find((d) => d.page === page && d.key === key);
  const saved = sections?.[page]?.[key];
  return typeof saved === "boolean" ? saved : (def?.default ?? true);
}

/* ------------------------------------------------ image slot registry

   A "slot" is a named image position on the site — e.g. the hero's film
   frames, the About crew banner. The registry (labels/groups/defaults)
   is code; the assigned photos live in Catalog.media and are edited from
   the admin Media tab. Every fixed image on the site is a slot, so it can
   be swapped or (for lists) grown. Package galleries are edited in the
   Packages tab instead. */

export interface SlotDef {
  key: string;
  group: string;
  label: string;
  hint?: string;
  kind: "single" | "list";
  defaults: string[];
  max?: number;
}

export const SLOT_DEFS: SlotDef[] = [
  { key: "hero.bg", group: "Homepage · Hero", label: "Background footage", hint: "Plays behind the giant ESCAPE letters", kind: "single", defaults: ["/images/group-mountains.jpg"] },
  { key: "hero.film", group: "Homepage · Hero", label: "Film frames (the one-take scrub)", hint: "Scroll flicks through these — add up to 8", kind: "list", defaults: ["/images/himalaya-sunrise.jpg", "/images/camp-tents.jpg", "/images/stars.jpg"], max: 8 },
  { key: "hero.blinds", group: "Homepage · Hero", label: "Blinds reveal image", hint: "Revealed as the venetian blinds open", kind: "single", defaults: ["/images/himalaya-sunrise.jpg"] },
  { key: "about.crew", group: "About page", label: "Crew banner", hint: "Full-width band near the FAQs", kind: "single", defaults: ["/images/group-mountains.jpg"] },

  /* ---- decorative photo groups (every card/section photo is swappable) ---- */
  { key: "home.gallery", group: "Homepage · Photo dump", label: "Gallery photos (the arc)", hint: "The scroll-shuffle photo wall — add/remove freely", kind: "list", defaults: ["/images/ladakh.jpg", "/images/group-mountains.jpg", "/images/kashmir.jpg", "/images/tent-view.jpg", "/images/kerala.jpg", "/images/himalaya-sunrise.jpg", "/images/rajasthan.jpg", "/images/group-trek.jpg", "/images/andaman.jpg", "/images/traveller-street.jpg", "/images/spiti.jpg", "/images/houseboat.jpg", "/images/meghalaya.jpg", "/images/taj.jpg"], max: 24 },
  { key: "home.moments", group: "Homepage · Moments", label: "Moment photos", hint: "One per moment panel — order: bonfire · astro · rapids · backwaters · summit", kind: "list", defaults: ["/images/camp-tents.jpg", "/images/stars.jpg", "/images/rishikesh.jpg", "/images/backwater-canoe.jpg", "/images/snowtrek.jpg"], max: 8 },
  { key: "destinations.regions", group: "Destinations page", label: "Region tile photos", hint: "Order: Himachal · Uttarakhand · Kashmir · Rajasthan · Goa", kind: "list", defaults: ["/images/himalaya-sunrise.jpg", "/images/snowtrek.jpg", "/images/kashmir.jpg", "/images/rajasthan.jpg", "/images/andaman.jpg"], max: 8 },
  { key: "collections.cards", group: "Collections page", label: "Collection card photos", hint: "One per collection card, in order", kind: "list", defaults: ["/images/himalaya-sunrise.jpg", "/images/tent-view.jpg", "/images/rajasthan.jpg", "/images/andaman.jpg", "/images/snowtrek.jpg", "/images/stars.jpg"], max: 12 },
  { key: "destinations.album", group: "Destinations page", label: "Album wall photos", hint: "The 3-lane parallax wall — captions edited in Content", kind: "list", defaults: ["/images/tw-g-forest1.jpg", "/images/tw-snow-throw.jpg", "/images/tw-g-kasol-huts.jpg", "/images/tw-bonfire.jpg", "/images/tw-night-terrace.jpg", "/images/tw-rafting.jpg", "/images/tw-g-shivacafe1.jpg", "/images/tw-hero-huddle.jpg", "/images/tw-g-fountain.jpg"], max: 12 },
  { key: "daynight.day", group: "Destinations page", label: "Day/Night — DAY photo", hint: "Left side of the draggable seam", kind: "single", defaults: ["/images/tw-manikaran.jpg"] },
  { key: "daynight.night", group: "Destinations page", label: "Day/Night — NIGHT photo", hint: "Right side of the draggable seam", kind: "single", defaults: ["/images/tw-night-terrace.jpg"] },
  { key: "atlas.tiles", group: "Trips page", label: "Atlas table photos", hint: "The grab-and-throw map table — labels edited in Content", kind: "list", defaults: ["/images/tw-manikaran.jpg", "/images/tw-snowfield.jpg", "/images/tw-rajasthan-fort.jpg", "/images/tw-waterfall-banner.jpg", "/images/tw-bus-roof.jpg", "/images/tw-g-kasol-huts.jpg", "/images/tw-rafting.jpg", "/images/tw-snow-road.jpg", "/images/tw-manali-night.jpg", "/images/tw-g-mannat.jpg", "/images/tw-bonfire.jpg", "/images/tw-hero-deodar.jpg"], max: 16 },

  /* ---- the three trip-type landing pages (photo OR video in every slot) ---- */
  { key: "group.hero", group: "Group departures page", label: "Hero background", hint: "Photo or video behind the page title", kind: "single", defaults: ["/images/tw-hero-huddle.jpg"] },
  { key: "group.strip", group: "Group departures page", label: "Proof strip photos", hint: "The band of batch photos under the intro", kind: "list", defaults: ["/images/tw-bonfire.jpg", "/images/tw-g-boarding.jpg", "/images/tw-bus-inside.jpg", "/images/tw-snow-throw.jpg", "/images/tw-g-shivacafe1.jpg", "/images/tw-hero-deodar.jpg"], max: 12 },

  { key: "honeymoon.hero", group: "Honeymoon page", label: "Hero background", hint: "Photo or video behind the page title", kind: "single", defaults: ["/images/houseboat.jpg"] },
  // Deliberately scenery and pairs only — no batch group shots. A page selling
  // "just the two of you" cannot open with a photo of eighteen people.
  { key: "honeymoon.gallery", group: "Honeymoon page", label: "Moments gallery", hint: "Arched photo band — keep these couple/scenery shots, not group photos. Captions in Content.", kind: "list", defaults: ["/images/kashmir.jpg", "/images/backwater-canoe.jpg", "/images/andaman.jpg", "/images/tent-view.jpg", "/images/kerala.jpg", "/images/stars.jpg"], max: 12 },
  { key: "honeymoon.suite", group: "Honeymoon page", label: "Private-suite feature photo", hint: "Large feature image beside the inclusions", kind: "single", defaults: ["/images/tent-view.jpg"] },

  { key: "college.hero", group: "College page", label: "Hero background", hint: "Photo or video behind the page title", kind: "single", defaults: ["/images/tw-hero-huddle.jpg"] },
  { key: "college.gallery", group: "College page", label: "Campus gallery", hint: "The wall of previous college batches", kind: "list", defaults: ["/images/group-trek.jpg", "/images/tw-bonfire-dog.jpg", "/images/tw-g-bench.jpg", "/images/camp-tents.jpg", "/images/tw-dhaba.jpg", "/images/group-mountains.jpg"], max: 12 },
  { key: "college.safety", group: "College page", label: "Safety band photo", hint: "Beside the what-we-handle list", kind: "single", defaults: ["/images/tw-captain-1.jpg"] },
  { key: "college.quote", group: "College page", label: "Quote band photo", hint: "Behind the coordinator testimonial", kind: "single", defaults: ["/images/tw-bus-banner.jpg"] },
  { key: "solo.hero", group: "Solo page", label: "Hero background", hint: "Photo or video behind the page title", kind: "single", defaults: ["/images/traveller-street.jpg"] },
  { key: "solo.gallery", group: "Solo page", label: "Crew gallery", hint: "Strangers-to-friends photo band", kind: "list", defaults: ["/images/tw-hero-huddle.jpg", "/images/group-trek.jpg", "/images/tw-bonfire-dog.jpg", "/images/tw-g-bench.jpg", "/images/tw-dhaba.jpg", "/images/tw-g-forest2.jpg"], max: 12 },
  { key: "solo.safety", group: "Solo page", label: "Safety band photo", hint: "Beside the solo-safety promises", kind: "single", defaults: ["/images/tw-captain-1.jpg"] },
];

export function resolveSlot(media: Record<string, string[]> | undefined, key: string): string[] {
  const def = SLOT_DEFS.find((s) => s.key === key);
  const saved = media?.[key];
  if (saved && saved.length) return saved;
  return def?.defaults ?? [];
}

/* ------------------------------------------------ section-copy registry

   Editable text strings for the homepage / section headers, so the owner can
   retune messaging from the admin "Content" tab without code. Same pattern as
   SLOT_DEFS: the key/label/default are code; the override lives in
   Catalog.content. */

export interface ContentDef {
  key: string;
  group: string;
  label: string;
  kind: "line" | "multiline";
  default: string;
}

export const CONTENT_DEFS: ContentDef[] = [
  { key: "hero.eyebrow", group: "Homepage · Hero", label: "Eyebrow (top line)", kind: "line", default: "tripwaley presents · a film by you" },
  /* The H1 is the strongest on-page signal the homepage has, and it used to
     spend all of it on brand voice — "Your city. Your crew. Pick Your Shot."
     names no product, no country and no destination. The head term leads now
     and the voice follows it in gold, so the line still sounds like us. */
  { key: "hero.headline", group: "Homepage · Hero", label: "Headline", kind: "line", default: "Group trips across India." },
  { key: "hero.headlineAccent", group: "Homepage · Hero", label: "Headline accent (gold line)", kind: "line", default: "Your city. Your crew." },
  { key: "hero.scrollCue", group: "Homepage · Hero", label: "Scroll cue", kind: "line", default: "scroll — roll camera" },
  { key: "hero.markWord", group: "Homepage · Hero", label: "Giant mark — line 1 (≤7 letters)", kind: "line", default: "SCENE" },
  { key: "hero.markSub", group: "Homepage · Hero", label: "Giant mark — line 2 (≤8 letters)", kind: "line", default: "ON HAI" },

  { key: "rack.hook", group: "Homepage · Departure rack", label: "Sub-hook under heading", kind: "line", default: "Every destination's next batch — tear one off." },
  { key: "rack.footnote", group: "Homepage · Departure rack", label: "Footnote line", kind: "line", default: "every fare is your city's real seat price — not a headline teaser" },

  { key: "deck.eyebrow", group: "Homepage · The deck", label: "Eyebrow", kind: "line", default: "somewhere in here is your next trip" },

  { key: "gallery.eyebrow", group: "Homepage · Photo dump", label: "Eyebrow (script)", kind: "line", default: "the photo dump ✦" },
  { key: "gallery.headline", group: "Homepage · Photo dump", label: "Headline", kind: "line", default: "Straight from the batch camera rolls." },
  { key: "gallery.sub", group: "Homepage · Photo dump", label: "Sub-line", kind: "multiline", default: "Zero stock photos in the reviews below — keep scrolling to shuffle through what our travellers actually shot." },

  { key: "drum.eyebrow", group: "Homepage · Reviews drum", label: "Eyebrow", kind: "line", default: "straight from google & instagram · nothing paid, nothing scripted" },
  { key: "drum.headline", group: "Homepage · Reviews drum", label: "Headline", kind: "line", default: "12,000 wanderers." },
  { key: "drum.headlineAccent", group: "Homepage · Reviews drum", label: "Headline accent (gold)", kind: "line", default: "Zero scripts." },

  { key: "footer.eyebrow", group: "Homepage · Footer curtain", label: "Curtain eyebrow", kind: "line", default: "the end of the page" },
  { key: "footer.headline", group: "Homepage · Footer curtain", label: "Curtain headline", kind: "line", default: "…not of the map." },
  { key: "footer.sub", group: "Homepage · Footer curtain", label: "Curtain sub-line", kind: "multiline", default: "Somewhere a batch is boarding without you — Spiti at first light, Kashmir in bloom, Meghalaya after the rain. All still unstamped in your passport." },
  { key: "footer.cue", group: "Homepage · Footer curtain", label: "Curtain cue", kind: "line", default: "keep pulling ↓" },

  /* ---- /trips page bands ---- */
  { key: "trips.countdown.headline", group: "Trips page", label: "Countdown headline", kind: "line", default: "Seats melt." },
  { key: "trips.countdown.accent", group: "Trips page", label: "Countdown accent (gold line)", kind: "line", default: "Clock's honest." },
  { key: "trips.countdown.sub", group: "Trips page", label: "Countdown sub-line", kind: "multiline", default: "This is the real clock to the next batch leaving your city. When it hits zero, the bus leaves — with or without your name on a seat." },
  { key: "trips.wire.headline", group: "Trips page", label: "Wire headline", kind: "line", default: "Somebody books" },
  { key: "trips.wire.accent", group: "Trips page", label: "Wire accent (red line)", kind: "line", default: "every few minutes." },
  { key: "trips.wire.sub", group: "Trips page", label: "Wire sub-line", kind: "multiline", default: "The booking wire, slightly delayed so nobody's boss sees them planning." },
  { key: "trips.atlas.headline", group: "Trips page", label: "Atlas headline", kind: "line", default: "Grab the map." },
  { key: "trips.atlas.accent", group: "Trips page", label: "Atlas accent (red word)", kind: "line", default: "Throw it." },
  { key: "trips.atlas.sub", group: "Trips page", label: "Atlas sub-line", kind: "multiline", default: "Drag anywhere — momentum does the rest. Every region on one table." },
  { key: "trips.atlas.labels", group: "Trips page", label: "Atlas tile labels (one per line, in photo order)", kind: "multiline", default: "Manikaran · N 32°\nKedarkantha · N 31°\nRajasthan · N 26°\nJibhi · N 31°\nManali · N 32°\nKasol · N 32°\nBeas rapids · N 32°\nRohtang · N 32°\nMall Road · N 32°\nMannat gate · N 31°\nBonfire camp · N 31°\nDeodar forest · N 32°" },

  /* ---- /destinations page bands ---- */
  { key: "dest.zodiac.headline", group: "Destinations page", label: "Zodiac headline", kind: "line", default: "Wherever it stops," },
  { key: "dest.zodiac.accent", group: "Destinations page", label: "Zodiac accent (red line)", kind: "line", default: "you win." },
  { key: "dest.zodiac.sub", group: "Destinations page", label: "Zodiac sub-line", kind: "multiline", default: "Every region in constant orbit. Tap one to hold the sky still — it'll take you straight to its batches." },
  { key: "dest.zodiac.ringText", group: "Destinations page", label: "Zodiac ring text (circular type)", kind: "line", default: "TRIPWALEY · 14 STATES · 350 DEPARTURES · ONE CREW ·" },
  { key: "dest.daynight.headline", group: "Destinations page", label: "Day/Night headline", kind: "line", default: "Day job." },
  { key: "dest.daynight.accent", group: "Destinations page", label: "Day/Night accent (gold)", kind: "line", default: "Night shift." },
  { key: "dest.daynight.sub", group: "Destinations page", label: "Day/Night sub-line", kind: "multiline", default: "Same itinerary, two personalities. Temple queues till six, terrace lights after." },
  { key: "dest.daynight.dayLabel", group: "Destinations page", label: "Day/Night — day chip", kind: "line", default: "06:00 · manikaran" },
  { key: "dest.daynight.nightLabel", group: "Destinations page", label: "Day/Night — night chip", kind: "line", default: "23:00 · valley lights" },
  { key: "dest.album.eyebrow", group: "Destinations page", label: "Album eyebrow", kind: "line", default: "shot on 14 different phones" },
  { key: "dest.album.headline", group: "Destinations page", label: "Album headline", kind: "line", default: "Proof it" },
  { key: "dest.album.accent", group: "Destinations page", label: "Album accent (gold word)", kind: "line", default: "happened." },
  { key: "dest.album.sub", group: "Destinations page", label: "Album sub-line", kind: "multiline", default: "Unstaged, uncropped, occasionally out of focus — exactly how memory works." },
  { key: "dest.album.captions", group: "Destinations page", label: "Album captions (one per line, in photo order)", kind: "multiline", default: "deodar cathedral, entry free\nsnow fight: everyone lost\nkasol huts, population us\nbonfire committee in session\nvalley lights, no filter\narms tired. worth it.\nshiva cafe sunlight\nhuddle up, day six\nfountain break, jaipur" },

  /* ---- Group departures page ---- */
  { key: "group.eyebrow", group: "Group departures page", label: "Eyebrow (script)", kind: "line", default: "fixed dates · guaranteed departures" },
  { key: "group.headline", group: "Group departures page", label: "Headline", kind: "line", default: "Book a seat." },
  { key: "group.accent", group: "Group departures page", label: "Headline accent (gold)", kind: "line", default: "Leave with a crew." },
  { key: "group.sub", group: "Group departures page", label: "Sub-line", kind: "multiline", default: "Fixed departure dates, a certified trip captain, and 12–18 people who were strangers at the boarding point. Everything from your city and back is handled." },
  { key: "group.promises", group: "Group departures page", label: "Promise cards (one per line — title | detail)", kind: "multiline", default: "Guaranteed departure | The date on the ticket is the date the bus leaves. We don't cancel for low numbers.\nOne captain per batch | Certified, first-aid trained, and the reason nobody gets left at a chai stop.\nBoarding from your city | Ten pickup cities and counting — the fare you see is your city's real fare.\nNo hidden costs | Stays, transport, permits and most meals are in. What's out is written on the page." },
  { key: "group.stripEyebrow", group: "Group departures page", label: "Proof strip eyebrow", kind: "line", default: "one batch, six days, fourteen new numbers in your phone" },

  /* ---- Honeymoon page ---- */
  { key: "honeymoon.eyebrow", group: "Honeymoon page", label: "Eyebrow (script)", kind: "line", default: "just the two of you ✦" },
  { key: "honeymoon.headline", group: "Honeymoon page", label: "Headline", kind: "line", default: "The trip you'll" },
  { key: "honeymoon.accent", group: "Honeymoon page", label: "Headline accent (rose)", kind: "line", default: "keep retelling." },
  { key: "honeymoon.sub", group: "Honeymoon page", label: "Sub-line", kind: "multiline", default: "Private cars, no group, no 6 AM roll call. Handpicked stays with a view worth waking up for — and an itinerary that leaves room to do absolutely nothing." },
  { key: "honeymoon.promises", group: "Honeymoon page", label: "Promise cards (one per line — title | detail)", kind: "multiline", default: "Only ever two seats | Private cab, private stay, private everything. No co-passengers, no shared schedule.\nRooms chosen for the view | Candlelit dinner, flower-decor room on arrival, and a stay we'd book ourselves.\nPlanned around you | Late starts, longer stops, and a captain on WhatsApp who never rings the doorbell.\nOne quiet number | A single planner who knows your booking — not a call centre." },
  { key: "honeymoon.galleryEyebrow", group: "Honeymoon page", label: "Gallery eyebrow", kind: "line", default: "shot on real honeymoons" },
  { key: "honeymoon.galleryHeadline", group: "Honeymoon page", label: "Gallery headline", kind: "line", default: "Slow mornings," },
  { key: "honeymoon.galleryAccent", group: "Honeymoon page", label: "Gallery accent (rose)", kind: "line", default: "long evenings." },
  { key: "honeymoon.galleryCaptions", group: "Honeymoon page", label: "Gallery captions (one per line, in photo order)", kind: "multiline", default: "the 6 AM shikara\nnobody else on the water\nbreakfast, eventually\nthe balcony we didn't leave\ntea at altitude\nlights out, stars on" },
  { key: "honeymoon.quote", group: "Honeymoon page", label: "Love-note quote (script)", kind: "multiline", default: "We booked it three days after the wedding, and it is still the week we talk about most." },
  { key: "honeymoon.quoteBy", group: "Honeymoon page", label: "Love-note attribution", kind: "line", default: "Aarti & Rohan · Kashmir, April batch" },
  { key: "honeymoon.suiteTitle", group: "Honeymoon page", label: "Feature block title", kind: "line", default: "What's waiting in the room." },
  { key: "honeymoon.suiteList", group: "Honeymoon page", label: "Feature block list (one per line)", kind: "multiline", default: "Flower-decorated room on the night you arrive\nCandlelit dinner for two, one evening of the trip\nPrivate cab for the whole route — never a shared coach\nA welcome cake, because somebody should bake you one\nLate checkout wherever the property allows it" },

  /* ---- Solo page ---- */
  { key: "college.eyebrow", group: "College page", label: "Eyebrow (script)", kind: "line", default: "one bus ✦ forty of your people" },
  { key: "college.headline", group: "College page", label: "Headline", kind: "line", default: "The trip your batch" },
  { key: "college.accent", group: "College page", label: "Headline accent (gold)", kind: "line", default: "still talks about." },
  { key: "college.sub", group: "College page", label: "Sub-line", kind: "multiline", default: "Industrial visits, farewell trips, adventure weeks and fest getaways — planned for whole batches, priced per student, and run by captains who have taken 200+ college groups into the mountains." },
  { key: "college.promises", group: "College page", label: "Promise cards (one per line — title | detail)", kind: "multiline", default: "Priced per student | Transparent per-head pricing with the group size written into the quote. No surprise per-bus surcharges at the end.\nOne coordinator, one number | You get a single point of contact from quote to return, not a call centre. Faculty get a live location link for the whole trip.\nFree recce for 60+ groups | For larger batches we run the route first and send back photos of the exact stays your students will sleep in.\nParent-ready paperwork | Consent forms, itinerary PDFs, insurance and an emergency contact sheet — formatted for the college office, not improvised." },
  { key: "college.stepsTitle", group: "College page", label: "How-it-works title", kind: "line", default: "From group chat to boarding gate." },
  { key: "college.steps", group: "College page", label: "How it works (one per line — title | detail)", kind: "multiline", default: "Tell us the batch size | Numbers, rough dates and a budget per student. A ballpark is fine at this stage.\nWe send three routes | Costed per student at your exact group size, with the trade-offs spelled out.\nLock it with a deposit | The batch is blocked, stays are confirmed, and the paperwork pack goes to your office.\nWe run it | Captains, transport, permits and a 24/7 ops number for faculty from departure to return." },
  { key: "college.galleryEyebrow", group: "College page", label: "Gallery eyebrow", kind: "line", default: "shot on previous college batches" },
  { key: "college.galleryHeadline", group: "College page", label: "Gallery headline", kind: "line", default: "Attendance was" },
  { key: "college.galleryAccent", group: "College page", label: "Gallery accent (gold)", kind: "line", default: "unusually high." },
  { key: "college.safetyTitle", group: "College page", label: "Safety block title", kind: "line", default: "What the college office asks — answered." },
  { key: "college.safetyList", group: "College page", label: "Safety block list (one per line)", kind: "multiline", default: "Verified stays only — our team sleeps in every property before a batch does\nLive bus tracking shared with faculty and parents for the whole route\nCertified, first-aid trained captain travelling with every 20 students\nWomen-only rooms and women captains on request, on every batch\nWritten consent, insurance and emergency-contact pack sent before departure\n24×7 ops number that reaches a human, not a queue" },
  { key: "college.formTitle", group: "College page", label: "Quote form title", kind: "line", default: "Get a quote for your batch." },
  { key: "college.formSub", group: "College page", label: "Quote form sub-line", kind: "multiline", default: "Tell us the numbers and we'll come back within one working day with three costed routes. No deposit, no obligation." },
  { key: "college.markers", group: "College page", label: "Stat markers (one per line — label | value | note)", kind: "multiline", default: "students carried | 4,200+  | Across engineering, management and design campuses.\nlargest single batch | 180  | Four buses, one itinerary, zero students left behind.\ncaptain to student | 1:20  | Every twenty students travel with their own certified captain.\nrepeat colleges | 68%  | Most campuses book us again the following year." },
  { key: "solo.eyebrow", group: "Solo page", label: "Eyebrow (script)", kind: "line", default: "book for one ✦ arrive to fifteen" },
  { key: "solo.headline", group: "Solo page", label: "Headline", kind: "line", default: "Go alone." },
  { key: "solo.accent", group: "Solo page", label: "Headline accent (gold)", kind: "line", default: "Come back with a crew." },
  { key: "solo.sub", group: "Solo page", label: "Sub-line", kind: "multiline", default: "Most of our travellers book a single seat. You'll be matched into a small batch, share a room with someone your own age and gender, and pay zero single-supplement for the privilege." },
  { key: "solo.promises", group: "Solo page", label: "Promise cards (one per line — title | detail)", kind: "multiline", default: "No single supplement | Book one seat, pay one seat. We match you into a shared room — never a solo-traveller surcharge.\nMatched, not dumped | Roommates matched by age and gender before you board, so day one isn't awkward.\nWomen-first options | Women-only rooms and women captains available on request, on every batch.\nThe group chat starts early | You're in the batch WhatsApp group days before departure. Nobody arrives a stranger." },
  { key: "solo.galleryEyebrow", group: "Solo page", label: "Gallery eyebrow", kind: "line", default: "everyone here booked a single seat" },
  { key: "solo.galleryHeadline", group: "Solo page", label: "Gallery headline", kind: "line", default: "Strangers on day one." },
  { key: "solo.galleryAccent", group: "Solo page", label: "Gallery accent (gold)", kind: "line", default: "Group chat forever." },
  { key: "solo.markers", group: "Solo page", label: "Trail markers (one per line — label | value | note)", kind: "multiline", default: "highest point | 4,551 m  | Kunzum La, on the Spiti circuit. You'll feel the air thin out.\nbatch size | 12–16  | Small enough that everyone knows your name by day two.\nsolo travellers | 71%  | Most of a Tripwaley batch booked exactly one seat.\nsingle supplement | ₹0  | Shared rooms matched by age and gender. Never a surcharge." },
  { key: "solo.safetyTitle", group: "Solo page", label: "Safety block title", kind: "line", default: "Solo, not unsupervised." },
  { key: "solo.safetyList", group: "Solo page", label: "Safety block list (one per line)", kind: "multiline", default: "Verified stays only — we've slept in every one of them\nLive location shared with your emergency contact on request\nCertified, first-aid trained captain on every single batch\nWomen-only rooms and women captains, on request\n24×7 number that reaches a human, not a queue" },
];

export function resolveContent(content: Record<string, string> | undefined, key: string): string {
  const saved = content?.[key];
  if (saved != null && saved !== "") return saved;
  return CONTENT_DEFS.find((c) => c.key === key)?.default ?? "";
}

/* ------------------------------------------------ media fallback rules */

const IMAGE_RULES: [RegExp, string[]][] = [
  [/kashmir/i, ["kashmir", "houseboat", "snowtrek"]],
  [/kasol|parvati|kheerganga|tosh/i, ["camp-tents", "group-trek", "stars"]],
  [/kedarkantha|snow trek/i, ["snowtrek", "camp-tents", "group-mountains"]],
  [/chopta|tungnath|kedarnath|flower|valley of/i, ["meghalaya", "group-trek", "himalaya-sunrise"]],
  [/spiti|jispa|baralacha/i, ["spiti", "stars", "ladakh"]],
  [/udaipur|rajasthan|jodhpur|mount abu/i, ["rajasthan", "taj", "traveller-street"]],
  [/goa/i, ["andaman", "backwater-canoe", "houseboat"]],
  [/rishikesh|haridwar/i, ["rishikesh", "group-trek", "backwater-canoe"]],
  [/mcleod|triund|bir|star ?gazing/i, ["stars", "tent-view", "group-mountains"]],
  [/jibhi|tirthan|raghupur/i, ["tent-view", "group-mountains", "camp-tents"]],
  [/shimla|kufri|mashobra|himachal|manali/i, ["himalaya-sunrise", "group-mountains", "snowtrek"]],
];

export function packageImages(p: Package): string[] {
  if (p.images && p.images.length > 0) return p.images;
  const hay = `${p.name} ${p.destination} ${p.route}`;
  for (const [re, imgs] of IMAGE_RULES) {
    if (re.test(hay)) return imgs.map((i) => `/images/${i}.jpg`);
  }
  return ["/images/group-mountains.jpg", "/images/himalaya-sunrise.jpg", "/images/camp-tents.jpg"];
}


/* ------------------------------------------------ college trips

   A college trip is sold to a coordinator, not an individual, so the record
   here is the *batch we already ran* — proof for the next campus rather than
   an inventory item. Bookable college packages are ordinary Packages tagged
   with the "college" category; this is the wall of who has already gone. */

export interface CollegeTrip {
  slug: string;
  /** the institution, e.g. "IIT Roorkee" */
  college: string;
  /** campus city, shown under the name */
  city: string;
  destination: string;
  /** days on the road, same meaning as Package.nights */
  nights: number;
  /** how many students actually travelled */
  students: number;
  pricePerStudent?: number;
  /** e.g. "2025" or "Mar 2025" — free text, it's a label not a date */
  year: string;
  cover: string;
  gallery: string[];
  /** what the trip lead said afterwards */
  quote?: string;
  quoteBy?: string;
  published: boolean;
}

export function normalizeCollegeTrip(c: Partial<CollegeTrip>): CollegeTrip {
  return {
    slug: c.slug ?? "",
    college: c.college ?? "",
    city: c.city ?? "",
    destination: c.destination ?? "",
    nights: typeof c.nights === "number" ? c.nights : 0,
    students: typeof c.students === "number" ? c.students : 0,
    pricePerStudent: c.pricePerStudent,
    year: c.year ?? "",
    cover: c.cover ?? "",
    gallery: c.gallery ?? [],
    quote: c.quote,
    quoteBy: c.quoteBy,
    published: c.published ?? false,
  };
}



/* ------------------------------------------------ captains

   The people who actually run a batch. Until now these were a hardcoded array
   in PageExtras.tsx with only their photos editable through a media slot, so
   adding a fourth captain or correcting a trip count needed a deploy. */

export interface Captain {
  slug: string;
  /** first name only — the site renders "Captain {name}" */
  name: string;
  /** the terrain they own, e.g. "High Himalaya" */
  beat: string;
  /** one line of character, shown under the name */
  line: string;
  /** trips led, shown as a badge on the photo */
  trips: number;
  photo: string;
  published: boolean;
}

export function normalizeCaptain(c: Partial<Captain>): Captain {
  return {
    slug: c.slug ?? "",
    name: c.name ?? "",
    beat: c.beat ?? "",
    line: c.line ?? "",
    trips: typeof c.trips === "number" ? c.trips : 0,
    photo: c.photo ?? "",
    published: c.published ?? true,
  };
}

/** The captains the site shipped with, used to seed the editable list so an
 *  existing install looks identical the moment the tab appears. */
export const DEFAULT_CAPTAINS: Captain[] = [
  { slug: "tenzin", name: "Tenzin", trips: 147, beat: "High Himalaya", line: "Notices altitude sickness before you do.", photo: "/images/group-trek.jpg", published: true },
  { slug: "aisha", name: "Aisha", trips: 96, beat: "Himachal circuits", line: "Runs the tightest playlist democracy in the Volvo.", photo: "/images/traveller-street.jpg", published: true },
  { slug: "veer", name: "Veer", trips: 121, beat: "Treks & summits", line: "Carries a guitar to 4,000m. Uses it responsibly.", photo: "/images/camp-tents.jpg", published: true },
];

/* ------------------------------------------------ coupons

   Discount codes applied at booking. The shape is deliberately small and the
   maths lives in one pure function, because the SERVER must be the only thing
   that ever decides what a booking costs — the browser may display a discount
   but never gets to assert one. */

export interface Coupon {
  /** stored and compared uppercase; what the traveller types */
  code: string;
  kind: "percent" | "flat";
  /** percent: 1-100. flat: rupees off. */
  value: number;
  /** booking total must reach this before the code applies */
  minAmount?: number;
  /** ceiling on a percent discount, in rupees */
  maxDiscount?: number;
  /** ISO yyyy-mm-dd; the code stops working after this day ends */
  expiresAt?: string;
  /** total redemptions allowed across all customers */
  usageLimit?: number;
  usedCount?: number;
  /** empty = every trip; otherwise only these package slugs */
  packageSlugs?: string[];
  /** empty = every category; otherwise only these landing-page categories */
  categories?: TripCategory[];
  active: boolean;
  /** admin-only memo, never shown to travellers */
  note?: string;
}

export type CouponFailure =
  | "unknown" | "inactive" | "expired" | "used-up" | "min-amount" | "not-eligible";

export const COUPON_ERROR: Record<CouponFailure, string> = {
  unknown: "That code isn't recognised.",
  inactive: "That code is no longer active.",
  expired: "That code has expired.",
  "used-up": "That code has been fully claimed.",
  "min-amount": "Your booking doesn't reach this code's minimum.",
  "not-eligible": "That code doesn't apply to this trip.",
};

export interface CouponResult {
  ok: boolean;
  code: string;
  /** rupees off the total — always an integer, never negative */
  discount: number;
  /** total after the discount, floored at 0 */
  total: number;
  reason?: CouponFailure;
  label?: string;
}

/**
 * The single source of truth for what a code is worth.
 *
 * Pure and shared so the admin preview, the booking UI and the payment
 * endpoint can never disagree — but only the server's call counts. `today`
 * is injected rather than read from the clock so the result is testable and
 * so a client's wrong system date can't resurrect an expired code.
 */
export function applyCoupon(
  coupon: Coupon | undefined,
  ctx: { total: number; packageSlug?: string; categories?: TripCategory[]; today: string }
): CouponResult {
  const base = Math.max(0, Math.round(ctx.total));
  const fail = (reason: CouponFailure): CouponResult => ({
    ok: false, code: coupon?.code ?? "", discount: 0, total: base, reason,
  });

  if (!coupon) return fail("unknown");
  if (!coupon.active) return fail("inactive");
  if (coupon.expiresAt && ctx.today > coupon.expiresAt) return fail("expired");
  if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) return fail("used-up");
  if (coupon.minAmount != null && base < coupon.minAmount) return fail("min-amount");

  if (coupon.packageSlugs?.length) {
    if (!ctx.packageSlug || !coupon.packageSlugs.includes(ctx.packageSlug)) return fail("not-eligible");
  }
  if (coupon.categories?.length) {
    const cats = ctx.categories ?? [];
    if (!cats.some((c) => coupon.categories!.includes(c))) return fail("not-eligible");
  }

  let discount =
    coupon.kind === "percent"
      ? Math.round((base * Math.min(100, Math.max(0, coupon.value))) / 100)
      : Math.round(Math.max(0, coupon.value));

  if (coupon.kind === "percent" && coupon.maxDiscount != null) {
    discount = Math.min(discount, Math.round(coupon.maxDiscount));
  }
  // never pay a negative price, and never discount more than the booking
  discount = Math.min(discount, base);

  return {
    ok: true,
    code: coupon.code,
    discount,
    total: base - discount,
    label: coupon.kind === "percent" ? `${coupon.value}% off` : `${inr(coupon.value)} off`,
  };
}

export const normalizeCouponCode = (raw: string): string =>
  (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");

/* ------------------------------------------------ formatting */

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Smallest defined seat rate. Treats ₹0 as a real price (a promo/comped seat);
 *  returns undefined only when NO rate is set — never Infinity from Math.min([]).
 *  Use this instead of `[...].filter(Boolean)` on prices, which drops a real 0. */
export function minRate(...rates: (number | undefined | null)[]): number | undefined {
  const nums = rates.filter((r): r is number => typeof r === "number" && Number.isFinite(r));
  return nums.length ? Math.min(...nums) : undefined;
}
export function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
export function weekday(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });
}
export function nightsLabel(p: Package): string {
  if (p.nights > 1) return `${p.nights - 1}N / ${p.nights}D`;
  const m = p.summaryFromDelhi.match(/(\d)\s*Nights?\s*\/?\s*(\d)\s*Day/i);
  return m ? `${m[1]}N / ${m[2]}D` : "Group departure";
}
