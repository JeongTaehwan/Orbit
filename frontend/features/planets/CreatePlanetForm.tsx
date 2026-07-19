"use client";

import { useState } from "react";
import { Button, Input } from "@usetaehwan/ui";
import { api } from "@/lib/api";
import type { Difficulty } from "@/types/planet";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

// 새 행성 생성 폼 (모달 안에서 사용). 성공 시 onCreated 호출.
export function CreatePlanetForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.createPlanet({ name: name.trim(), difficulty });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="학습 주제 이름"
        autoFocus
      />
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-fg"
        aria-label="난이도"
      >
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={creating}>
        {creating ? "생성 중…" : "행성 만들기"}
      </Button>
    </form>
  );
}
