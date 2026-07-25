"""
연속 학습(스트릭) 테스트.

앞부분은 DB 없이 도는 순수 계산 테스트, 뒷부분은 /me/streak 엔드포인트 통합 테스트.
"""

from datetime import date, datetime, timedelta, timezone

import pytest

from app.services.streak import KST, StreakStats, calculate_streak, to_kst_date

TODAY = date(2026, 7, 22)


def utc(y, m, d, hh=0, mm=0) -> datetime:
    """UTC 로 저장된 시각 (PostgreSQL 이 돌려주는 형태 — tz 있음)."""
    return datetime(y, m, d, hh, mm, tzinfo=timezone.utc)


def days_ago(n: int, hh=12) -> datetime:
    """TODAY 기준 n일 전의 KST 낮 12시 → UTC 로 환산한 값."""
    d = TODAY - timedelta(days=n)
    return datetime(d.year, d.month, d.day, hh, tzinfo=KST).astimezone(timezone.utc)


# ────────────────────── 순수 계산 ──────────────────────


def test_no_records():
    assert calculate_streak([], today=TODAY) == StreakStats(0, 0, False)


def test_only_today():
    """첫날 — 오늘 하나 남기면 1일."""
    assert calculate_streak([days_ago(0)], today=TODAY) == StreakStats(1, 1, True)


def test_consecutive_days_increase_streak():
    """3일 연속 기록 → 3일."""
    records = [days_ago(2), days_ago(1), days_ago(0)]
    assert calculate_streak(records, today=TODAY) == StreakStats(3, 3, True)


def test_same_day_multiple_records_count_once():
    """하루에 여러 번 기록해도 하루로 친다."""
    records = [days_ago(0, hh=9), days_ago(0, hh=14), days_ago(0, hh=23)]
    assert calculate_streak(records, today=TODAY) == StreakStats(1, 1, True)


def test_gap_breaks_streak():
    """하루 걸러 기록 → 연속이 아니다 (각각 1일)."""
    records = [days_ago(4), days_ago(2), days_ago(0)]
    assert calculate_streak(records, today=TODAY) == StreakStats(1, 1, True)


def test_streak_survives_when_yesterday_was_last():
    """오늘 아직 안 했어도 어제까지 이어졌으면 스트릭은 살아있다."""
    records = [days_ago(2), days_ago(1)]
    stats = calculate_streak(records, today=TODAY)
    assert stats == StreakStats(current_streak=2, longest_streak=2, today_logged=False)


def test_streak_dies_after_two_days_idle():
    """그저께가 마지막이면 어제 하루를 통째로 걸렀으므로 끊긴다."""
    records = [days_ago(3), days_ago(2)]
    stats = calculate_streak(records, today=TODAY)
    assert stats.current_streak == 0
    assert stats.longest_streak == 2  # 과거 기록은 남는다
    assert stats.today_logged is False


def test_longest_streak_kept_from_the_past():
    """현재는 끊겼어도 과거 최장 기록은 유지된다."""
    past = [days_ago(n) for n in (20, 19, 18, 17)]  # 4일 연속
    recent = [days_ago(1), days_ago(0)]  # 2일 연속
    stats = calculate_streak(past + recent, today=TODAY)
    assert stats == StreakStats(current_streak=2, longest_streak=4, today_logged=True)


def test_unordered_input():
    """입력 순서가 뒤죽박죽이어도 결과는 같다."""
    records = [days_ago(0), days_ago(3), days_ago(1), days_ago(2)]
    assert calculate_streak(records, today=TODAY) == StreakStats(4, 4, True)


def test_longest_when_current_is_longer():
    """현재 진행 중인 연속이 최장이면 둘이 같다."""
    records = [days_ago(n) for n in (10, 4, 3, 2, 1, 0)]
    assert calculate_streak(records, today=TODAY) == StreakStats(5, 5, True)


# ────────────────────── KST 경계 ──────────────────────


def test_kst_date_conversion():
    """UTC 15:00 = KST 자정 → 다음 날로 넘어간다."""
    assert to_kst_date(utc(2026, 7, 21, 15, 0)) == date(2026, 7, 22)
    assert to_kst_date(utc(2026, 7, 21, 14, 59)) == date(2026, 7, 21)


def test_naive_datetime_is_treated_as_utc():
    """tz 없는 값(SQLite)도 UTC 로 보고 변환한다 — 서버 시간대에 흔들리지 않게."""
    naive = datetime(2026, 7, 21, 15, 0)  # tzinfo 없음
    assert to_kst_date(naive) == date(2026, 7, 22)


def test_kst_midnight_boundary_makes_two_days():
    """UTC 로는 같은 날(7/21)이지만 KST 로는 21일과 22일 → 연속 2일."""
    records = [utc(2026, 7, 21, 14, 30), utc(2026, 7, 21, 15, 30)]
    assert calculate_streak(records, today=TODAY) == StreakStats(2, 2, True)


def test_late_night_kst_is_still_today():
    """KST 23:59 에 남긴 기록은 그날로 친다 (UTC 로는 14:59, 같은 날)."""
    late = datetime(2026, 7, 22, 23, 59, tzinfo=KST).astimezone(timezone.utc)
    assert calculate_streak([late], today=TODAY) == StreakStats(1, 1, True)


def test_early_morning_kst_is_a_new_day():
    """KST 00:01 은 새 날 — UTC 로는 전날 15:01 이지만 오늘로 센다."""
    early = datetime(2026, 7, 22, 0, 1, tzinfo=KST).astimezone(timezone.utc)
    assert early.astimezone(timezone.utc).day == 21  # UTC 로는 전날임을 확인
    assert calculate_streak([early], today=TODAY) == StreakStats(1, 1, True)


# ────────────────────── 엔드포인트 ──────────────────────


def _make_planet(client):
    return client.post("/planets", json={"name": "P", "difficulty": "easy"}).json()["id"]


def _add_record_at(client, planet_id: int, when: datetime) -> int:
    """기록을 만든 뒤 created_at 을 원하는 시각으로 바꾼다 (과거 날짜 시나리오용)."""
    from app.models import Record
    from tests.conftest import TestingSessionLocal

    rec_id = client.post(f"/planets/{planet_id}/records", json={"content": "x"}).json()["id"]
    db = TestingSessionLocal()
    try:
        db.get(Record, rec_id).created_at = when
        db.commit()
    finally:
        db.close()
    return rec_id


def test_streak_endpoint_requires_login(anon_client):
    assert anon_client.get("/me/streak").status_code == 401


def test_streak_endpoint_empty(client):
    assert client.get("/me/streak").json() == {
        "current_streak": 0,
        "longest_streak": 0,
        "today_logged": False,
    }


def test_streak_endpoint_counts_consecutive_days(client):
    planet_id = _make_planet(client)
    now = datetime.now(timezone.utc)
    for n in (2, 1, 0):
        _add_record_at(client, planet_id, now - timedelta(days=n))

    body = client.get("/me/streak").json()
    assert body["current_streak"] == 3
    assert body["longest_streak"] == 3
    assert body["today_logged"] is True


def test_streak_endpoint_ignores_other_users_records(client):
    """남의 기록은 내 스트릭에 섞이지 않는다."""
    other_planet = _make_planet(client)  # user 1 소유
    now = datetime.now(timezone.utc)
    _add_record_at(client, other_planet, now)

    client.current["id"] = 2  # 다른 사용자로 전환
    body = client.get("/me/streak").json()
    assert body == {"current_streak": 0, "longest_streak": 0, "today_logged": False}


def test_streak_endpoint_drops_when_record_deleted(client):
    """기록을 지우면 스트릭도 따라 줄어든다 (저장하지 않고 계산하기 때문)."""
    planet_id = _make_planet(client)
    now = datetime.now(timezone.utc)
    _add_record_at(client, planet_id, now - timedelta(days=1))
    today_rec = _add_record_at(client, planet_id, now)
    assert client.get("/me/streak").json()["current_streak"] == 2

    client.delete(f"/planets/{planet_id}/records/{today_rec}")

    body = client.get("/me/streak").json()
    assert body["current_streak"] == 1  # 어제 것만 남아 여전히 살아있음
    assert body["today_logged"] is False


@pytest.mark.parametrize("gap_days", [2, 3, 10])
def test_streak_endpoint_broken_by_gap(client, gap_days):
    planet_id = _make_planet(client)
    now = datetime.now(timezone.utc)
    _add_record_at(client, planet_id, now - timedelta(days=gap_days))

    body = client.get("/me/streak").json()
    assert body["current_streak"] == 0
    assert body["longest_streak"] == 1
