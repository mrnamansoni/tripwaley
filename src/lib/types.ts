/**
 * Shared types + pure formatters — safe to import from BOTH server and
 * client components (no fs, no node APIs). The server-only data access
 * lives in lib/catalog.ts / lib/store.ts.
 */

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
  advancePercent: number;
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
}
export interface City {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  priced: boolean;
}
export interface ItineraryDay { day: number; title: string; body: string; image?: string }
export interface Faq { q: string; a: string }
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
  source: string;
}
export interface Catalog {
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
  { key: "captains", group: "Captains band", label: "Captain portraits", hint: "Shown on About & Vibe Check — 3 recommended", kind: "list", defaults: ["/images/group-trek.jpg", "/images/traveller-street.jpg", "/images/camp-tents.jpg"], max: 6 },

  /* ---- decorative photo groups (every card/section photo is swappable) ---- */
  { key: "home.gallery", group: "Homepage · Photo dump", label: "Gallery photos (the arc)", hint: "The scroll-shuffle photo wall — add/remove freely", kind: "list", defaults: ["/images/ladakh.jpg", "/images/group-mountains.jpg", "/images/kashmir.jpg", "/images/tent-view.jpg", "/images/kerala.jpg", "/images/himalaya-sunrise.jpg", "/images/rajasthan.jpg", "/images/group-trek.jpg", "/images/andaman.jpg", "/images/traveller-street.jpg", "/images/spiti.jpg", "/images/houseboat.jpg", "/images/meghalaya.jpg", "/images/taj.jpg"], max: 24 },
  { key: "home.moments", group: "Homepage · Moments", label: "Moment photos", hint: "One per moment panel — order: bonfire · astro · rapids · backwaters · summit", kind: "list", defaults: ["/images/camp-tents.jpg", "/images/stars.jpg", "/images/rishikesh.jpg", "/images/backwater-canoe.jpg", "/images/snowtrek.jpg"], max: 8 },
  { key: "destinations.regions", group: "Destinations page", label: "Region tile photos", hint: "Order: Himachal · Uttarakhand · Kashmir · Rajasthan · Goa", kind: "list", defaults: ["/images/himalaya-sunrise.jpg", "/images/snowtrek.jpg", "/images/kashmir.jpg", "/images/rajasthan.jpg", "/images/andaman.jpg"], max: 8 },
  { key: "collections.cards", group: "Collections page", label: "Collection card photos", hint: "One per collection card, in order", kind: "list", defaults: ["/images/himalaya-sunrise.jpg", "/images/tent-view.jpg", "/images/rajasthan.jpg", "/images/andaman.jpg", "/images/snowtrek.jpg", "/images/stars.jpg"], max: 12 },
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
  { key: "hero.headline", group: "Homepage · Hero", label: "Headline", kind: "line", default: "Your city. Your crew." },
  { key: "hero.headlineAccent", group: "Homepage · Hero", label: "Headline accent (gold line)", kind: "line", default: "Your opening shot." },
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

/* ------------------------------------------------ formatting */

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
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
