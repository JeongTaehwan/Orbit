"""
DB 연결 설정: engine, SessionLocal, Base, get_db.
(설정값 DATABASE_URL 은 core.config 에서 가져옴)
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

# 엔진: DB로 가는 연결 통로 (커넥션 풀 보유)
engine = create_engine(DATABASE_URL)

# 세션 공장: 호출하면 세션 1개 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모든 모델(models/)이 상속할 부모
Base = declarative_base()


def get_db():
    """요청 1건 동안 쓸 DB 세션을 열고, 끝나면 반드시 닫는다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
