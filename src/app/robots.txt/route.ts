export const SITE_ORIGIN = "https://tripwaley.com";

/**
 * robots.txt — crawl rules plus Content Signals.
 *
 * This was a Next.js metadata route (`app/robots.ts`). It is a Route Handler
 * now because `MetadataRoute.Robots` can only emit the directives Next knows
 * about, and `Content-Signal` is not one of them.
 *
 * CRAWL RULES. /lab and /lab2 already send a noindex meta tag, but a crawler
 * still has to fetch ~850KB of design sandbox to discover that, so disallowing
 * them saves the crawl budget outright. /admin and /api are disallowed because
 * nothing under them belongs in an index.
 *
 * CONTENT SIGNALS (contentsignals.org) declare how this content may be used.
 * The three are independent, and the values below are chosen for this business
 * rather than copied from the example in the docs:
 *
 *   search=yes     Index it and link back. This is the whole point.
 *
 *   ai-input=yes   Let an AI assistant read a page at question time to answer
 *                  someone and cite us. Cloudflare's sample robots.txt sets
 *                  this to `no`, and following that would have been a mistake
 *                  here: AI referrals to travel sites are up 194% year on year,
 *                  and this site was deliberately built for that traffic — the
 *                  organisation entity, the FAQ copy and /llms.txt all exist to
 *                  be read this way. Saying no would switch that off.
 *
 *   ai-train=no    Training a model on this content returns nothing to us. It
 *                  is not what produces a citation or a visit, so there is no
 *                  reason to grant it. This is the one to refuse.
 *
 * A signal is a stated preference, not an enforcement mechanism — well-behaved
 * crawlers honour it and the rest ignore it. Blocking a crawler outright is a
 * Cloudflare-side decision, not a robots.txt one.
 */

const DISALLOW = ["/admin", "/admin/", "/api/", "/lab", "/lab2"];

const BODY = `# Tripwaley — https://tripwaley.com
# Content Signals: https://contentsignals.org/
#
# search=yes     index this content and link back to it
# ai-input=yes   may be read at question time to answer someone, with attribution
# ai-train=no    may NOT be used as training data for a model

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
${DISALLOW.map((p) => `Disallow: ${p}`).join("\n")}

Host: ${SITE_ORIGIN}
Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

export async function GET() {
  return new Response(BODY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // robots.txt changes rarely, but a stale one is expensive to live with
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
