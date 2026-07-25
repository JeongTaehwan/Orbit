import { describe, it, expect } from "vitest";
import {
  MIN_VIEW_RADIUS,
  STAR_RADIUS,
  computeOrbitSystem,
  fitDistance,
  maxViewDistance,
} from "./orbitSystem";
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

const list = (n: number) => Array.from({ length: n }, (_, i) => planet(i + 1));

describe("computeOrbitSystem", () => {
  it("같은 입력엔 같은 배치 (결정적 — 새로고침해도 유지)", () => {
    expect(computeOrbitSystem(list(6))).toEqual(computeOrbitSystem(list(6)));
  });

  it("입력 순서가 달라도 같은 배치 (id 기준 안정)", () => {
    const a = computeOrbitSystem(list(6));
    const b = computeOrbitSystem([...list(6)].reverse());
    expect(b).toEqual(a);
  });

  it("궤도 하나에 행성 하나", () => {
    for (const n of [1, 4, 12]) {
      const { bodies } = computeOrbitSystem(list(n));
      expect(bodies).toHaveLength(n);
      expect(new Set(bodies.map((b) => b.ring)).size).toBe(n);
      expect(new Set(bodies.map((b) => b.radius)).size).toBe(n);
    }
  });

  it("행성이 없으면 빈 배치", () => {
    expect(computeOrbitSystem([]).bodies).toHaveLength(0);
  });

  it("바깥으로 갈수록 반지름이 커진다", () => {
    const { bodies } = computeOrbitSystem(list(8));
    for (let i = 1; i < bodies.length; i++) {
      expect(bodies[i].radius).toBeGreaterThan(bodies[i - 1].radius);
    }
  });

  it("바깥으로 갈수록 궤도 간격이 넓어진다", () => {
    const { bodies } = computeOrbitSystem(list(8));
    const gaps = bodies.slice(1).map((b, i) => b.radius - bodies[i].radius);
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
    }
  });

  it("이웃 궤도 간격이 행성 지름보다 넓다 (서로 파고들지 않게)", () => {
    const { bodies } = computeOrbitSystem(list(12));
    for (let i = 1; i < bodies.length; i++) {
      const gap = bodies[i].radius - bodies[i - 1].radius;
      const touching = bodies[i].size + bodies[i - 1].size; // 두 반지름의 합
      expect(gap).toBeGreaterThan(touching);
    }
  });

  it("가장 안쪽 궤도도 항성 바깥에 있다", () => {
    const { bodies } = computeOrbitSystem(list(3));
    expect(bodies[0].radius - bodies[0].size).toBeGreaterThan(STAR_RADIUS);
  });

  it("바깥 궤도일수록 공전이 느리다", () => {
    const { bodies } = computeOrbitSystem(list(8));
    expect(bodies[7].duration).toBeGreaterThan(bodies[0].duration);
  });

  it("시작 각도가 흩어진다 (한 줄로 늘어서지 않게)", () => {
    const phases = computeOrbitSystem(list(10)).bodies.map((b) => b.phase);
    expect(new Set(phases.map((p) => Math.round(p))).size).toBeGreaterThan(3);
    for (const p of phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(Math.PI * 2);
    }
  });

  it("maxRadius 는 가장 바깥 궤도", () => {
    const { bodies, maxRadius } = computeOrbitSystem(list(5));
    expect(maxRadius).toBe(bodies[bodies.length - 1].radius);
  });
});

describe("fitDistance", () => {
  it("궤도계가 클수록 카메라가 멀어진다", () => {
    expect(fitDistance(60)).toBeGreaterThan(fitDistance(20));
  });

  it("행성이 적어도 빈 우주가 보이도록 최소 여백을 둔다", () => {
    // 행성 하나(반지름 2.6)여도 그 하나가 화면을 채우지 않는다
    const one = computeOrbitSystem(list(1)).maxRadius;
    expect(fitDistance(one)).toBe(fitDistance(MIN_VIEW_RADIUS));
    expect(fitDistance(one)).toBeGreaterThan(one * 3);
  });

  it("가장 바깥 궤도가 카메라 앞에 들어올 만큼은 떨어진다", () => {
    for (const r of [3, 10, 40]) {
      expect(fitDistance(r)).toBeGreaterThan(r);
    }
  });
});

describe("maxViewDistance", () => {
  it("초기 시점보다 훨씬 멀리까지 줌아웃할 수 있다", () => {
    for (const r of [3, 12, 40]) {
      expect(maxViewDistance(r)).toBeGreaterThan(fitDistance(r) * 2);
    }
  });

  it("궤도계가 커지면 줌아웃 한계도 따라 커진다", () => {
    expect(maxViewDistance(60)).toBeGreaterThan(maxViewDistance(20));
  });
});
