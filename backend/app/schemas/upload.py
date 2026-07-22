"""업로드 관련 Pydantic 스키마."""

from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    """업로드 성공 응답 — 프론트는 이 url 을 마크다운에 그대로 끼워 넣는다."""

    url: str = Field(..., description="업로드된 이미지의 https URL")
