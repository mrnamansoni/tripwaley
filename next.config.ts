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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
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
        source: "/:path((?!admin|api).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
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
