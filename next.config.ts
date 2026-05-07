import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/pregnascan-app",
        destination: "https://pregnascan.app",
        permanent: false,
        basePath: false,
      },
      {
        source: "/pregnascan",
        destination: "https://pregnascan.app",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
