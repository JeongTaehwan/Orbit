"use client";

import { useState } from "react";
import { Badge, Button, Card, Heading, Input, Text } from "@usetaehwan/ui";
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
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Heading level={3}>{planet.name}</Heading>
          <Badge variant="neutral">{planet.difficulty}</Badge>
          {planet.is_completed && <Badge variant="brand">완료</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(planet.id)}>
          삭제
        </Button>
      </div>

      {/* 진행도 바 (토큰 유틸리티만: 트랙 brand-subtle, 채움 brand) */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-subtle">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${planet.progress}%` }}
        />
      </div>
      <Text variant="small" as="p" className="mt-1 text-fg-muted">
        진행도 {Math.round(planet.progress)}%
      </Text>

      {/* 기록 추가 */}
      <form onSubmit={handleAddRecord} className="mt-3 flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="학습 기록 내용"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={adding}>
          {adding ? "추가 중…" : "기록 추가"}
        </Button>
      </form>
    </Card>
  );
}
