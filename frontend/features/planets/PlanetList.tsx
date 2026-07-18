"use client";

import { useEffect, useState } from "react";
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
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="학습 주제 이름"
          className="flex-1 rounded border px-3 py-2"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="rounded border px-2 py-2"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {creating ? "생성 중…" : "생성"}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">불러오는 중…</p>
      ) : planets.length === 0 ? (
        <p className="text-gray-500">아직 행성이 없습니다. 위에서 만들어 보세요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {planets.map((planet) => (
            <PlanetCard
              key={planet.id}
              planet={planet}
              onChanged={loadPlanets}
              onDelete={handleDelete}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </>
  );
}
