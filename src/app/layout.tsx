import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "에듀맵 - 대구광역시교육청",
  description: "초등 교육과정 연계 체험학습 및 자기주도학습자료 정보제공",
  icons: {
    icon: '/images/daegu_logo.webp',
    apple: '/images/daegu_logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${plusJakartaSans.variable} antialiased`}>
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
