"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Planet } from "@/types/planet";

// 행성 카드: 기록 추가 입력을 자체 상태로 가짐
export function PlanetCard({
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
