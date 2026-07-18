"""Record 테이블 정의 (SQLAlchemy 모델)."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    planet_id = Column(Integer, ForeignKey("planets.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 소속 행성 객체 (record.planet 으로 접근)
    planet = relationship("Planet", back_populates="records")
