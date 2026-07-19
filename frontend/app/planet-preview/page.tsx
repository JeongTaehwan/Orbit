"use client";

import { useState } from "react";
import { Badge, Container, Heading, Text } from "@usetaehwan/ui";
import { Planet } from "@/components/Planet";
import type { Difficulty } from "@/types/planet";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

// 진행도 → 단계 이름
function stageName(p: number): string {
  if (p >= 100) return "완성";
  if (p >= 75) return "생명 탄생";
  if (p >= 50) return "바다 출현";
  if (p >= 25) return "대기 생성";
  return "황량기";
}

export default function PlanetPreviewPage() {
  const [progress, setProgress] = useState(50);
  const [animate, setAnimate] = useState(true);

  return (
    <main className="py-10">
      <Container size="md">
        <Heading level={1} className="mb-1">
          행성 프리뷰
        </Heading>
        <Text variant="muted" className="mb-6">
          슬라이더로 진행도를 조절하면 세 난이도의 행성이 실시간으로 변합니다. (개발 확인용)
        </Text>

        {/* 컨트롤 */}
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Text as="span" variant="small" className="w-28 shrink-0">
              진행도 {progress}%
            </Text>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-brand"
              aria-label="진행도"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
              className="accent-brand"
            />
            <Text as="span" variant="small">
              자전 애니메이션
            </Text>
          </label>
          <Badge variant="brand">현재 단계: {stageName(progress)}</Badge>
        </div>

        {/* 세 난이도 나란히 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <div
              key={d}
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6"
            >
              <Planet progress={progress} difficulty={d} size={180} animate={animate} />
              <Text as="span" variant="small" className="text-fg">
                {d}
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
