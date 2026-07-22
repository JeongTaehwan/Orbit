/**
 * 연속 학습(스트릭) 타일 — 우주 지도 상단 통계 영역에 놓인다.
 *
 * 상태에 따라 문구가 달라진다:
 *  - 오늘 기록함        : 🔥 N일 연속 / 최장 N일
 *  - 오늘 아직 안 함     : 불꽃을 흐리게 + "오늘 기록하면 N+1일" (이어가도록 유도)
 *  - 끊김(0일)          : "오늘 기록하면 다시 1일"
 *  - 기록이 아예 없음    : "오늘 첫 기록을 남겨보세요"
 */

import type { Streak } from "@/types/streak";

interface Props {
  streak: Streak;
  delay?: number;
}

export function StreakCard({ streak, delay = 0 }: Props) {
  const { current_streak: current, longest_streak: longest, today_logged: today } = streak;

  const started = current > 0 || longest > 0;

  // 보조 문구 — 오늘 안 했으면 "이어가기"를 권한다
  let hint: string;
  if (today) {
    hint = `최장 ${longest}일`;
  } else if (current > 0) {
    hint = `오늘 기록하면 ${current + 1}일`;
  } else if (started) {
    hint = `오늘 기록하면 다시 1일 · 최장 ${longest}일`;
  } else {
    hint = "오늘 첫 기록을 남겨보세요";
  }

  return (
    <div
      className="orbit-rise flex flex-1 flex-col items-center rounded-lg border border-border bg-surface px-4 py-3"
      style={{ ["--rise-delay" as string]: `${delay}s` }}
    >
      <span className="flex items-baseline gap-1">
        {/* 오늘 아직 안 했으면 불꽃을 흐리게 — "꺼질 수 있다"는 신호 */}
        <span aria-hidden className={today ? "" : "opacity-40"}>
          🔥
        </span>
        <span className="text-2xl font-semibold text-fg">{current}</span>
      </span>
      <span className="text-xs text-fg-muted">연속 학습(일)</span>
      <span className={`mt-0.5 text-xs ${today ? "text-fg-muted" : "text-brand"}`}>{hint}</span>
    </div>
  );
}
