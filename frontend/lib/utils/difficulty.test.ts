import { describe, it, expect } from "vitest";
import {
  DIFFICULTIES,
  DIFFICULTY_META,
  difficultyDescription,
  difficultyLabel,
  requiredRecords,
} from "./difficulty";

describe("difficulty 메타", () => {
  it("DB 값 → 세계관 라벨/필요 기록 수가 명세와 일치한다", () => {
    expect(difficultyLabel("easy")).toBe("암석 행성");
    expect(difficultyLabel("normal")).toBe("지구형 행성");
    expect(difficultyLabel("hard")).toBe("얼음 행성");
    expect(requiredRecords("easy")).toBe(5);
    expect(requiredRecords("normal")).toBe(10);
    expect(requiredRecords("hard")).toBe(20);
  });

  it("표시 순서는 easy → normal → hard", () => {
    expect(DIFFICULTIES).toEqual(["easy", "normal", "hard"]);
  });

  it("모든 유형에 설명이 있다", () => {
    for (const d of DIFFICULTIES) {
      expect(difficultyDescription(d)).toBe(DIFFICULTY_META[d].description);
      expect(difficultyDescription(d).length).toBeGreaterThan(0);
    }
  });
});
