"""
행성(Planet) 관련 엔드포인트 모음.

APIRouter = "미니 FastAPI 앱". 여기에 경로들을 등록해두고
main.py 에서 이 라우터를 통째로 앱에 붙인다(include_router).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services import calculate_progress

# prefix="/planets" → 이 파일의 모든 경로 앞에 자동으로 /planets 가 붙음
# tags=[...] → /docs 문서에서 그룹 이름
router = APIRouter(prefix="/planets", tags=["planets"])


def _with_progress(planet: models.Planet, db: Session) -> models.Planet:
    """행성 하나에 progress / is_completed 계산값을 붙여서 돌려준다.

    이 두 값은 DB 컬럼이 아니라서, ORM 객체에 파이썬 속성으로 얹어준다.
    그러면 PlanetResponse(from_attributes=True)가 그대로 읽어 응답에 담는다.
    """
    record_count = (
        db.query(models.Record)
        .filter(models.Record.planet_id == planet.id)
        .count()
    )
    progress, is_completed = calculate_progress(record_count, planet.difficulty)
    planet.progress = progress
    planet.is_completed = is_completed
    return planet


# 1) 행성 생성
@router.post("", response_model=schemas.PlanetResponse, status_code=status.HTTP_201_CREATED)
def create_planet(payload: schemas.PlanetCreate, db: Session = Depends(get_db)):
    # payload 는 이미 Pydantic 검증을 통과한 상태 (name, difficulty)
    planet = models.Planet(
        name=payload.name,
        difficulty=payload.difficulty.value,  # Enum → 문자열로 저장
    )
    db.add(planet)      # 세션(장바구니)에 담고
    db.commit()         # DB에 확정 반영
    db.refresh(planet)  # DB가 채운 값(id, created_at)을 객체에 다시 불러옴
    return _with_progress(planet, db)


# 2) 행성 목록
@router.get("", response_model=list[schemas.PlanetResponse])
def list_planets(db: Session = Depends(get_db)):
    planets = db.query(models.Planet).order_by(models.Planet.created_at.desc()).all()
    return [_with_progress(p, db) for p in planets]


# 3) 행성 상세 (없으면 404)
@router.get("/{planet_id}", response_model=schemas.PlanetResponse)
def get_planet(planet_id: int, db: Session = Depends(get_db)):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    return _with_progress(planet, db)


# 4) 행성 삭제 (관련 기록도 함께 삭제 — models.py의 cascade 설정이 처리)
@router.delete("/{planet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planet(planet_id: int, db: Session = Depends(get_db)):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    db.delete(planet)  # cascade="all, delete-orphan" 덕분에 records도 함께 삭제됨
    db.commit()
    # 204 No Content → 본문 없이 성공만 알림
