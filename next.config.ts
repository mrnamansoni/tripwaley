import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-contained server bundle for Docker / Dokploy deploys
  output: "standalone",
  // the version banner is free reconnaissance for anyone scanning
  poweredByHeader: false,
  images: {
    // AVIF first (≈20-30% smaller than WebP on photos), WebP as the fallback
    // for older browsers. AVIF encodes are CPU-heavy, but the persistent
    // /app/.next/cache/images volume means each image+width is encoded exactly
    // once for the site's lifetime — a one-time cost, then pure bandwidth win.
    formats: ["image/avif", "image/webp"],
    // Source photos cap at ~2560px, so generating 2048/3840 variants just burns
    // CPU and ships bigger files. Cap the largest served width at 1920.
    /* 1440 and 1600 exist because of a real gap: a 1350px desktop viewport
       asking for 100vw jumped straight from 1200 to 1920, so every full-bleed
       photo downloaded a 1920px file to paint ~1300px. PageSpeed measured
       210KB of pure waste on one image that way. */
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1600, 1920],
    /* Next validates the `quality` prop against this list and refuses anything
       absent from it, so 60 has to be declared before a component can ask for
       it. 60 is for full-bleed decorative photography — backgrounds behind
       text, slats, film frames — where PageSpeed measured ~158KB of savings
       per image and the difference is invisible under an overlay. 75 stays the
       default for everything that is looked at directly. */
    qualities: [60, 75],
    // Admin "Replace" overwrites a photo at its existing URL (so every page
    // using it updates at once, with no catalog rewrite) — the optimizer
    // caches by URL, so a long TTL here would keep serving the old bytes
    // for that whole window. 60s still dedupes re-encoding across the burst
    // of requests a single page load fans out to, without masking a replace.
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        /* P1 — the root layout's force-dynamic makes Next advertise
           "no-store" on every route, which makes EVERY caching layer illegal:
           no CDN edge cache, no reverse proxy. Rendering itself only costs
           ~50ms, so the render was never the problem; forbidding reuse was.

           This keeps dynamic rendering (an admin save is still live on the
           next request) but lets a SHARED cache hold the result for 60s.
           max-age=0 keeps browsers revalidating, so a visitor never sees
           stale content; s-maxage applies only to a CDN, which is why this is
           inert until Cloudflare is in front — and correct the moment it is.

           /admin and /api are excluded below: caching an authenticated admin
           page in a shared cache would serve one session's HTML to another
           visitor. */
        /* `_next/static` is excluded as well, and that exclusion is load-
           bearing. Without it this rule also matched every hashed JS, CSS and
           font file and replaced Next's own `immutable, max-age=31536000` with
           `max-age=0`, which Cloudflare then served as a 2-hour browser cache.
           PageSpeed reported it as ~470KB of first-party re-downloads under
           "Use efficient cache lifetimes".

           Excluding the path is the whole fix — Next already serves hashed
           build output as `immutable, max-age=31536000` on its own. Adding our
           own rule for it instead makes the build warn that "custom
           Cache-Control headers ... can break Next.js development behavior",
           which is the framework saying: don't, just stop overriding it. */
        source: "/:path((?!admin|api|_next/static).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
          },
          {
            /* Agent discovery (RFC 8288): `describedby` points at the
               machine-readable brief at /llms.txt.

               Deliberately NOT advertising `api-catalog` or `service-desc`.
               This site has no public API — everything under /api is internal
               (admin, payments, lead capture) and is disallowed in robots.txt.
               Publishing a catalogue would point agents at endpoints that take
               bookings and money, which is worse than publishing nothing.

               Markdown availability is not advertised here either: it applies
               to four route families, not to every path this rule matches, and
               a header claiming it site-wide would be wrong on /about. */
            key: "Link",
            /* NO rel="canonical" here. A canonical Link header applies to every
               path this rule matches, so a single value would tell all 90 URLs
               they are the homepage — which is the exact bug that was
               suppressing this site from the index. Canonicals stay per-page in
               generateMetadata, where they can differ. */
            value: '</llms.txt>; rel="describedby"; type="text/plain"',
          },
        ],
      },
      {
        // Applied to everything, including /admin/login — which collects the
        // password controlling all pricing, media and booking data, and was
        // framable by any origin before this.
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // Deliberately NOT a full CSP yet: the inline JSON-LD, the GA4 and
          // Meta bootstrap scripts and Google Fonts all need allowing for, and
          // a wrong CSP breaks the site silently. Report-only first, separately.
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // www served a complete second copy of ~60 pages with no canonical
        // signal deciding which was real. Apex wins; metadataBase already
        // points there.
        source: "/:path*",
        has: [{ type: "host", value: "www.tripwaley.com" }],
        destination: "https://tripwaley.com/:path*",
        permanent: true,
      },
      /* Addresses from the two sites that lived on this domain before this
         one (a static HTML site, and a WordPress theme before that) which
         Google still crawls. Each has a real equivalent here; the WordPress
         demo posts (hello-world, tag archives, lorem blog posts) do not, and
         are left to 404, which is the correct answer for them. */
      ...(
        [
          ["/index.html", "/"],
          ["/index.php/home", "/"],
          ["/about-us", "/about"],
          ["/career", "/about"],
          ["/weekend-trips", "/trips"],
          ["/festivals", "/trips"],
          ["/festivals.html", "/trips"],
          ["/corporate-tours", "/group-departures"],
          ["/honeymoon.html", "/honeymoon"],
          ["/india.html", "/destinations"],
          ["/blog", "/stories"],
          ["/tour-term-condition", "/terms"],
        ] as const
      ).map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
  },
  async rewrites() {
    return {
      // beforeFiles runs ahead of Next's own public-folder file check — see
      // src/app/api/uploads/[...path]/route.ts for why that check can't be
      // trusted for files an admin uploads after the server has booted.
      beforeFiles: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
    };
  },
  experimental: {
    /* Tailwind's output is small and atomic, and the two stylesheets were
       blocking first paint for ~150ms on mobile. Next's own guidance is to
       inline for atomic CSS; the trade-off it names is that returning visitors
       re-download the styles with each HTML response instead of reusing a
       cached file. That is the right side of the trade here, because the HTML
       itself is only cacheable for 60s anyway. */
    inlineCss: true,
    // src/proxy.ts gates every /api/admin/* request, and Next 16 buffers a
    // proxied body to at most 10MB by default — silently: bytes past the
    // limit are dropped with no error to the client, so a large upload just
    // arrives truncated and fails multipart parsing downstream with a
    // misleading "expected multipart form" error. MAX_VIDEO_BYTES in the
    // media route is 25MB, so the default was already an outstanding latent
    // bug for any video upload over 10MB, before this change touched it.
    proxyClientMaxBodySize: "30mb",
  },
};

export default nextConfig;
