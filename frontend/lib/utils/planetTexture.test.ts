import { describe, it, expect, beforeEach } from "vitest";
import { GLOW_EDGE, clearLandMaskCache, createGlowTexture, createLandMask } from "./planetTexture";

/**
 * jsdom 에는 canvas 2D 구현이 없어 getContext("2d") 가 null 이다.
 * 그래서 "브라우저가 아니어도 터지지 않고 null 을 돌려주는지"를 확인한다.
 * (실제 그림이 맞는지는 e2e/planet-preview.spec.ts 가 브라우저에서 확인)
 */
describe("planetTexture", () => {
  beforeEach(() => clearLandMaskCache());

  it("2D 컨텍스트가 없으면 예외 없이 null 을 돌려준다", () => {
    expect(() => createLandMask("easy")).not.toThrow();
    expect(createLandMask("easy")).toBeNull();
  });

  it("variant(행성 seed)를 받아도 예외 없이 동작한다", () => {
    // jsdom 에선 여전히 null 이지만, 인자 시그니처가 호환되는지 확인
    expect(() => createLandMask("easy", 7)).not.toThrow();
    expect(createLandMask("easy", 7)).toBeNull();
  });

  it("글로우 텍스처도 같은 규칙을 따른다", () => {
    expect(() => createGlowTexture()).not.toThrow();
    expect(createGlowTexture()).toBeNull();
  });

  it("글로우 평면은 행성보다 커서 링이 실루엣 밖으로 나온다", () => {
    expect(GLOW_EDGE).toBeGreaterThan(0);
    expect(GLOW_EDGE).toBeLessThan(0.5); // 0.5 = 텍스처 바깥 끝

    // PlanetScene 은 1×1 평면(반지름 0.5)을 scale = 1 / GLOW_EDGE 로 키운다.
    const planeRadius = (1 / GLOW_EDGE) * 0.5;

    // 행성 반지름은 1 — 평면이 이보다 작으면 글로우가 통째로 가려진다
    expect(planeRadius).toBeGreaterThan(1);

    // 행성 가장자리(반지름 1)가 텍스처 중심에서 정확히 GLOW_EDGE 에 오는지
    expect((1 / planeRadius) * 0.5).toBeCloseTo(GLOW_EDGE);
  });
});
