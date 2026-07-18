"use client"; // 상태(useState)와 이벤트 핸들러를 쓰므로 클라이언트 컴포넌트

import { useEffect, useState } from "react";
import { api, type Difficulty, type Planet } from "@/lib/api";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export default function Home() {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 새 행성 폼 상태
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [creating, setCreating] = useState(false);

  // 행성 목록 불러오기
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

  // 최초 렌더 시 한 번 로드
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
      await loadPlanets(); // 목록 갱신
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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Orbit</h1>
      <p className="mb-6 text-sm text-gray-500">프론트-백엔드 연결 확인용 화면</p>

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

      {/* 에러 표시 */}
      {error && (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* 목록 / 로딩 / 빈 상태 */}
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
    </main>
  );
}

// --- 행성 카드: 기록 추가 입력을 자체 상태로 가짐 ---
function PlanetCard({
  planet,
  onChanged,
  onDelete,
  onError,
}: {
  planet: Planet;
  onChanged: () => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);
    try {
      await api.addRecord(planet.id, content.trim());
      setContent("");
      await onChanged(); // 진행도 갱신 위해 목록 다시 로드
    } catch (e) {
      onError(e instanceof Error ? e.message : "기록 추가 실패");
    } finally {
      setAdding(false);
    }
  }

  return (
    <li className="rounded border p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium">{planet.name}</span>
          <span className="ml-2 text-xs text-gray-500">[{planet.difficulty}]</span>
          {planet.is_completed && (
            <span className="ml-2 text-xs text-green-600">✓ 완료</span>
          )}
        </div>
        <button
          onClick={() => onDelete(planet.id)}
          className="text-sm text-red-600 hover:underline"
        >
          삭제
        </button>
      </div>

      {/* 진행도 바 */}
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div
          className="h-2 rounded bg-blue-500"
          style={{ width: `${planet.progress}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        진행도 {Math.round(planet.progress)}%
      </p>

      {/* 기록 추가 */}
      <form onSubmit={handleAddRecord} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="학습 기록 내용"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {adding ? "추가 중…" : "기록 추가"}
        </button>
      </form>
    </li>
  );
}
