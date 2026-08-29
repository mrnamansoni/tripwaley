import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "./robots";
import {
  getLivePackages,
  getPricedCities,
  getPosts,
  getCreators,
} from "@/lib/catalog";

/* THE SITEMAP.
 *
 * Generated from the catalog rather than hand-listed, so a trip added through
 * the admin panel is in the sitemap the moment it goes live — the failure mode
 * of a static list is that it silently rots and the newest, most sellable
 * trips are the ones missing from it.
 *
 * Deliberately excluded: /admin, /api, /lab, /lab2, and the design sandboxes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE_ORIGIN}${path}`;

  const staticPages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "daily"],
    ["/trips", 0.9, "daily"],
    ["/group-departures", 0.8, "weekly"],
    ["/honeymoon", 0.8, "weekly"],
    ["/solo", 0.8, "weekly"],
    ["/college-trips", 0.8, "weekly"],
    ["/travel-with-creator", 0.7, "weekly"],
    ["/destinations", 0.7, "weekly"],
    ["/collections", 0.6, "weekly"],
    ["/stories", 0.6, "weekly"],
    ["/about", 0.5, "monthly"],
    ["/contact", 0.5, "monthly"],
    ["/vibe-check", 0.4, "monthly"],
    // policy pages: low priority but they must be indexable — a payment
    // gateway reviewer reaching a noindex policy page is a rejection
    ["/policies", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
    ["/privacy", 0.3, "yearly"],
    ["/refund-policy", 0.3, "yearly"],
    ["/return-policy", 0.3, "yearly"],
    ["/shipping-policy", 0.3, "yearly"],
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map(([path, priority, changeFrequency]) => ({
    url: url(path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  for (const p of getLivePackages()) {
    entries.push({ url: url(`/trips/${p.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.9 });
  }
  for (const c of getPricedCities()) {
    entries.push({ url: url(`/from/${c.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const post of getPosts()) {
    entries.push({
      url: url(`/stories/${post.slug}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }
  for (const cr of getCreators()) {
    entries.push({ url: url(`/travel-with/${cr.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    for (const t of cr.trips.filter((x) => x.published)) {
      entries.push({
        url: url(`/travel-with/${cr.slug}/${t.packageSlug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  return entries;
}
