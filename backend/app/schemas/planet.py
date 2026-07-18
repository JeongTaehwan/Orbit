"""Planet 관련 Pydantic 스키마 + 난이도 도메인 상수."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class Difficulty(str, Enum):
    easy = "easy"
    normal = "normal"
    hard = "hard"


# 난이도별 완료에 필요한 기록 수 (progress 계산에 사용)
REQUIRED_RECORDS = {
    Difficulty.easy: 5,
    Difficulty.normal: 10,
    Difficulty.hard: 20,
}


class PlanetCreate(BaseModel):
    """행성 생성 시 클라이언트가 보내는 데이터."""

    name: str = Field(..., min_length=1, max_length=50, description="학습 주제 이름")
    difficulty: Difficulty


class PlanetResponse(BaseModel):
    """행성 조회 시 API가 돌려주는 데이터."""

    id: int
    name: str
    difficulty: Difficulty
    created_at: datetime

    # 계산값 (DB에 없음 → 엔드포인트에서 채워 전달)
    progress: float = Field(..., ge=0, le=100, description="진행률 % (0~100)")
    is_completed: bool

    model_config = ConfigDict(from_attributes=True)
