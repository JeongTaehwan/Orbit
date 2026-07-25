"""
연속 학습(스트릭) 계산 비즈니스 로직.

진행도(progress)와 같은 원칙 — 스트릭을 저장하지 않고 기록의 작성 시각들로 매번 계산한다.
기록을 지우면 스트릭도 저절로 맞으므로 어긋난 상태가 존재할 수 없다.

DB 는 시각을 UTC 로 저장하지만 "며칠 연속"은 사용자가 사는 시간대(KST)의
자정을 기준으로 세야 한다. 그래서 계산 직전에 KST 로 변환해 '날짜'만 뽑아 쓴다.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

# 한국 표준시 (UTC+9). 서머타임이 없어 고정 오프셋으로 충분하다.
KST = timezone(timedelta(hours=9))

ONE_DAY = timedelta(days=1)


@dataclass(frozen=True)
class StreakStats:
    """스트릭 계산 결과 (순수 값 — Pydantic 스키마와는 별개)."""

    current_streak: int  # 현재 이어지고 있는 연속 일수
    longest_streak: int  # 지금까지의 최장 연속 일수
    today_logged: bool  # 오늘(KST) 기록을 남겼는지


def to_kst_date(dt: datetime) -> date:
    """저장된 시각을 KST 기준 '날짜'로 바꾼다.

    tzinfo 가 없는 값(naive)은 UTC 로 간주한다. PostgreSQL 은 timezone-aware 로
    돌려주지만 SQLite 는 tz 를 저장하지 못해 naive UTC 로 돌려주기 때문이다.
    (naive 를 그대로 astimezone 하면 파이썬이 '서버의 로컬 시간대'로 해석해버려
     서버 위치에 따라 결과가 달라진다 — 반드시 UTC 를 명시해야 한다)
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(KST).date()


def today_kst() -> date:
    """지금 이 순간의 KST 날짜."""
    return datetime.now(timezone.utc).astimezone(KST).date()


def calculate_streak(
    created_ats: Iterable[datetime],
    today: date | None = None,
) -> StreakStats:
    """기록 작성 시각들로 스트릭을 계산한다.

    today 를 넘기면 그 날짜를 '오늘'로 보고 계산한다(테스트용).

    같은 날 여러 번 기록해도 하루로 친다 → 집합으로 중복 날짜를 없앤 뒤
    정렬해서 이웃한 날짜의 간격이 1일인지만 확인한다. O(n log n).
    """
    today = today or today_kst()

    days = sorted({to_kst_date(ts) for ts in created_ats if ts is not None})
    if not days:
        return StreakStats(current_streak=0, longest_streak=0, today_logged=False)

    # ── 최장 연속: 앞에서부터 훑으며 끊길 때마다 다시 센다 ──
    longest = run = 1
    for prev, cur in zip(days, days[1:], strict=False):
        run = run + 1 if cur - prev == ONE_DAY else 1
        longest = max(longest, run)

    # ── 현재 연속: 마지막 기록일부터 거꾸로 ──
    # 마지막 기록이 오늘이면 진행 중, 어제면 "아직 안 했지만 살아있음",
    # 그보다 오래됐으면 이미 끊긴 것 → 0.
    last = days[-1]
    if last < today - ONE_DAY:
        current = 0
    else:
        current = 1
        i = len(days) - 1
        while i > 0 and days[i] - days[i - 1] == ONE_DAY:
            current += 1
            i -= 1

    return StreakStats(
        current_streak=current,
        longest_streak=longest,
        today_logged=days[-1] == today,
    )
