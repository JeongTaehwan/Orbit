import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit — 공부하면 내 우주가 자라난다",
  description:
    "학습 기록을 쌓아 나만의 행성을 테라포밍하는 학습 동기부여 앱. 여러 학습 주제가 하나의 우주로.",
  openGraph: {
    title: "Orbit — 공부하면 내 우주가 자라난다",
    description: "학습 기록을 쌓아 나만의 행성을 테라포밍하는 학습 동기부여 앱.",
    type: "website",
    siteName: "Orbit",
    // TODO(og-image): 준비되면 app/opengraph-image.(png|tsx) 를 두거나 아래를 채운다.
    // images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
