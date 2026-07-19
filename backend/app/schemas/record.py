"""Record 관련 Pydantic 스키마."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# 마크다운 원본 최대 길이 (긴 학습 글도 담되 무한정은 막는다)
CONTENT_MAX_LENGTH = 50_000


class RecordCreate(BaseModel):
    """학습 기록 생성 시 클라이언트가 보내는 데이터 (마크다운 원본)."""

    content: str = Field(
        ...,
        min_length=1,
        max_length=CONTENT_MAX_LENGTH,
        description="학습 기록 내용 (마크다운 원본)",
    )


class RecordResponse(BaseModel):
    """학습 기록 상세 — 마크다운 전문을 그대로 돌려준다."""

    id: int
    planet_id: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecordSummary(BaseModel):
    """학습 기록 목록용 축약본 — 전문 대신 순수 텍스트 미리보기만."""

    id: int
    planet_id: int
    preview: str = Field(..., description="마크다운 문법을 제거한 첫 줄 미리보기")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
