"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button, Container, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { useRequireAuth } from "@/features/auth";
import { api } from "@/lib/api";
import { cachePlanets, getCachedPlanets } from "@/lib/planetCache";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { StreakCard } from "@/features/streak/StreakCard";
import type { Planet } from "@/types/planet";
import type { Streak } from "@/types/streak";
import { CreatePlanetForm } from "./CreatePlanetForm";

// WebGL 은 브라우저에서만 동작한다 → 서버 렌더를 건너뛴다.
// (dynamic ssr:false 는 클라이언트 컴포넌트 안에서만 쓸 수 있다)
const OrbitScene = dynamic(() => import("./OrbitScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * 궤도 지도 높이 — 화면 높이에 맞춰 크게 잡는다.
 * 넓게 봐야 궤도가 늘어나도 전체가 한눈에 들어온다.
 */
const MAP_HEIGHT_CLASS = "h-[82vh] min-h-[560px]";

// 보조 통계 칩 — 스트릭(hero)보다 작고 담백하게. 위계를 만든다.
function MiniStat({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div
      className="orbit-rise flex flex-col items-center justify-center rounded-lg border border-border bg-surface/60 px-3 py-2"
      style={{ ["--rise-delay" as string]: `${delay}s` }}
    >
      <span className="text-lg font-semibold text-fg">{value}</span>
      <span className="text-[11px] text-fg-muted">{label}</span>
    </div>
  );
}

// 우주 지도: 내 행성들을 모아 보는 메인 화면.
export function SpaceMap() {
  const { user, loading: authLoading } = useRequireAuth();
  // 뒤로 돌아온 경우 캐시로 즉시 렌더(역전환용) → 곧 신선한 값으로 갱신
  const [planets, setPlanets] = useState<Planet[]>(() => getCachedPlanets());
  const [loading, setLoading] = useState(() => getCachedPlanets().length === 0);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [streak, setStreak] = useState<Streak | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  async function load(showLoading: boolean) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // 스트릭은 곁들이는 정보라 실패해도 지도는 그대로 보여준다 (null → 타일만 생략)
      const [list, s] = await Promise.all([
        api.listPlanets(),
        api.getStreak().catch(() => null),
      ]);
      setPlanets(list);
      setStreak(s);
      cachePlanets(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  // 로그인 확인된 뒤에만 내 행성을 불러온다.
  useEffect(() => {
    if (user) load(planets.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 인증 확인 전/미로그인(리다이렉트 중)에는 지도를 그리지 않는다.
  if (authLoading || !user) {
    return (
      <main className="py-10">
        <Container size="lg">
          <Text variant="muted">불러오는 중…</Text>
        </Container>
      </main>
    );
  }

  const totalRecords = planets.reduce((sum, p) => sum + p.record_count, 0);
  const completed = planets.filter((p) => p.is_completed).length;

  return (
    // overflow-x-hidden: 아래 지도를 화면 전체 폭(w-screen)으로 빼내므로
    // 세로 스크롤바 폭만큼 가로로 넘치는 것을 막는다.
    <main className="overflow-x-hidden py-10">
      <Container size="lg">
        {/* 헤더 (로고 + 새 행성 버튼) */}
        <div className="mb-8">
          <Header titleAs="h1" size={48}>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              새 행성 만들기
            </Button>
          </Header>
          <Text variant="muted" className="mt-2">
            우주 지도 — 내 학습 행성들
          </Text>
        </div>

        {/* 통계 — 스트릭을 핵심(hero)으로 강조하고 나머지는 보조 칩으로 */}
        <div className="mb-8 grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {streak ? (
            <StreakCard streak={streak} />
          ) : (
            // 스트릭 조회 실패 시엔 자리만 비우고 보조 칩을 왼쪽으로
            <div className="hidden sm:block" />
          )}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="행성" value={planets.length} delay={0.05} />
            <MiniStat label="총 기록" value={totalRecords} delay={0.1} />
            <MiniStat label="완성" value={completed} delay={0.15} />
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* 궤도 지도 — 통계와 확실히 떼어 놓는다 */}
        {loading ? (
          <Text variant="muted">불러오는 중…</Text>
        ) : planets.length === 0 ? (
          <Text variant="muted">아직 행성이 없습니다. “새 행성 만들기”로 시작해 보세요.</Text>
        ) : (
          <Text variant="muted">끌어서 둘러보고, 휠로 확대·축소할 수 있어요.</Text>
        )}
      </Container>

      {/* 궤도 지도 — Container 밖으로 빼내 화면 전체 폭을 쓴다 */}
      {!loading && planets.length > 0 && (
        <div
          className={`relative left-1/2 mt-3 w-screen -translate-x-1/2 ${MAP_HEIGHT_CLASS}`}
        >
          <OrbitScene planets={planets} animate={!reducedMotion} />
        </div>
      )}

      {/* 새 행성 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="새 행성 만들기">
        <CreatePlanetForm
          onCreated={() => {
            setModalOpen(false);
            load(false);
          }}
        />
      </Modal>
    </main>
  );
}
