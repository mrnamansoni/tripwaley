import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-contained server bundle for Docker / Dokploy deploys
  output: "standalone",
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
};

export default nextConfig;
