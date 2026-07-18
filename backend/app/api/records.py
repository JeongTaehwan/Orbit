"""학습 기록(Record) 엔드포인트. 경로가 행성 아래에 중첩된다."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_db

router = APIRouter(prefix="/planets/{planet_id}/records", tags=["records"])


@router.post("", response_model=schemas.RecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    planet_id: int,
    payload: schemas.RecordCreate,
    db: Session = Depends(get_db),
):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")

    record = models.Record(planet_id=planet_id, content=payload.content)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[schemas.RecordResponse])
def list_records(planet_id: int, db: Session = Depends(get_db)):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")

    return (
        db.query(models.Record)
        .filter(models.Record.planet_id == planet_id)
        .order_by(models.Record.created_at.desc())
        .all()
    )
