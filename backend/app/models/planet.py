"""Planet 테이블 정의 (SQLAlchemy 모델)."""

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Planet(Base):
    __tablename__ = "planets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    difficulty = Column(String, nullable=False)  # "easy" | "normal" | "hard"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 이 행성에 달린 기록들. 행성 삭제 시 기록도 함께 삭제(cascade).
    records = relationship(
        "Record",
        back_populates="planet",
        cascade="all, delete-orphan",
    )
