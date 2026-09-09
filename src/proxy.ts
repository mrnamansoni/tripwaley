/**
 * Two jobs, in this order:
 *
 *   1. CONTENT NEGOTIATION. A request for a normal page carrying
 *      `Accept: text/markdown` is rewritten to /api/markdown, so an agent gets
 *      the content instead of ~230KB of scroll-driven layout while the URL it
 *      asked for stays the URL it keeps.
 *
 *   2. ROUTE GUARD. Every /admin page and /api/admin endpoint (except login)
 *      requires a valid signed session cookie, verified before any render or
 *      handler runs. /lab and /lab2 are unreleased design sandboxes and 404 for
 *      anyone without a session.
 *
 * ORDER AND SCOPE MATTER HERE. The matcher below now covers the whole site so
 * that job 1 can see page requests — it used to cover only /admin, /api/admin
 * and the labs. That widening is why `guarded()` exists: without it, the
 * fall-through at the bottom would 401 every public API, and /api/lead and
 * /api/pay/create are public by design. Booking would stop working site-wide.
 * Anything not explicitly guarded must reach NextResponse.next() untouched.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { wantsMarkdown } from "@/lib/markdownRoutes";


/** the only paths the session guard applies to */
function guarded(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/lab" ||
    pathname === "/lab2" ||
    pathname.startsWith("/lab/") ||
    pathname.startsWith("/lab2/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (wantsMarkdown(request.method, request.headers.get("accept"), pathname)) {
    /* The path travels as a REQUEST HEADER, not a query string. A query string
       added to the rewrite target is dropped here — every path arrived at the
       handler as "/" and every agent got the site summary instead of the page
       it asked for. Headers are what the Proxy docs list for passing data to
       the destination, and they survive. */
    const url = request.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.search = "";

    const headers = new Headers(request.headers);
    headers.set("x-md-path", pathname);

    return NextResponse.rewrite(url, {
      request: { headers },
      headers: {
        // The same URL serves two representations, so caches must key on Accept.
        vary: "Accept",
        /* Set HERE, not in the route handler: next.config.ts headers() are
           applied against the ORIGINAL path before this rewrite runs, so the
           HTML rule's `s-maxage=60` was landing on the markdown response.
           Cloudflare does not key its cache on an arbitrary Vary, so an agent
           asking for markdown could leave markdown in the edge cache for the
           next human visitor. Agents don't need an edge cache; humans need the
           right document. */
        "cache-control": "private, no-store",
      },
    });
  }

  if (!guarded(pathname)) return NextResponse.next();

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const isLab =
    pathname === "/lab" || pathname === "/lab2" ||
    pathname.startsWith("/lab/") || pathname.startsWith("/lab2/");

  const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  // an unauthenticated visitor should not learn the labs exist
  if (isLab) return new NextResponse("Not found", { status: 404 });

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  /* Everything except Next's own assets and the files that must be served
     byte-for-byte. Running on all pages is required for content negotiation;
     the guard above is what keeps that from touching anything else. */
  matcher: [
    "/((?!_next/static|_next/image|images/|uploads/|videos/|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|llms.txt).*)",
  ],
};
