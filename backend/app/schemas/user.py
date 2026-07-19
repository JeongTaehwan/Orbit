"""User 관련 Pydantic 스키마 (응답용)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    """/auth/me 등에서 돌려주는 현재 사용자 정보."""

    id: int
    email: str
    name: str | None = None
    picture: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
