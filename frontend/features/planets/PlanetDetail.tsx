"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Container, Heading, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRequireAuth } from "@/features/auth";
import { PlanetShowcase } from "@/features/planets/PlanetShowcase";
import { RecordDrawer } from "@/features/records/RecordDrawer";
import { api } from "@/lib/api";
import { cachePlanet, getCachedPlanet } from "@/lib/planetCache";
import type { Planet as PlanetType } from "@/types/planet";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { difficultyDescription, difficultyLabel } from "@/lib/utils/difficulty";
import { stageName } from "@/lib/utils/progress";

export function PlanetDetail({ planetId }: { planetId: number }) {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  // 캐시가 있으면 즉시 렌더(확대 전환의 모핑 대상 확보 + 로딩 깜빡임 제거)
  const [planet, setPlanet] = useState<PlanetType | null>(() => getCachedPlanet(planetId));
  const [loading, setLoading] = useState(() => getCachedPlanet(planetId) === null);
  const [error, setError] = useState<string | null>(null);

  // 기록 UI 는 우측 드로어 하나로 통합 (목록/작성/읽기). 행성은 가리지 않는다.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"list" | "compose">("list");

  function openDrawer(mode: "list" | "compose") {
    setDrawerMode(mode);
    setDrawerOpen(true);
  }

  // 진행도는 부드럽게 보간 (숫자/바/행성 모두 이 값으로)
  const shownProgress = useAnimatedNumber(planet?.progress ?? 0);

  async function loadPlanet(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fresh = await api.getPlanet(planetId);
      setPlanet(fresh);
      cachePlanet(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "행성을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 캐시로 이미 그려졌으면 로딩 표시 없이 조용히 갱신
    if (user) loadPlanet(getCachedPlanet(planetId) === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId, user]);

  async function handleDelete() {
    if (!confirm("이 행성을 삭제할까요? 기록도 함께 사라집니다.")) return;
    try {
      await api.deletePlanet(planetId);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  return (
    <main className="py-8">
      <Container size="sm">
        {/* 헤더 (로고 클릭 → 우주 지도) */}
        <Header className="mb-8" />

        {authLoading || loading ? (
          <Text variant="muted">불러오는 중…</Text>
        ) : error && !planet ? (
          <Text as="p" variant="body" className="text-danger">
            {error}
          </Text>
        ) : planet ? (
          <div className="flex flex-col items-center text-center">
            {/* 주인공: 큰 행성 (궤도 링 + 발광) */}
            <div className="orbit-rise">
              <PlanetShowcase
                progress={shownProgress}
                difficulty={planet.difficulty}
                isCompleted={planet.is_completed}
                size={260}
                viewTransitionName={`planet-${planet.id}`}
              />
            </div>

            {/* 이름/유형/단계 + 유형 설명 한 줄 */}
            <div
              className="orbit-rise mt-6 flex flex-col items-center gap-2"
              style={{ ["--rise-delay" as string]: "0.06s" }}
            >
              <Heading level={1}>{planet.name}</Heading>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{difficultyLabel(planet.difficulty)}</Badge>
                <Badge variant="brand">{stageName(shownProgress)}</Badge>
              </div>
              <Text variant="small" className="max-w-xs text-fg-muted">
                {difficultyDescription(planet.difficulty)}
              </Text>
            </div>

            {/* 진행도 */}
            <div
              className="orbit-rise mt-5 w-full max-w-sm"
              style={{ ["--rise-delay" as string]: "0.12s" }}
            >
              <div className="mb-1 flex justify-between text-sm text-fg-muted">
                <span>진행도</span>
                <span>{Math.round(shownProgress)}%</span>
              </div>
              <ProgressBar value={shownProgress} />
            </div>

            {planet.is_completed && (
              <Text variant="small" className="mt-3 text-brand">
                테라포밍 완료 — 생명이 사는 행성이 되었습니다 🌍
              </Text>
            )}

            {/* 기록 작성 (드로어를 작성 모드로 연다) */}
            <div
              className="orbit-rise mt-6"
              style={{ ["--rise-delay" as string]: "0.18s" }}
            >
              <Button variant="primary" onClick={() => openDrawer("compose")}>
                학습 기록 작성
              </Button>
            </div>
            {error && (
              <Text variant="small" as="p" className="mt-2 text-danger">
                {error}
              </Text>
            )}

            {/* 기록 목록 (드로어를 목록 모드로 연다) */}
            <button
              onClick={() => openDrawer("list")}
              className="orbit-rise mt-4 text-sm text-fg-muted hover:text-fg"
              style={{ ["--rise-delay" as string]: "0.24s" }}
            >
              학습 기록 {planet.record_count}개 보기
            </button>

            {/* 위험 액션은 눈에 띄지 않게 맨 아래로 */}
            <button
              onClick={handleDelete}
              className="mt-12 text-xs text-fg-muted hover:text-danger"
            >
              이 행성 삭제
            </button>
          </div>
        ) : null}
      </Container>

      {/* 기록 드로어 — 목록 · 작성 · 읽기 통합 */}
      <RecordDrawer
        planetId={planetId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialMode={drawerMode}
        onChanged={loadPlanet}
      />
    </main>
  );
}
