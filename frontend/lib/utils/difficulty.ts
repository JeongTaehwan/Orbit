/**
 * 난이도(DB 값 easy/normal/hard)의 세계관 표시 정보.
 *
 * DB 값은 그대로 두고 화면 라벨만 여기서 관리한다.
 * 필요 기록 수는 백엔드 REQUIRED_RECORDS / progress.ts 와 일치해야 한다.
 * 색(--color-planet-*)도 이 유형에 정확히 대응한다(갈색/표준/푸른).
 */

import type { Difficulty } from "@/types/planet";

export interface DifficultyMeta {
  /** 유형 이름 (배지·목록·상세에 표시) */
  label: string;
  /** 완성에 필요한 기록 수 */
  requiredRecords: number;
  /** 상세 화면용 짧은 설명 한 줄 */
  description: string;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: {
    label: "암석 행성",
    requiredRecords: 5,
    description: "갓 태어난 따뜻한 갈색 암석 세계 — 가볍게 시작하기 좋아요.",
  },
  normal: {
    label: "지구형 행성",
    requiredRecords: 10,
    description: "균형 잡힌 표준 지구형 세계 — 꾸준함이 열쇠예요.",
  },
  hard: {
    label: "얼음 행성",
    requiredRecords: 20,
    description: "차갑고 푸른 얼음 세계 — 긴 여정을 각오하세요.",
  },
};

/** 선택 UI 등에서 쓰는 표시 순서 */
export const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export function difficultyLabel(d: Difficulty): string {
  return DIFFICULTY_META[d].label;
}

export function requiredRecords(d: Difficulty): number {
  return DIFFICULTY_META[d].requiredRecords;
}

export function difficultyDescription(d: Difficulty): string {
  return DIFFICULTY_META[d].description;
}
