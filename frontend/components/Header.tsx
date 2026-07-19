import Link from "next/link";
import { Logo } from "@/components/Logo";

// 화면 상단 헤더: 왼쪽 로고(클릭 시 우주 지도로), 오른쪽 액션 슬롯.
export function Header({
  titleAs = "span",
  size = 28,
  className,
  children,
}: {
  /** 로고 워드마크 태그 — 메인 화면은 h1, 그 외는 span */
  titleAs?: "span" | "h1";
  /** 로고 크기(px). 메인은 크게 */
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={`flex flex-wrap items-center justify-between gap-4 ${className ?? ""}`}>
      <Link href="/" aria-label="Orbit 홈" className="inline-flex items-center rounded">
        <Logo showWordmark wordmarkAs={titleAs} size={size} />
      </Link>
      {children}
    </header>
  );
}
