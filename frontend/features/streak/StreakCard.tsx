/**
 * 연속 학습(스트릭) — 우주 지도 통계 영역의 핵심 지표(hero).
 *
 * 다른 통계(행성·총기록·완성)보다 크게, 브랜드 색으로 강조한다.
 * 상태에 따라 문구가 달라진다:
 *  - 오늘 기록함        : 🔥 크게 + 브랜드 발광 / "최장 N일"
 *  - 오늘 아직 안 함     : 불꽃 흐리게 + "오늘 기록하면 N+1일" (이어가도록 유도)
 *  - 끊김(0일)          : "오늘 기록하면 다시 1일"
 *  - 기록이 아예 없음    : "오늘 첫 기록을 남겨보세요"
 */

import type { Streak } from "@/types/streak";

export function StreakCard({ streak }: { streak: Streak }) {
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
      className={`orbit-rise flex items-center gap-4 rounded-2xl border px-5 py-4 ${
        today
          ? "border-brand/40 bg-brand-subtle/40 shadow-[0_0_28px_-8px] shadow-brand/40"
          : "border-border bg-surface"
      }`}
    >
      {/* 불꽃 — 오늘 기록했으면 타오르듯 일렁이고, 안 했으면 흐리게(꺼질 수 있다는 신호) */}
      <span
        aria-hidden
        className={`text-4xl leading-none ${today ? "orbit-flame" : "opacity-40 grayscale"}`}
      >
        🔥
      </span>
      <div className="flex flex-col">
        <span className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold leading-none text-fg">{current}</span>
          <span className="text-sm text-fg-muted">일 연속</span>
        </span>
        <span className="mt-0.5 text-xs text-fg-muted">연속 학습(일)</span>
        <span className={`mt-1 text-xs ${today ? "text-fg-muted" : "text-brand"}`}>{hint}</span>
      </div>
    </div>
  );
}
