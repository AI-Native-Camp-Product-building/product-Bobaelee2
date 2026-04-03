import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: ".mdTI — .md가 당신에게 하고 싶었던 말",
  description: ".md를 분석해서 당신의 개발 성향을 팩폭합니다.",
  openGraph: {
    title: ".mdTI — .md가 당신에게 하고 싶었던 말",
    description: ".md를 분석해서 당신의 개발 성향을 팩폭합니다. 나도 털어보기 →",
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
