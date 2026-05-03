import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduMaps - Educational Resources for Kids",
  description: "A curated directory of local field trip locations and self-directed learning resources tailored to the elementary curriculum.",
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
      </body>
    </html>
  );
}
