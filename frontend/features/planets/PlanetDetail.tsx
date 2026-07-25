"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, PenLine } from "lucide-react";
import { Badge, Button, Container, Heading, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { TransitionLink } from "@/components/TransitionLink";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OrbitLoader } from "@/components/ui/OrbitLoader";
import { useRequireAuth } from "@/features/auth";
import { PlanetShowcase } from "@/features/planets/PlanetShowcase";
import { api } from "@/lib/api";
import { cachePlanet, getCachedPlanet } from "@/lib/planetCache";
import type { Planet as PlanetType } from "@/types/planet";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { difficultyDescription, difficultyLabel, requiredRecords } from "@/lib/utils/difficulty";
import { stageName } from "@/lib/utils/progress";
import { isFreshCompletion } from "@/lib/utils/celebration";

// 진행도가 100 까지 차오른 뒤 축하가 터지도록 하는 지연(진행도 보간 시간과 맞춤)
const CELEBRATE_DELAY_MS = 720;
// 축하 연출이 지속되는 시간
const CELEBRATE_DURATION_MS = 2600;

export function PlanetDetail({ planetId }: { planetId: number }) {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  // 캐시가 있으면 즉시 렌더(확대 전환의 모핑 대상 확보 + 로딩 깜빡임 제거)
  const [planet, setPlanet] = useState<PlanetType | null>(() => getCachedPlanet(planetId));
  const [loading, setLoading] = useState(() => getCachedPlanet(planetId) === null);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  // 기록 반영 펄스 (진행도가 오를 때 살짝 번쩍). token 이 바뀌면 다시 재생된다.
  const [pulse, setPulse] = useState<{ kind: "soft" | "stage"; token: number } | null>(null);
  const pulseToken = useRef(0);

  // "처음 완성되는 순간" 판정용: 서버 응답 직전까지 알고 있던 진행도.
  // (loadPlanet 이 캐시를 덮어쓰기 전에 마운트 시점의 캐시값을 붙잡아 둔다)
  const prevProgressRef = useRef<number | null>(
    getCachedPlanet(planetId)?.progress ?? null,
  );
  const celebratedRef = useRef(false); // 한 번만 재생
  const timers = useRef<number[]>([]);

  // 진행도는 부드럽게 보간 (숫자/바/행성 모두 이 값으로)
  const shownProgress = useAnimatedNumber(planet?.progress ?? 0);

  async function loadPlanet(showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fresh = await api.getPlanet(planetId);
      const prev = prevProgressRef.current;
      setPlanet(fresh);
      cachePlanet(fresh);
      prevProgressRef.current = fresh.progress;

      // 방금 100% 에 도달했고, 아직 축하하지 않았고, 모션 허용이면 연출.
      if (!celebratedRef.current && !reducedMotion && isFreshCompletion(prev, fresh.is_completed)) {
        celebratedRef.current = true;
        timers.current.push(
          window.setTimeout(() => setCelebrating(true), CELEBRATE_DELAY_MS),
          window.setTimeout(
            () => setCelebrating(false),
            CELEBRATE_DELAY_MS + CELEBRATE_DURATION_MS,
          ),
        );
      } else if (!reducedMotion && prev !== null && fresh.progress > prev && !fresh.is_completed) {
        // 100% 는 아니지만 진행도가 올랐다 → 절제된 펄스.
        // 단계 경계(25/50/75%)를 넘었으면 조금 더 눈에 띄게.
        const crossedStage = Math.floor(prev / 25) < Math.floor(fresh.progress / 25);
        pulseToken.current += 1;
        setPulse({ kind: crossedStage ? "stage" : "soft", token: pulseToken.current });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "행성을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    // effect 동기 구간에서 setState 하지 않도록 마이크로태스크로 넘긴다.
    let active = true;
    void Promise.resolve().then(() => {
      // 캐시로 이미 그려졌으면 로딩 표시 없이 조용히 갱신
      if (active) loadPlanet(getCachedPlanet(planetId) === null);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId, user]);

  // 언마운트 시 예약된 타이머 정리
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  async function handleDelete() {
    if (!confirm("이 행성을 삭제할까요? 기록도 함께 사라집니다.")) return;
    try {
      await api.deletePlanet(planetId);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  const recordsHref = `/planets/${planetId}/records`;

  return (
    <main className="min-h-dvh py-8">
      {/* 폭은 우주 지도(메인)와 동일하게 lg */}
      <Container size="lg">
        {/* 헤더 (로고 클릭 → 우주 지도) */}
        <Header className="mb-6" />

        {authLoading || loading ? (
          <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center">
            <OrbitLoader size={48} />
          </div>
        ) : error && !planet ? (
          <Text as="p" variant="body" className="text-danger">
            {error}
          </Text>
        ) : planet ? (
          // 세로 가운데 정렬 — 상단에만 몰리지 않게 남는 높이를 위아래로 나눈다
          <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center text-center">
            {/* 주인공: 큰 행성 (궤도 링 + 발광) */}
            <div className="orbit-rise">
              <PlanetShowcase
                progress={shownProgress}
                difficulty={planet.difficulty}
                isCompleted={planet.is_completed}
                size={260}
                viewTransitionName={`planet-${planet.id}`}
                celebrating={celebrating}
                seed={planet.id}
                pulse={pulse}
              />
            </div>

            {/* 이름/유형/단계 */}
            <div
              className="orbit-rise mt-4 flex flex-col items-center gap-2.5"
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
              className="orbit-rise mt-6 w-full max-w-sm"
              style={{ ["--rise-delay" as string]: "0.12s" }}
            >
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-fg-muted">진행도</span>
                <span className="font-medium text-fg">{Math.round(shownProgress)}%</span>
              </div>
              <ProgressBar value={shownProgress} />
              <Text variant="small" className="mt-2 text-fg-muted">
                {planet.is_completed
                  ? "테라포밍 완료 — 생명이 사는 행성이 되었습니다 🌍"
                  : `기록 ${planet.record_count}개 · 완성까지 ${Math.max(
                      0,
                      requiredRecords(planet.difficulty) - planet.record_count,
                    )}개 더`}
              </Text>
            </div>

            {/* 기록 진입점 — 작성(주) + 목록(부) */}
            <div
              className="orbit-rise mt-7 flex flex-col items-center gap-3"
              style={{ ["--rise-delay" as string]: "0.18s" }}
            >
              <TransitionLink href={`${recordsHref}/new`}>
                <Button variant="primary">
                  <span className="inline-flex items-center gap-1.5">
                    <PenLine size={16} aria-hidden />
                    학습 기록 작성
                  </span>
                </Button>
              </TransitionLink>
              <TransitionLink
                href={recordsHref}
                className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
              >
                <FileText size={14} aria-hidden />
                학습 기록 {planet.record_count}개 보기
              </TransitionLink>
            </div>

            {error && (
              <Text variant="small" as="p" className="mt-3 text-danger">
                {error}
              </Text>
            )}

            {/* 위험 액션은 눈에 띄지 않게 맨 아래로 */}
            <button
              onClick={handleDelete}
              className="mt-12 text-xs text-fg-muted transition-colors hover:text-danger"
            >
              이 행성 삭제
            </button>
          </div>
        ) : null}
      </Container>

      {/* 축하 메시지 — 상단에서 스르륵 내려오며 등장 (연출 중에만) */}
      {celebrating && (
        <div
          role="status"
          className="orbit-celebrate-msg pointer-events-none fixed left-1/2 top-24 z-30 flex -translate-x-1/2 flex-col items-center gap-1 rounded-2xl border border-brand/40 bg-surface/90 px-6 py-4 text-center shadow-[0_0_40px_-6px] shadow-brand/40 backdrop-blur-sm"
        >
          <span className="text-2xl" aria-hidden>
            🎉
          </span>
          <Heading level={2} className="text-brand">
            테라포밍 완료!
          </Heading>
          <Text variant="small" className="text-fg-body">
            생명이 사는 행성이 되었습니다
          </Text>
        </div>
      )}
    </main>
  );
}
