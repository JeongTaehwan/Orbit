"""User 테이블 정의 (SQLAlchemy 모델)."""

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # 구글 계정의 고유 식별자(sub). 같은 사람은 항상 같은 값 → 로그인 시 이걸로 조회.
    google_sub = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)  # 프로필 이미지 URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 이 사용자의 행성들 (User 1:N Planet)
    planets = relationship(
        "Planet",
        back_populates="user",
        cascade="all, delete-orphan",
    )
