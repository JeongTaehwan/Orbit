"""학습 기록(Record) 엔드포인트. 인증 필수 + 부모 행성이 본인 소유일 때만."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_current_user, get_db
from app.services.markdown import to_preview

router = APIRouter(prefix="/planets/{planet_id}/records", tags=["records"])


def _get_owned_planet(planet_id: int, user: models.User, db: Session) -> models.Planet:
    """내 소유 행성만 반환. 없거나 남의 것이면 404."""
    planet = db.get(models.Planet, planet_id)
    if planet is None or planet.user_id != user.id:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    return planet


def _get_record(planet_id: int, record_id: int, db: Session) -> models.Record:
    """행성에 속한 기록만 반환. 없거나 다른 행성 것이면 404."""
    record = db.get(models.Record, record_id)
    if record is None or record.planet_id != planet_id:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return record


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


@router.get("", response_model=list[schemas.RecordSummary])
def list_records(
    planet_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """목록은 전문 대신 순수 텍스트 미리보기만 내려 가볍게 유지한다."""
    _get_owned_planet(planet_id, user, db)  # 소유 확인(아니면 404)
    records = (
        db.query(models.Record)
        .filter(models.Record.planet_id == planet_id)
        .order_by(models.Record.created_at.desc())
        .all()
    )
    return [
        schemas.RecordSummary(
            id=r.id,
            planet_id=r.planet_id,
            preview=to_preview(r.content),
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/{record_id}", response_model=schemas.RecordResponse)
def get_record(
    planet_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """마크다운 전문 조회 — 상세 화면에서 사용."""
    _get_owned_planet(planet_id, user, db)  # 소유 확인(아니면 404)
    return _get_record(planet_id, record_id, db)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    planet_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _get_owned_planet(planet_id, user, db)  # 소유 확인(아니면 404)
    record = _get_record(planet_id, record_id, db)
    db.delete(record)
    db.commit()
