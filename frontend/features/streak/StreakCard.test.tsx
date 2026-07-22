import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakCard } from "./StreakCard";
import type { Streak } from "@/types/streak";

const streak = (over: Partial<Streak> = {}): Streak => ({
  current_streak: 3,
  longest_streak: 7,
  today_logged: true,
  ...over,
});

describe("StreakCard", () => {
  it("오늘 기록했으면 연속 일수와 최장 기록을 보여준다", () => {
    render(<StreakCard streak={streak({ current_streak: 3, longest_streak: 7 })} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("연속 학습(일)")).toBeInTheDocument();
    expect(screen.getByText("최장 7일")).toBeInTheDocument();
  });

  it("오늘 아직 안 했으면 이어가도록 유도한다", () => {
    render(<StreakCard streak={streak({ current_streak: 4, today_logged: false })} />);

    expect(screen.getByText("4")).toBeInTheDocument(); // 스트릭은 아직 살아있다
    expect(screen.getByText("오늘 기록하면 5일")).toBeInTheDocument();
  });

  it("스트릭이 끊겼으면 다시 시작하도록 안내한다", () => {
    render(
      <StreakCard streak={streak({ current_streak: 0, longest_streak: 9, today_logged: false })} />,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/오늘 기록하면 다시 1일/)).toBeInTheDocument();
    expect(screen.getByText(/최장 9일/)).toBeInTheDocument();
  });

  it("기록이 하나도 없으면 첫 기록을 권한다", () => {
    render(
      <StreakCard streak={streak({ current_streak: 0, longest_streak: 0, today_logged: false })} />,
    );

    expect(screen.getByText("오늘 첫 기록을 남겨보세요")).toBeInTheDocument();
    expect(screen.queryByText(/최장/)).not.toBeInTheDocument();
  });

  it("첫날(1일차)도 자연스럽게 표시된다", () => {
    render(
      <StreakCard streak={streak({ current_streak: 1, longest_streak: 1, today_logged: true })} />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("최장 1일")).toBeInTheDocument();
  });
});
