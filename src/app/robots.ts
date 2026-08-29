import type { MetadataRoute } from "next";

export const SITE_ORIGIN = "https://tripwaley.com";

/* Crawl rules.
 *
 * /lab and /lab2 already send a noindex meta tag, but a crawler still has to
 * fetch ~850KB of design sandbox to discover that. Disallowing them here saves
 * the crawl budget outright. /admin and /api are disallowed because nothing
 * under them belongs in an index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/lab", "/lab2"],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
