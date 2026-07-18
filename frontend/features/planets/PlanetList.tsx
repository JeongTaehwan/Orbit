"use client";

import { useEffect, useState } from "react";
import { Button, Input, Text } from "@usetaehwan/ui";
import { api } from "@/lib/api";
import type { Difficulty, Planet } from "@/types/planet";
import { PlanetCard } from "./PlanetCard";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

// 행성 목록 + 생성 폼. 화면의 주요 상태를 관리한다.
export function PlanetList() {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [creating, setCreating] = useState(false);

  async function loadPlanets() {
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

  useEffect(() => {
    loadPlanets();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.createPlanet({ name: name.trim(), difficulty });
      setName("");
      setDifficulty("easy");
      await loadPlanets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await api.deletePlanet(id);
      await loadPlanets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  return (
    <>
      {/* 새 행성 생성 폼 */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="학습 주제 이름"
          className="flex-1"
        />
        {/* 패키지에 Select 컴포넌트가 없어 네이티브 select 를 토큰 유틸리티로 스타일링 */}
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <Button type="submit" variant="primary" disabled={creating}>
          {creating ? "생성 중…" : "생성"}
        </Button>
      </form>

      {error && (
        <Text variant="small" as="p" className="mb-4 text-danger">
          {error}
        </Text>
      )}

      {loading ? (
        <Text variant="muted">불러오는 중…</Text>
      ) : planets.length === 0 ? (
        <Text variant="muted">아직 행성이 없습니다. 위에서 만들어 보세요.</Text>
      ) : (
        <div className="flex flex-col gap-3">
          {planets.map((planet) => (
            <PlanetCard
              key={planet.id}
              planet={planet}
              onChanged={loadPlanets}
              onDelete={handleDelete}
              onError={setError}
            />
          ))}
        </div>
      )}
    </>
  );
}
