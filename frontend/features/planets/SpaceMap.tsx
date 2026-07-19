"use client";

import { useEffect, useState } from "react";
import { Button, Container, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { useRequireAuth } from "@/features/auth";
import { api } from "@/lib/api";
import type { Planet } from "@/types/planet";
import { CreatePlanetForm } from "./CreatePlanetForm";
import { PlanetMapCard } from "./PlanetMapCard";

// 통계 타일
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-surface px-4 py-3">
      <span className="text-2xl font-semibold text-fg">{value}</span>
      <span className="text-xs text-fg-muted">{label}</span>
    </div>
  );
}

// 우주 지도: 내 행성들을 모아 보는 메인 화면.
export function SpaceMap() {
  const { user, loading: authLoading } = useRequireAuth();
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPlanets(await api.listPlanets());
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  // 로그인 확인된 뒤에만 내 행성을 불러온다.
  useEffect(() => {
    if (user) load();
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
          <Stat label="행성" value={planets.length} />
          <Stat label="총 기록" value={totalRecords} />
          <Stat label="완성" value={completed} />
        </div>

        {error && (
          <p className="mb-4 rounded bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* 목록 */}
        {loading ? (
          <Text variant="muted">불러오는 중…</Text>
        ) : planets.length === 0 ? (
          <Text variant="muted">아직 행성이 없습니다. “새 행성 만들기”로 시작해 보세요.</Text>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {planets.map((planet) => (
              <PlanetMapCard key={planet.id} planet={planet} />
            ))}
          </div>
        )}
      </Container>

      {/* 새 행성 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="새 행성 만들기">
        <CreatePlanetForm
          onCreated={() => {
            setModalOpen(false);
            load();
          }}
        />
      </Modal>
    </main>
  );
}
