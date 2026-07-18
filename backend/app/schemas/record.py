"""Record 관련 Pydantic 스키마."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
