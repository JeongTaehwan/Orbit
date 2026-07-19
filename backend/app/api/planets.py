"""행성(Planet) 엔드포인트. 인증 필수 + 본인 소유만 접근."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_current_user, get_db
from app.services.progress import calculate_progress

router = APIRouter(prefix="/planets", tags=["planets"])


def _with_progress(planet: models.Planet, db: Session) -> models.Planet:
    """행성에 progress / is_completed / record_count 계산값을 얹어서 반환."""
    record_count = (
        db.query(models.Record)
        .filter(models.Record.planet_id == planet.id)
        .count()
    )
    progress, is_completed = calculate_progress(record_count, planet.difficulty)
    planet.record_count = record_count
    planet.progress = progress
    planet.is_completed = is_completed
    return planet


def _get_owned_planet(planet_id: int, user: models.User, db: Session) -> models.Planet:
    """내 소유 행성만 반환. 없거나 남의 것이면 404(존재 자체를 숨김)."""
    planet = db.get(models.Planet, planet_id)
    if planet is None or planet.user_id != user.id:
        raise HTTPException(status_code=404, detail="행성을 찾을 수 없습니다.")
    return planet


@router.post("", response_model=schemas.PlanetResponse, status_code=status.HTTP_201_CREATED)
def create_planet(
    payload: schemas.PlanetCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    planet = models.Planet(
        user_id=user.id,
        name=payload.name,
        difficulty=payload.difficulty.value,
    )
    db.add(planet)
    db.commit()
    db.refresh(planet)
    return _with_progress(planet, db)


@router.get("", response_model=list[schemas.PlanetResponse])
def list_planets(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    planets = (
        db.query(models.Planet)
        .filter(models.Planet.user_id == user.id)
        .order_by(models.Planet.created_at.desc())
        .all()
    )
    return [_with_progress(p, db) for p in planets]


@router.get("/{planet_id}", response_model=schemas.PlanetResponse)
def get_planet(
    planet_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return _with_progress(_get_owned_planet(planet_id, user, db), db)


@router.delete("/{planet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planet(
    planet_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    planet = _get_owned_planet(planet_id, user, db)
    db.delete(planet)  # cascade 로 records 도 함께 삭제
    db.commit()
