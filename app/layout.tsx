import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: ".mdTI — 네 CLAUDE.md가 너한테 하고 싶었던 말",
  description: "CLAUDE.md를 분석해서 당신의 개발 성향을 알려드립니다. 발칙하게.",
  openGraph: {
    title: ".mdTI — 네 CLAUDE.md가 너한테 하고 싶었던 말",
    description: "나도 털리기 → mdti.dev",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-bg-primary text-claude-cream antialiased`}>
        {children}
      </body>
    </html>
  );
}
