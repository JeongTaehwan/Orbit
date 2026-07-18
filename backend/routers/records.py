"""
학습 기록(Record) 관련 엔드포인트 모음.

기록은 항상 "특정 행성에 속하므로" 경로가 /planets/{planet_id}/records 로
행성 아래에 중첩된다(nested).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# prefix에 {planet_id} 를 포함 → 아래 모든 경로가 특정 행성 소속
router = APIRouter(prefix="/planets/{planet_id}/records", tags=["records"])


# 5) 학습 기록 추가 (행성 없으면 404)
@router.post("", response_model=schemas.RecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    planet_id: int,
    payload: schemas.RecordCreate,
    db: Session = Depends(get_db),
):
    # 먼저 부모 행성이 실제로 존재하는지 확인
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")

    record = models.Record(planet_id=planet_id, content=payload.content)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# 6) 특정 행성의 기록 목록
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
