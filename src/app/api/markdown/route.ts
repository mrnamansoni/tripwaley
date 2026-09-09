import { type NextRequest } from "next/server";
import { markdownFor } from "@/lib/markdown";

/**
 * The markdown half of content negotiation.
 *
 * Not a public endpoint anyone is meant to call: src/proxy.ts rewrites here
 * when a request for a normal page carries `Accept: text/markdown`, so the URL
 * the agent asked for is the URL it keeps. It lives under /api only because
 * middleware runs on the edge and cannot read the catalog off disk — the
 * rewrite is what gets us into a Node runtime where it can.
 *
 * Route Handlers are NOT cached by default in this version of Next (verified in
 * node_modules/next/dist/docs), so an admin price edit shows up here as
 * immediately as it does on the page itself.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  /* Set by src/proxy.ts on the rewrite. The query-string form is kept as a
     fallback so the handler stays directly callable when debugging. */
  const path = req.headers.get("x-md-path") ?? req.nextUrl.searchParams.get("path") ?? "/";
  const md = markdownFor(path);

  if (!md) {
    // No markdown for this path. Say so plainly rather than inventing a
    // degraded version of a page we have not modelled.
    return new Response(`# Not available as markdown\n\nThis path has no markdown representation. Fetch it as HTML instead:\nhttps://tripwaley.com${path}\n`, {
      status: 404,
      headers: { "content-type": "text/markdown; charset=utf-8" },
    });
  }

  return new Response(md, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      // the HTML and the markdown are the same resource in two forms
      "content-location": `https://tripwaley.com${path}`,
      link: `<https://tripwaley.com${path}>; rel="canonical"`,
      /* NOT shared-cacheable, deliberately. The HTML at this same URL is
         edge-cached for 60s (see next.config.ts), and Cloudflare does not key
         its cache on an arbitrary `Vary: Accept`. If both representations were
         cacheable, one agent asking for markdown could leave markdown sitting
         in the edge cache for the next human visitor — or the reverse. Agents
         are a low-volume, low-latency-sensitivity audience; giving up their
         edge cache costs nothing and removes the whole failure mode. */
      "cache-control": "private, no-store",
      vary: "Accept",
    },
  });
}
