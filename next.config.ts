import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 export: `next build` 시 out/ 폴더에 HTML/CSS/JS 정적 자산 생성
  output: "export",
  images: {
    // 정적 export에는 이미지 최적화 서버가 없으므로 unoptimized 필수
    unoptimized: true,
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
