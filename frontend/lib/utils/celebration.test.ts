import { describe, it, expect } from "vitest";
import { isFreshCompletion } from "./celebration";

describe("isFreshCompletion", () => {
  it("99→100 처럼 미완성에서 완성으로 넘어가면 true (처음 완성)", () => {
    expect(isFreshCompletion(80, true)).toBe(true);
    expect(isFreshCompletion(99.9, true)).toBe(true);
    expect(isFreshCompletion(0, true)).toBe(true);
  });

  it("이미 100 이었으면 false (완성된 걸 다시 보는 것)", () => {
    expect(isFreshCompletion(100, true)).toBe(false);
  });

  it("이전 값이 없으면 false (직접 링크 — 오래전 완성한 행성)", () => {
    expect(isFreshCompletion(null, true)).toBe(false);
  });

  it("완성되지 않았으면 항상 false", () => {
    expect(isFreshCompletion(80, false)).toBe(false);
    expect(isFreshCompletion(null, false)).toBe(false);
    expect(isFreshCompletion(99, false)).toBe(false);
  });
});
