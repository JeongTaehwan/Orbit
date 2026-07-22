import { describe, it, expect } from "vitest";
import {
  PLANET_PALETTE,
  mixHex,
  planetVisual,
  smoothstep,
  sphereSegments,
} from "./planet3d";

describe("mixHex", () => {
  it("t=0 이면 앞 색, t=1 이면 뒤 색", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("중간값은 두 색의 절반", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("범위를 벗어난 t 는 잘라낸다", () => {
    expect(mixHex("#000000", "#ffffff", -1)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 2)).toBe("#ffffff");
  });

  it("채널별로 따로 섞는다", () => {
    expect(mixHex("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });
});

describe("smoothstep", () => {
  it("구간 밖은 0 또는 1 로 고정", () => {
    expect(smoothstep(20, 60, 0)).toBe(0);
    expect(smoothstep(20, 60, 100)).toBe(1);
  });

  it("정중앙은 0.5", () => {
    expect(smoothstep(20, 60, 40)).toBeCloseTo(0.5);
  });

  it("단조 증가한다", () => {
    const values = [0, 25, 50, 75, 100].map((p) => smoothstep(20, 80, p));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });
});

describe("planetVisual", () => {
  it("진행도 0 이면 암석색 그대로 (바다 없음)", () => {
    const v = planetVisual(0, "normal");
    expect(v.surface).toBe(PLANET_PALETTE.normal.rock);
    expect(v.atmosphereOpacity).toBe(0);
  });

  it("진행도 100 이면 바다색 + 식생색", () => {
    const v = planetVisual(100, "normal");
    expect(v.surface).toBe(PLANET_PALETTE.normal.ocean);
    expect(v.land).toBe(PLANET_PALETTE.normal.veg);
  });

  it("중간 진행도는 두 색 사이 어딘가 (뚝 끊기지 않는다)", () => {
    const v = planetVisual(60, "normal");
    expect(v.surface).not.toBe(PLANET_PALETTE.normal.rock);
    expect(v.surface).not.toBe(PLANET_PALETTE.normal.ocean);
  });

  it("진행도가 오르면 지표색이 조금씩 이어서 변한다", () => {
    const seen = [40, 50, 60, 70, 80].map((p) => planetVisual(p, "normal").surface);
    expect(new Set(seen).size).toBeGreaterThan(3); // 계단이 아니라 연속적으로 변함
  });

  it("대기는 18~48% 구간에 걸쳐 짙어지고 그 뒤로 유지된다", () => {
    expect(planetVisual(10, "easy").atmosphereOpacity).toBe(0); // 아직 형성 전
    expect(planetVisual(30, "easy").atmosphereOpacity).toBeGreaterThan(0); // 형성 중
    expect(planetVisual(48, "easy").atmosphereOpacity).toBeGreaterThan(
      planetVisual(30, "easy").atmosphereOpacity,
    );
    // 48% 에서 이미 최대 — 그 뒤는 바다·식생이 이어받는다
    expect(planetVisual(100, "easy").atmosphereOpacity).toBe(
      planetVisual(48, "easy").atmosphereOpacity,
    );
  });

  it("난이도마다 색조가 다르다 (따뜻/표준/차가운)", () => {
    const colors = (["easy", "normal", "hard"] as const).map(
      (d) => planetVisual(100, d).surface,
    );
    expect(new Set(colors).size).toBe(3);
  });

  it("범위를 벗어난 진행도도 안전하게 처리한다", () => {
    expect(planetVisual(-50, "hard").surface).toBe(PLANET_PALETTE.hard.rock);
    expect(planetVisual(999, "hard").surface).toBe(PLANET_PALETTE.hard.ocean);
  });

  it("대륙은 항상 어느 정도 보이고 바다가 차오를수록 또렷해진다", () => {
    expect(planetVisual(0, "normal").landAmount).toBeGreaterThan(0);
    expect(planetVisual(100, "normal").landAmount).toBeGreaterThan(
      planetVisual(0, "normal").landAmount,
    );
    expect(planetVisual(100, "normal").landAmount).toBeLessThanOrEqual(1);
  });
});

describe("sphereSegments", () => {
  it("작을수록 적게 쪼갠다 (지도 썸네일용)", () => {
    expect(sphereSegments(48)).toBeLessThan(sphereSegments(180));
  });

  it("항상 짝수 — 가로/세로 분할에 절반을 쓰기 때문", () => {
    for (const size of [40, 64, 120, 160, 200, 400]) {
      expect(sphereSegments(size) % 2).toBe(0);
    }
  });
});
