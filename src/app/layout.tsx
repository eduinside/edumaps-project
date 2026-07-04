import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { mediaUrl } from "../lib/media";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "대구 에듀맵스 - 대구광역시교육청",
  description: "초등 교육과정 연계 체험학습 및 자기주도학습자료 정보제공",
  icons: {
    icon: mediaUrl("daegu_logo.webp"),
    apple: mediaUrl("daegu_logo.webp"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${plusJakartaSans.variable} antialiased`}>
      <head>
        {/* pages.dev 기본 도메인 접속 시 공식 도메인(map.dgedu.link)으로 자동 이동 — 단일 도메인 노출.
            경로·쿼리·해시 보존, location.replace로 히스토리 오염 방지.
            정확 일치라 프리뷰 서브도메인(<hash>.edumaps-project.pages.dev)은 리다이렉트되지 않음. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(location.hostname==='edumaps-project.pages.dev'){location.replace('https://map.dgedu.link'+location.pathname+location.search+location.hash);}})();`,
          }}
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
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
