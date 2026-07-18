/**
 * 행성 진행률 계산 (프론트엔드용).
 * 백엔드 services/progress.py 와 동일한 규칙.
 */

import type { Difficulty } from "@/types/planet";

/** 난이도별 완료에 필요한 기록 수 (백엔드 REQUIRED_RECORDS 와 일치) */
export const REQUIRED_RECORDS: Record<Difficulty, number> = {
  easy: 5,
  normal: 10,
  hard: 20,
};

export interface ProgressResult {
  progress: number; // 0 ~ 100
  isCompleted: boolean;
}

export function calculateProgress(
  recordCount: number,
  difficulty: Difficulty,
): ProgressResult {
  const required = REQUIRED_RECORDS[difficulty];
  const progress = Math.min((recordCount / required) * 100, 100);
  return { progress, isCompleted: progress >= 100 };
}
