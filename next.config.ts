import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // Canonical host: www serves a full duplicate of the site otherwise.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.pregnawell.com" }],
        destination: "https://pregnawell.com/:path*",
        permanent: true,
      },
      // Legacy unprefixed paths → English locale
      { source: "/story", destination: "/en/story", permanent: true },
      { source: "/blog", destination: "/en/blog", permanent: true },
      { source: "/blog/:slug", destination: "/en/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
