import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";
import { Starfield } from "@/components/Starfield";

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

/**
 * 새로고침 시 흰 화면이 번쩍이는 것을 막는다.
 *
 * globals.css 에도 color-scheme: dark 가 있지만, 그건 스타일시트가 다 로드된 뒤에야
 * 적용된다. 그 전까지 브라우저는 기본값(밝음)으로 배경을 칠한다.
 * 여기 두면 <meta name="color-scheme"> 로 head 에 나가서 CSS 보다 먼저 반영된다.
 */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0d16", // --color-bg 와 동일
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
      <body className="min-h-full flex flex-col">
        <Starfield />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
