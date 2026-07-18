/**
 * 행성 진행률 계산 (프론트엔드용).
 *
 * 백엔드 services.calculate_progress 와 동일한 규칙.
 * 화면에서 행성 카드의 진행률 바 등을 그릴 때 재사용한다.
 */

export type Difficulty = "easy" | "normal" | "hard";

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
  const progress = Math.min((recordCount / required) * 100, 100); // 100 초과 방지
  return { progress, isCompleted: progress >= 100 };
}
