"""연속 학습(스트릭) 관련 Pydantic 스키마."""

from pydantic import BaseModel, Field


class StreakResponse(BaseModel):
    """현재 사용자의 스트릭 현황."""

    current_streak: int = Field(..., description="현재 연속 학습 일수 (끊겼으면 0)")
    longest_streak: int = Field(..., description="지금까지의 최장 연속 일수")
    today_logged: bool = Field(..., description="오늘(KST) 기록을 남겼는지")
