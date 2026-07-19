"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Text } from "@usetaehwan/ui";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/features/auth";
import { GOOGLE_LOGIN_URL } from "@/lib/api";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 이미 로그인돼 있으면 우주 지도로
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  return (
    <main className="flex flex-1 items-center justify-center py-20">
      <Container size="sm">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo size={72} showWordmark wordmarkAs="h1" />
          <Text variant="muted" className="max-w-xs">
            공부하면 내 우주가 자라난다. 구글 계정으로 시작하세요.
          </Text>

          {/* OAuth 는 전체 페이지 이동이라 <a> 로 백엔드 /auth/google 로 보낸다 */}
          <a
            href={GOOGLE_LOGIN_URL}
            className="inline-flex items-center gap-3 rounded-md border border-border bg-surface px-5 py-3 font-medium text-fg transition-colors hover:border-brand"
          >
            {/* 구글 공식 G 로고 (브랜드 색 그대로 — 서드파티 로고라 토큰 예외) */}
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            구글로 로그인
          </a>
        </div>
      </Container>
    </main>
  );
}
