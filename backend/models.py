"""
Orbit API - SQLAlchemy 모델 (= DB 테이블 정의)

이 파일의 클래스 하나 = DB 테이블 하나.
클래스의 속성 하나 = 테이블의 컬럼 하나.

schemas.py(Pydantic)와 헷갈리지 말 것:
- models.py  → "DB 안에서 데이터가 어떻게 저장되는가"
- schemas.py → "API 입구/출구에서 데이터가 어떻게 보이는가"
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Planet(Base):
    __tablename__ = "planets"  # 실제 DB에 만들어질 테이블 이름

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    difficulty = Column(String, nullable=False)  # "easy" | "normal" | "hard"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 이 행성에 달린 기록들 (파이썬 코드에서만 쓰는 편의 속성. 실제 컬럼 아님)
    # planet.records 로 연결된 Record 목록을 리스트처럼 꺼낼 수 있음.
    records = relationship(
        "Record",
        back_populates="planet",
        cascade="all, delete-orphan",  # 행성 삭제 시 그 기록들도 함께 삭제
    )


class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    # 실제 DB 컬럼 + 외래키 제약: 이 값은 planets.id 에 존재해야 함
    planet_id = Column(Integer, ForeignKey("planets.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # record.planet 으로 소속 행성 객체를 바로 꺼낼 수 있음 (편의 속성)
    planet = relationship("Planet", back_populates="records")
