"""
Orbit API - Pydantic 스키마 정의

이 파일은 "데이터의 모양(shape)"만 정의합니다.
- API로 들어오는 요청(request) 데이터의 형태
- API가 내보내는 응답(response) 데이터의 형태

DB 테이블 정의(models.py)와는 별개입니다. (다음 단계)
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Enum: 난이도는 정해진 3개 값만 허용
# ---------------------------------------------------------------------------
class Difficulty(str, Enum):
    easy = "easy"
    normal = "normal"
    hard = "hard"


# 난이도별 "완료에 필요한 기록 수" (progress 계산에 사용)
REQUIRED_RECORDS = {
    Difficulty.easy: 5,
    Difficulty.normal: 10,
    Difficulty.hard: 20,
}


# ---------------------------------------------------------------------------
# Planet 스키마
# ---------------------------------------------------------------------------
class PlanetCreate(BaseModel):
    """행성 생성 시 클라이언트가 보내는 데이터."""

    name: str = Field(..., min_length=1, max_length=50, description="학습 주제 이름")
    difficulty: Difficulty


class PlanetResponse(BaseModel):
    """행성 조회 시 API가 돌려주는 데이터."""

    # DB에 저장되는 값
    id: int
    name: str
    difficulty: Difficulty
    created_at: datetime

    # 계산으로 구하는 값 (DB에 없음 → 엔드포인트에서 채워서 전달)
    progress: float = Field(..., ge=0, le=100, description="진행률 % (0~100)")
    is_completed: bool

    # ORM 객체(DB row)를 바로 이 스키마로 변환할 수 있게 허용
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Record 스키마
# ---------------------------------------------------------------------------
class RecordCreate(BaseModel):
    """학습 기록 생성 시 클라이언트가 보내는 데이터."""

    content: str = Field(..., min_length=1, description="학습 기록 내용")


class RecordResponse(BaseModel):
    """학습 기록 조회 시 API가 돌려주는 데이터."""

    id: int
    planet_id: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
