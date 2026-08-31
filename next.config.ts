import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // Legacy unprefixed paths → English locale
      { source: "/story", destination: "/en/story", permanent: true },
      { source: "/blog", destination: "/en/blog", permanent: true },
      { source: "/blog/:slug", destination: "/en/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
