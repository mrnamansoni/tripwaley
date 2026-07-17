import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-contained server bundle for Docker / Dokploy deploys
  output: "standalone",
};

export default nextConfig;
