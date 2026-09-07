/**
 * JSON-LD builders.
 *
 * Type choice matters here and is easy to get wrong: schema.org has a
 * `TouristTrip` type that looks perfect for this business, but Google does not
 * support it for rich results — it would validate and then be ignored. The
 * supported type that carries price and availability is `Product` with a
 * nested `Offer`, so that is what a trip emits, with `BreadcrumbList`
 * alongside because breadcrumbs ARE a supported feature.
 *
 * Ratings are attached per-trip rather than to the organisation: a
 * self-declared rating on a LocalBusiness subtype is ineligible for stars,
 * while a review of a specific product is legitimate.
 */

import type { Package, Review } from "./types";

const ORIGIN = "https://tripwaley.com";

/**
 * Does this review actually describe THIS trip?
 *
 * Matching on a shared first word is not good enough: "Manali Parvati Valley"
 * and "Manali Exploration" would both be counted as reviews of "Manali
 * Summer-Snow Explore". Attaching another trip's stars to a product is a
 * review-fraud problem, so the rule is strict — one normalised name must
 * contain the other outright.
 */
export function reviewMatchesTrip(reviewTrip: string, packageName: string): boolean {
  const norm = (v: string) =>
    (v ?? "").split("·")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = norm(reviewTrip);
  const b = norm(packageName);
  if (a.length < 8 || b.length < 8) return false;
  return a.includes(b) || b.includes(a);
}

export interface TripSchemaInput {
  pkg: Package;
  /** cheapest seat across all boarding cities, in INR */
  fromPrice?: number;
  /** dearest seat, so the offer can express a range honestly */
  toPrice?: number;
  images: string[];
  /** ISO date of the last departure we are still selling */
  validThrough?: string;
  /** true when at least one future departure exists */
  inStock: boolean;
  reviews?: Review[];
}

export function tripJsonLd({
  pkg,
  fromPrice,
  toPrice,
  images,
  validThrough,
  inStock,
  reviews = [],
}: TripSchemaInput): Record<string, unknown> {
  const url = `${ORIGIN}/trips/${pkg.slug}`;
  const abs = (u: string) => (u.startsWith("http") ? u : `${ORIGIN}${u}`);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url,
    priceCurrency: "INR",
    availability: inStock ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    ...(validThrough ? { priceValidUntil: validThrough } : {}),
  };

  // A single price is cleaner for Google than a range; only fall back to
  // AggregateOffer when the low and high genuinely differ.
  if (fromPrice != null && toPrice != null && toPrice > fromPrice) {
    offer["@type"] = "AggregateOffer";
    offer.lowPrice = fromPrice;
    offer.highPrice = toPrice;
    offer.offerCount = 1;
  } else if (fromPrice != null) {
    offer.price = fromPrice;
  }

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: pkg.name,
    description:
      pkg.summaryFromDelhi?.trim() ||
      `${pkg.name}: ${pkg.destination || pkg.route}. Fixed-date group departure with stays, transport and a trip captain included.`,
    url,
    image: images.filter(Boolean).slice(0, 6).map(abs),
    brand: { "@type": "Brand", name: "Tripwaley" },
    category: "Travel > Group tours",
    ...(fromPrice != null ? { offers: offer } : {}),
  };

  // Only claim a rating when real review rows back it — a hardcoded one is
  // both ineligible and an advertising-claim problem.
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);
  if (rated.length >= 3) {
    const avg = rated.reduce((n, r) => n + r.rating, 0) / rated.length;
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: rated.length,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return node;
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${ORIGIN}${t.path}`,
    })),
  };
}

/** one <script> payload for however many nodes a page needs */
export const jsonLdScript = (nodes: Record<string, unknown>[]): string =>
  JSON.stringify(nodes.length === 1 ? nodes[0] : nodes);

/* ------------------------------------------------------------------------
   Everything below covers the pages structured data never reached: breadcrumbs
   stopped at /trips/[slug], and stories, creators and the category listings
   emitted nothing but the site-wide TravelAgency. All of it is built from data
   the templates already hold, so none of it needs new content — only markup.

   One rule throughout: never describe something the page does not show. Markup
   that disagrees with the visible page is a manual-action risk, not a shortcut.
   ------------------------------------------------------------------------ */

const absUrl = (path: string) => (path.startsWith("http") ? path : `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`);

/** drop empty members — validators reject an explicit null where we'd rather omit */
function omitEmpty<T extends Record<string, unknown>>(o: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
    out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

export function articleJsonLd(p: {
  title: string;
  description?: string;
  slug: string;
  image?: string;
  published?: string;
  author?: string;
}): Record<string, unknown> {
  return omitEmpty({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title.slice(0, 110), // Google ignores headlines past ~110 chars
    description: p.description,
    image: p.image ? [absUrl(p.image)] : undefined,
    datePublished: p.published,
    dateModified: p.published,
    author: { "@type": p.author ? "Person" : "Organization", name: p.author || "Tripwaley" },
    publisher: { "@type": "Organization", name: "Tripwaley", url: ORIGIN },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${ORIGIN}/stories/${p.slug}` },
  });
}

/**
 * Only ever call this with Q&As the page actually RENDERS — the creator pages
 * show their `qa` list, which is what makes them eligible for FAQ results.
 */
export function faqJsonLd(qa: { q: string; a: string }[]): Record<string, unknown> | null {
  const items = (qa ?? []).filter((x) => x?.q?.trim() && x?.a?.trim());
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((x) => ({
      "@type": "Question",
      name: x.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: x.a.trim() },
    })),
  };
}

export function personJsonLd(c: {
  name: string;
  slug: string;
  bio?: string;
  portrait?: string;
  niche?: string;
  socials?: { url?: string }[];
}): Record<string, unknown> {
  return omitEmpty({
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.name,
    url: `${ORIGIN}/travel-with/${c.slug}`,
    image: c.portrait ? absUrl(c.portrait) : undefined,
    description: c.bio?.split("\n")[0]?.slice(0, 300),
    jobTitle: c.niche ? `Travel creator — ${c.niche}` : undefined,
    worksFor: { "@type": "Organization", name: "Tripwaley", url: ORIGIN },
    sameAs: (c.socials ?? []).map((s) => s?.url).filter((u): u is string => Boolean(u?.startsWith("http"))),
  });
}

/** a listing page's trips, in the order the page shows them */
export function itemListJsonLd(name: string, items: { name: string; path: string }[]): Record<string, unknown> | null {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${ORIGIN}${it.path}`,
    })),
  };
}
