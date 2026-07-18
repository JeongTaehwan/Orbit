"""
Orbit API - 비즈니스 로직 (계산 담당)

라우터(엔드포인트)에서 여러 번 쓰이는 "계산"을 여기 모아둔다.
라우터는 "요청/응답 흐름"에만 집중하고, 계산은 이 파일에 위임한다.
"""

from schemas import REQUIRED_RECORDS, Difficulty


def calculate_progress(record_count: int, difficulty: str) -> tuple[float, bool]:
    """기록 수 + 난이도로 진행률(%)과 완료 여부를 계산한다.

    progress = 기록 수 / 난이도별 필요 수 × 100 (최대 100)
    is_completed = progress >= 100
    """
    # DB에는 difficulty가 "easy" 같은 문자열로 저장돼 있으니 Enum으로 변환
    required = REQUIRED_RECORDS[Difficulty(difficulty)]

    progress = min(record_count / required * 100, 100)  # 100 초과 방지
    is_completed = progress >= 100
    return progress, is_completed
