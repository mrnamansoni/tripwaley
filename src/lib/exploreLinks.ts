/* THE SITE INDEX — every indexable landing page, one click from any page.
 *
 * Search Console (19 Sept 2026) had 51 sitemap URLs Google had discovered but
 * never crawled: destination, departure-city and creator pages that were
 * reachable only from their own hub pages. Google weighs a page partly by how
 * easily it is reached, so these now appear on every page.
 *
 * Same liveness rules as sitemap.ts, so this never links to a page that 404s. */

import { DESTINATIONS, destinationsFor } from "./destinations";
import { getLivePackages, getPricedCities, getCreators } from "./catalog";

export interface ExploreGroup {
  head: string;
  links: { label: string; href: string }[];
}

export function exploreGroups(): ExploreGroup[] {
  const live = getLivePackages();
  const byName = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);

  const groups: ExploreGroup[] = [
    {
      head: "Destinations",
      links: DESTINATIONS.filter((d) => live.some((p) => destinationsFor(p).some((x) => x.slug === d.slug)))
        .map((d) => ({ label: d.name, href: `/destinations/${d.slug}` }))
        .sort(byName),
    },
    {
      head: "Departing from",
      links: getPricedCities()
        .map((c) => ({ label: c.name, href: `/from/${c.slug}` }))
        .sort(byName),
    },
    {
      head: "Trips",
      links: live.map((p) => ({ label: p.name, href: `/trips/${p.slug}` })).sort(byName),
    },
    {
      head: "Travel with a creator",
      links: getCreators()
        .map((cr) => ({ label: cr.name, href: `/travel-with/${cr.slug}` }))
        .sort(byName),
    },
  ];
  return groups.filter((g) => g.links.length > 0);
}
