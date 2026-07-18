"""진행도 계산 비즈니스 로직."""

from app.schemas.planet import REQUIRED_RECORDS, Difficulty


def calculate_progress(record_count: int, difficulty: str) -> tuple[float, bool]:
    """기록 수 + 난이도로 진행률(%)과 완료 여부를 계산한다.

    progress = 기록 수 / 난이도별 필요 수 × 100 (최대 100)
    is_completed = progress >= 100
    """
    required = REQUIRED_RECORDS[Difficulty(difficulty)]
    progress = min(record_count / required * 100, 100)
    is_completed = progress >= 100
    return progress, is_completed
