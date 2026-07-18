"""
services.calculate_progress 순수 함수 테스트.

DB도 API도 필요 없는 '순수 계산'이라 가장 빠르고 단순한 테스트.
"""

import pytest

from app.services.progress import calculate_progress


def test_easy_partial_progress():
    # easy는 5개 필요. 2개 → 40%
    assert calculate_progress(2, "easy") == (40.0, False)


def test_zero_records():
    assert calculate_progress(0, "hard") == (0.0, False)


def test_exactly_complete():
    # normal은 10개 필요. 10개 → 정확히 100%, 완료
    assert calculate_progress(10, "normal") == (100.0, True)


def test_progress_capped_at_100():
    # easy 5개 필요인데 10개 → 200%가 아니라 100%로 상한
    progress, is_completed = calculate_progress(10, "easy")
    assert progress == 100
    assert is_completed is True


@pytest.mark.parametrize(
    "count,difficulty,expected",
    [
        (1, "easy", 20.0),    # 1/5
        (5, "normal", 50.0),  # 5/10
        (10, "hard", 50.0),   # 10/20
    ],
)
def test_various_progress(count, difficulty, expected):
    progress, _ = calculate_progress(count, difficulty)
    assert progress == expected
