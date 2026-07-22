"""현재 사용자 기준 집계 엔드포인트. 인증 필수 — 항상 본인 것만."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_current_user, get_db
from app.services.streak import calculate_streak

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/streak", response_model=schemas.StreakResponse)
def get_streak(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """내 연속 학습 현황. 저장된 값이 아니라 기록 작성 시각들로 그때그때 계산한다."""
    # 기록 본문은 필요 없으므로 created_at 컬럼 하나만 가져온다.
    # (행성을 거쳐 내 기록만 걸러낸다 — Record 에는 user_id 가 없다)
    created_ats = (
        db.query(models.Record.created_at)
        .join(models.Planet, models.Record.planet_id == models.Planet.id)
        .filter(models.Planet.user_id == user.id)
        .all()
    )

    stats = calculate_streak(row[0] for row in created_ats)
    return schemas.StreakResponse(
        current_streak=stats.current_streak,
        longest_streak=stats.longest_streak,
        today_logged=stats.today_logged,
    )
