import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { mediaUrl } from "../lib/media";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://map.dgedu.link"),
  title: "대구 에듀맵스 - 대구광역시교육청",
  description: "초등 교육과정 연계 체험학습 및 자기주도학습자료 정보제공",
  icons: {
    icon: mediaUrl("daegu_logo.webp"),
    apple: mediaUrl("daegu_logo.webp"),
  },
  openGraph: {
    type: "website",
    siteName: "대구 에듀맵스",
    locale: "ko_KR",
    title: "대구 에듀맵스 - 대구광역시교육청",
    description: "초등 교육과정 연계 체험학습 및 자기주도학습자료 정보제공",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "대구 에듀맵스" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* pages.dev 기본 도메인 접속 시 공식 도메인(map.dgedu.link)으로 자동 이동 — 단일 도메인 노출.
            경로·쿼리·해시 보존, location.replace로 히스토리 오염 방지.
            정확 일치라 프리뷰 서브도메인(<hash>.edumaps-project.pages.dev)은 리다이렉트되지 않음. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(location.hostname==='edumaps-project.pages.dev'){location.replace('https://map.dgedu.link'+location.pathname+location.search+location.hash);}})();`,
          }}
        />
        {/* 본문 글꼴: Pretendard 가변 글꼴(쓰는 글자만 내려받는 다이내믹 서브셋) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RK6LDHNFXQ"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RK6LDHNFXQ');
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
