import { describe, it, expect } from "vitest";
import { computeMapLayout } from "./mapLayout";
import type { Planet } from "@/types/planet";

const planet = (id: number): Planet => ({
  id,
  name: `p${id}`,
  difficulty: "easy",
  record_count: 1,
  progress: 20,
  is_completed: false,
  created_at: "2026-01-01T00:00:00Z",
});

const many = Array.from({ length: 12 }, (_, i) => planet(i + 1));

describe("computeMapLayout", () => {
  it("같은 입력엔 같은 위치 (결정적 — 새로고침해도 유지)", () => {
    const a = computeMapLayout(many, 1000);
    const b = computeMapLayout(many, 1000);
    expect(a).toEqual(b);
  });

  it("입력 순서가 달라도 같은 배치 (id 기준 안정)", () => {
    const a = computeMapLayout(many, 1000);
    const b = computeMapLayout([...many].reverse(), 1000);
    const key = (l: ReturnType<typeof computeMapLayout>) =>
      l.items.map((it) => [it.planet.id, it.x, it.y]).sort((x, y) => x[0] - y[0]);
    expect(key(a)).toEqual(key(b));
  });

  it("모든 행성이 컨테이너 폭 안에 있다 (화면 밖으로 안 나감)", () => {
    const width = 800;
    const { items } = computeMapLayout(many, width);
    for (const it of items) {
      expect(it.x).toBeGreaterThanOrEqual(0);
      expect(it.x).toBeLessThanOrEqual(width);
      expect(it.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("규칙적 격자가 아니다 (같은 열이라도 x 가 지터로 흩어짐)", () => {
    const xs = computeMapLayout(many, 1000).items.map((it) => Math.round(it.x));
    // 완전 격자라면 x 값 종류가 열 수만큼뿐 → 지터로 더 다양해야 함
    expect(new Set(xs).size).toBeGreaterThan(4);
  });

  it("행성이 없거나 폭이 0이면 빈 배치", () => {
    expect(computeMapLayout([], 1000).items).toHaveLength(0);
    expect(computeMapLayout(many, 0).items).toHaveLength(0);
  });
});
