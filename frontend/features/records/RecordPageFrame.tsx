"use client";

/**
 * 기록 페이지(목록·작성·읽기) 공통 뼈대.
 *
 * - 로그인 확인(useRequireAuth) 후에만 내용을 그린다.
 * - 상단에 헤더(로고 → 우주 지도) + 돌아가기 링크.
 * - 폭은 우주 지도(메인)와 동일하게 lg 로 통일한다.
 * - fill: 작성 화면처럼 에디터가 남은 세로 공간을 꽉 채워야 할 때. 화면 높이를
 *   기준으로 flex 컬럼을 만들어 children 이 flex-1 로 늘어날 수 있게 한다.
 */

import { ArrowLeft } from "lucide-react";
import { Container, OrbitLoader } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { TransitionLink } from "@/components/TransitionLink";
import { useRequireAuth } from "@/features/auth";

interface Props {
  /** 돌아가기 링크 목적지 */
  backHref: string;
  backLabel: string;
  /** 세로를 꽉 채우는 레이아웃 (작성 화면) */
  fill?: boolean;
  children: React.ReactNode;
}

export function RecordPageFrame({ backHref, backLabel, fill = false, children }: Props) {
  const { user, loading } = useRequireAuth();

  return (
    <main className={fill ? "flex h-dvh flex-col py-8" : "py-8"}>
      <Container size="lg" className={fill ? "flex min-h-0 flex-1 flex-col" : undefined}>
        <Header className="mb-6" />

        {loading || !user ? (
          <div className="flex justify-center py-20">
            <OrbitLoader />
          </div>
        ) : (
          <>
            <TransitionLink
              href={backHref}
              className="orbit-back mb-5 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowLeft size={15} aria-hidden />
              {backLabel}
            </TransitionLink>
            {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
          </>
        )}
      </Container>
    </main>
  );
}
