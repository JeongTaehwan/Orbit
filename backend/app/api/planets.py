"""행성(Planet) 엔드포인트. HTTP 흐름만 담당하고, 계산은 services 에 위임."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_db
from app.services.progress import calculate_progress

router = APIRouter(prefix="/planets", tags=["planets"])


def _with_progress(planet: models.Planet, db: Session) -> models.Planet:
    """행성에 progress / is_completed 계산값을 얹어서 반환.

    이 두 값은 DB 컬럼이 아니라서 ORM 객체에 파이썬 속성으로 붙인다.
    → PlanetResponse(from_attributes=True)가 그대로 읽어 응답에 담는다.
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


@router.post("", response_model=schemas.PlanetResponse, status_code=status.HTTP_201_CREATED)
def create_planet(payload: schemas.PlanetCreate, db: Session = Depends(get_db)):
    planet = models.Planet(name=payload.name, difficulty=payload.difficulty.value)
    db.add(planet)
    db.commit()
    db.refresh(planet)
    return _with_progress(planet, db)


@router.get("", response_model=list[schemas.PlanetResponse])
def list_planets(db: Session = Depends(get_db)):
    planets = db.query(models.Planet).order_by(models.Planet.created_at.desc()).all()
    return [_with_progress(p, db) for p in planets]


@router.get("/{planet_id}", response_model=schemas.PlanetResponse)
def get_planet(planet_id: int, db: Session = Depends(get_db)):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    return _with_progress(planet, db)


@router.delete("/{planet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planet(planet_id: int, db: Session = Depends(get_db)):
    planet = db.get(models.Planet, planet_id)
    if planet is None:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    db.delete(planet)  # cascade 로 records 도 함께 삭제
    db.commit()
