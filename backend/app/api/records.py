"""학습 기록(Record) 엔드포인트. 인증 필수 + 부모 행성이 본인 소유일 때만."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_current_user, get_db

router = APIRouter(prefix="/planets/{planet_id}/records", tags=["records"])


def _get_owned_planet(planet_id: int, user: models.User, db: Session) -> models.Planet:
    """내 소유 행성만 반환. 없거나 남의 것이면 404."""
    planet = db.get(models.Planet, planet_id)
    if planet is None or planet.user_id != user.id:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    return planet


@router.post("", response_model=schemas.RecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    planet_id: int,
    payload: schemas.RecordCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _get_owned_planet(planet_id, user, db)  # 소유 확인(아니면 404)
    record = models.Record(planet_id=planet_id, content=payload.content)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[schemas.RecordResponse])
def list_records(
    planet_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _get_owned_planet(planet_id, user, db)  # 소유 확인(아니면 404)
    return (
        db.query(models.Record)
        .filter(models.Record.planet_id == planet_id)
        .order_by(models.Record.created_at.desc())
        .all()
    )
