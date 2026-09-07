/**
 * Canonical URLs.
 *
 * THE BUG THIS EXISTS TO PREVENT: the root layout used to declare
 * `alternates: { canonical: "/" }`. In the App Router a page that does not set
 * its own `alternates` INHERITS the layout's — so every page that hadn't
 * thought about canonicals was telling Google "I am a duplicate of the
 * homepage, index that instead". A live crawl on 2026-09-07 found 52 of the 76
 * URLs in our own sitemap doing exactly that: /solo, /honeymoon,
 * /college-trips, /group-departures, every /from/[city], every creator page.
 * The sitemap said "index these"; the canonical said "don't". Google believes
 * the canonical, which is why pages that read perfectly well did not rank.
 *
 * So the layout no longer sets one at all, and each route declares its own.
 * The failure mode of forgetting is now "no canonical tag", which Google
 * handles by self-canonicalising — harmless. The old failure mode was silent
 * de-indexing.
 *
 * Always pass a ROOT-RELATIVE path. `metadataBase` in the root layout turns it
 * into an absolute URL, so the host lives in exactly one place.
 */

import type { Metadata } from "next";

/** `canonical("/solo")` → the `alternates` block for that page's metadata */
export function canonical(path: string): Pick<Metadata, "alternates"> {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // no trailing slash: next.config.ts redirects those, and a canonical must
  // point at the URL that actually answers 200
  return { alternates: { canonical: clean === "/" ? "/" : clean.replace(/\/+$/, "") } };
}

/**
 * Pages that must never be indexed: checkout returns, admin, the design labs.
 * robots.txt already disallows most of these, but a Disallow only stops
 * crawling — a URL someone links to can still be indexed without being read.
 * This is the instruction that actually keeps it out.
 */
export const noindex: Metadata = {
  robots: { index: false, follow: false },
};
