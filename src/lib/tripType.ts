/**
 * Server-side card builder for the three trip-type landing pages.
 * SERVER ONLY — reads through the catalog repository.
 */

import {
  fromPrice,
  getPackagesByCategory,
  getPricedCities,
  nightsLabel,
  packageImages,
  priceFor,
  upcomingDepartures,
} from "./catalog";
import type { TripCategory } from "./types";
import type { TypeCard } from "@/components/site/TripTypeGrid";

export function buildTypeCards(cat: TripCategory): TypeCard[] {
  const priced = getPricedCities();
  return getPackagesByCategory(cat).map((p) => {
    const prices: Record<string, number> = {};
    for (const c of priced) {
      // A honeymoon is sold as a couple, so the double-occupancy rate IS the
      // couple fare — showing the cheapest triple/quad rate would be wrong.
      const v = cat === "honeymoon" ? priceFor(p.slug, c.slug)?.double : fromPrice(p.slug, c.slug);
      if (v != null) prices[c.slug] = v;
    }
    const next = upcomingDepartures({ packageSlug: p.slug, limit: 1 })[0];
    return {
      slug: p.slug,
      name: p.name,
      destination: p.destination || p.route,
      nightsLabel: nightsLabel(p),
      media: p.heroMedia || packageImages(p)[0],
      prices,
      nextDate: next?.date,
    };
  });
}

/** headline counters for a category hero */
export function categoryStats(cat: TripCategory) {
  const pkgs = getPackagesByCategory(cat);
  const slugs = new Set(pkgs.map((p) => p.slug));
  const deps = upcomingDepartures({ limit: 400 }).filter((d) => slugs.has(d.package.slug));
  const cities = new Set(deps.flatMap((d) => d.cities.map((c) => c.slug)));
  return { trips: pkgs.length, departures: deps.length, cities: cities.size };
}
