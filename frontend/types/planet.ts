/**
 * 도메인 공용 타입 (백엔드 schemas 와 형태 일치).
 * 화면·API·유틸 어디서나 여기서 import 한다.
 */

export type Difficulty = "easy" | "normal" | "hard";

export interface Planet {
  id: number;
  name: string;
  difficulty: Difficulty;
  progress: number; // 0 ~ 100
  is_completed: boolean;
  created_at: string; // ISO 문자열
}

// TS 내장 유틸 타입 Record<K,V> 와 겹치지 않도록 LearningRecord 로 명명
export interface LearningRecord {
  id: number;
  planet_id: number;
  content: string;
  created_at: string;
}
