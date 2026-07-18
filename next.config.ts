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
    // Optimized images rarely change — cache them for a year so the server
    // encodes each width once instead of re-doing it every few hours.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
