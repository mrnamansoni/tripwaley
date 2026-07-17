import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-contained server bundle for Docker / Dokploy deploys
  output: "standalone",
  images: {
    // WebP is the default; with `sharp` installed it now actually produces it
    // (was silently falling back to JPEG before). AVIF is intentionally left
    // off — its encode is far heavier on a shared VPS for little extra gain.
    formats: ["image/webp"],
    // Source photos cap at ~2560px, so generating 2048/3840 variants just burns
    // CPU and ships bigger files. Cap the largest served width at 1920.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Optimized images rarely change — cache them for a year so the server
    // encodes each width once instead of re-doing it every few hours.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
