import { describe, it, expect } from "vitest";
import { calculateProgress } from "./progress";

describe("calculateProgress", () => {
  it("easy 2개 → 40%, 미완료", () => {
    expect(calculateProgress(2, "easy")).toEqual({
      progress: 40,
      isCompleted: false,
    });
  });

  it("기록 0개 → 0%", () => {
    expect(calculateProgress(0, "hard")).toEqual({
      progress: 0,
      isCompleted: false,
    });
  });

  it("normal 10개 → 정확히 100%, 완료", () => {
    expect(calculateProgress(10, "normal")).toEqual({
      progress: 100,
      isCompleted: true,
    });
  });

  it("필요 수를 초과해도 100%를 넘지 않음", () => {
    const { progress, isCompleted } = calculateProgress(999, "easy");
    expect(progress).toBe(100);
    expect(isCompleted).toBe(true);
  });

  it.each([
    [1, "easy", 20],
    [5, "normal", 50],
    [10, "hard", 50],
  ] as const)("%i개 / %s → %i%%", (count, difficulty, expected) => {
    expect(calculateProgress(count, difficulty).progress).toBe(expected);
  });
});
