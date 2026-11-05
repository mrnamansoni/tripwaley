/* Which /destinations/<slug> pages exist, and what kind each is.
 *
 * A destination with a live trip gets the full landing page. One with no
 * trip but live stories about it — Ladakh, Shimla, Valley of Flowers, which
 * stories were targeting while every link to them 404'd — gets a guide page:
 * the stories, the planning notes, and an honest "no batch yet". One with
 * neither stays a 404, because an empty page is worse than none.
 *
 * The route, the sitemap, the destinations hub and story pages all ask here,
 * so none of them can link to a page another one would 404. */

import { DESTINATIONS, destinationsFor, getDestination, type Destination } from "./destinations";
import { getAllPosts, getLivePackages } from "./catalog";
import { storiesForDestination } from "./stories";

export type DestinationPageKind = "trips" | "guide";

export function destinationTrips(slug: string) {
  if (!getDestination(slug)) return [];
  return getLivePackages().filter((p) => destinationsFor(p).some((d) => d.slug === slug));
}

export const destinationStories = (slug: string) => storiesForDestination(slug, getAllPosts());

export function destinationPageKind(slug: string): DestinationPageKind | null {
  if (!getDestination(slug)) return null;
  if (destinationTrips(slug).length) return "trips";
  if (destinationStories(slug).length) return "guide";
  return null;
}

export function destinationPages(): { dest: Destination; kind: DestinationPageKind }[] {
  return DESTINATIONS.flatMap((dest) => {
    const kind = destinationPageKind(dest.slug);
    return kind ? [{ dest, kind }] : [];
  });
}
