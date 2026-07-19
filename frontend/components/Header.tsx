"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TransitionLink } from "@/components/TransitionLink";
import { useAuth } from "@/features/auth";
import { api } from "@/lib/api";

// 화면 상단 헤더: 왼쪽 로고(→ 우주 지도), 오른쪽 페이지 액션 + 사용자/로그아웃.
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
  const { user, refresh } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // 로그아웃 실패해도 로컬 상태는 비운다
    }
    await refresh();
    router.replace("/login");
  }

  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-4 ${className ?? ""}`}
    >
      <TransitionLink href="/" aria-label="Orbit 홈" className="inline-flex items-center rounded">
        <Logo showWordmark wordmarkAs={titleAs} size={size} />
      </TransitionLink>

      <div className="flex flex-wrap items-center gap-3">
        {children}
        {user && (
          <div className="flex items-center gap-2">
            {user.picture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt=""
                width={28}
                height={28}
                className="rounded-full border border-border"
              />
            )}
            <span className="text-sm text-fg-body">{user.name ?? user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-fg-muted hover:text-fg"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
