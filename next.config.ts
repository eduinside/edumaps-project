import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.daegu.go.kr",
      },
      {
        protocol: "https",
        hostname: "**.daegu.go.kr",
      },
      {
        protocol: "https",
        hostname: "**.dge.go.kr",
      },
    ],
  },
};

export default nextConfig;
