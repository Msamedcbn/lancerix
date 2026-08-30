import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    // Placeholder photography until real brand images exist. next/image is used
    // rather than a CSS background so the hero band gets priority loading and a
    // reserved box, which keeps LCP and CLS honest.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
