"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Container, Heading, Input, Text } from "@usetaehwan/ui";
import { Header } from "@/components/Header";
import { Planet } from "@/components/Planet";
import { Drawer } from "@/components/ui/Drawer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRequireAuth } from "@/features/auth";
import { api } from "@/lib/api";
import type { LearningRecord, Planet as PlanetType } from "@/types/planet";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { stageName } from "@/lib/utils/progress";

export function PlanetDetail({ planetId }: { planetId: number }) {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [planet, setPlanet] = useState<PlanetType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // 진행도는 부드럽게 보간 (숫자/바/행성 모두 이 값으로)
  const shownProgress = useAnimatedNumber(planet?.progress ?? 0);

  async function loadPlanet() {
    setLoading(true);
    setError(null);
    try {
      setPlanet(await api.getPlanet(planetId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "행성을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadPlanet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId, user]);

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await api.addRecord(planetId, content.trim());
      setContent("");
      // 진행도 갱신 위해 행성 다시 조회 → shownProgress 가 부드럽게 오름
      setPlanet(await api.getPlanet(planetId));
      // 드로어가 열려 있으면 기록 목록도 새로고침
      if (drawerOpen) await loadRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "기록 추가 실패");
    } finally {
      setAdding(false);
    }
  }

  async function loadRecords() {
    setRecordsLoading(true);
    try {
      setRecords(await api.listRecords(planetId));
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }

  function openDrawer() {
    setDrawerOpen(true);
    loadRecords();
  }

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
            {/* 주인공: 큰 행성 */}
            <Planet progress={shownProgress} difficulty={planet.difficulty} size={260} animate />

            {/* 이름/난이도/단계 */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <Heading level={1}>{planet.name}</Heading>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{planet.difficulty}</Badge>
                <Badge variant="brand">{stageName(shownProgress)}</Badge>
              </div>
            </div>

            {/* 진행도 */}
            <div className="mt-5 w-full max-w-sm">
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

            {/* 기록 추가 */}
            <form onSubmit={handleAddRecord} className="mt-6 flex w-full max-w-sm gap-2">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘의 학습 기록"
                className="flex-1"
              />
              <Button type="submit" variant="primary" disabled={adding}>
                {adding ? "추가 중…" : "기록 추가"}
              </Button>
            </form>
            {error && (
              <Text variant="small" as="p" className="mt-2 text-danger">
                {error}
              </Text>
            )}

            {/* 기록은 평소엔 숨김 → 드로어로 열어서 봄 */}
            <button
              onClick={openDrawer}
              className="mt-4 text-sm text-fg-muted hover:text-fg"
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

      {/* 기록 드로어 */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="학습 기록">
        {recordsLoading ? (
          <Text variant="muted">불러오는 중…</Text>
        ) : records.length === 0 ? (
          <Text variant="muted">아직 기록이 없습니다.</Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((r) => (
              <li key={r.id} className="rounded border border-border bg-bg px-3 py-2">
                <Text as="p" variant="small" className="text-fg">
                  {r.content}
                </Text>
                <Text as="span" variant="small" className="text-fg-muted">
                  {new Date(r.created_at).toLocaleString("ko-KR")}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </main>
  );
}
