"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Container, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { useRequireAuth } from "@/features/auth";
import { api } from "@/lib/api";
import { cachePlanets, getCachedPlanets } from "@/lib/planetCache";
import { computeMapLayout } from "@/lib/utils/mapLayout";
import type { Planet } from "@/types/planet";
import { CreatePlanetForm } from "./CreatePlanetForm";
import { MapPlanet } from "./MapPlanet";

// 통계 타일
function Stat({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div
      className="orbit-rise flex flex-1 flex-col items-center rounded-lg border border-border bg-surface px-4 py-3"
      style={{ ["--rise-delay" as string]: `${delay}s` }}
    >
      <span className="text-2xl font-semibold text-fg">{value}</span>
      <span className="text-xs text-fg-muted">{label}</span>
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

  // 배치 영역 폭 측정 (반응형 scatter)
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(0);

  async function load(showLoading: boolean) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const list = await api.listPlanets();
      setPlanets(list);
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

  // 컨테이너 폭을 관찰해 배치를 다시 계산 (ResizeObserver 없으면 폴백 폭 사용)
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    setAreaWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => setAreaWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [user, loading]);

  const layout = useMemo(
    () => computeMapLayout(planets, areaWidth || 1024),
    [planets, areaWidth],
  );

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
    <main className="py-10">
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

        {/* 통계 */}
        <div className="mb-8 flex gap-3">
          <Stat label="행성" value={planets.length} delay={0} />
          <Stat label="총 기록" value={totalRecords} delay={0.05} />
          <Stat label="완성" value={completed} delay={0.1} />
        </div>

        {error && (
          <p className="mb-4 rounded bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* 우주 공간: 행성들이 흩어져 떠 있다 (카드 없음) */}
        {loading ? (
          <Text variant="muted">불러오는 중…</Text>
        ) : planets.length === 0 ? (
          <Text variant="muted">아직 행성이 없습니다. “새 행성 만들기”로 시작해 보세요.</Text>
        ) : (
          <div ref={areaRef} className="relative w-full" style={{ height: layout.height }}>
            {layout.items.map((item) => (
              <MapPlanet key={item.planet.id} item={item} />
            ))}
          </div>
        )}
      </Container>

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
