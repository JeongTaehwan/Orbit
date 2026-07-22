/** 연속 학습(스트릭) 현황 — 백엔드 schemas/streak.py 와 형태 일치. */
export interface Streak {
  current_streak: number; // 현재 연속 일수 (끊겼으면 0)
  longest_streak: number; // 최장 연속 일수
  today_logged: boolean; // 오늘(KST) 기록을 남겼는지
}
