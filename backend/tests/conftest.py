"""
pytest 공통 설정 (fixture 모음).

conftest.py 는 pytest가 자동으로 읽는 특수 파일. 여기 정의한 fixture 는
같은 폴더의 모든 테스트에서 인자 이름만으로 가져다 쓸 수 있다.

핵심: 테스트는 진짜 PostgreSQL이 아니라 "메모리 안의 임시 SQLite DB"를 쓴다.
→ 실제 orbit DB를 오염시키지 않고, 매 테스트마다 깨끗한 상태에서 시작한다.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# 메모리 SQLite. StaticPool + check_same_thread=False 는
# "여러 곳에서 같은 메모리 DB에 접근"하게 해주는 표준 설정.
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def _override_get_db():
    """실제 get_db 대신 테스트용 세션을 내주는 함수."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    """API를 호출할 수 있는 테스트 클라이언트. 매 테스트마다 새 DB."""
    Base.metadata.create_all(bind=test_engine)  # 빈 테이블 생성

    # get_db 를 테스트용으로 갈아끼움 (의존성 오버라이드)
    app.dependency_overrides[get_db] = _override_get_db

    # with 없이 생성 → lifespan(실 postgres 연결)이 실행되지 않음
    yield TestClient(app)

    # 뒷정리: 오버라이드 해제 + 테이블 삭제 → 다음 테스트에 영향 없음
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
