"""
pytest 공통 설정 (fixture 모음).

인증 도입 후: 대부분 테스트는 get_current_user 를 오버라이드해
"user 1 로 로그인된 상태"로 돌린다. client.current["id"] 로 사용자를 바꿀 수 있다.
인증 자체(401)를 검증할 땐 anon_client 를 쓴다.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user, get_db
from app.core.database import Base
from app.main import app
from app.models import User

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _seed_users():
    db = TestingSessionLocal()
    db.add_all(
        [
            User(id=1, google_sub="sub-1", email="u1@example.com", name="User One"),
            User(id=2, google_sub="sub-2", email="u2@example.com", name="User Two"),
        ]
    )
    db.commit()
    db.close()


@pytest.fixture
def client():
    """user 1 로 로그인된 테스트 클라이언트. client.current['id'] 로 사용자 전환."""
    Base.metadata.create_all(bind=test_engine)
    _seed_users()
    app.dependency_overrides[get_db] = _override_get_db

    current = {"id": 1}

    def _override_current_user():
        db = TestingSessionLocal()
        try:
            return db.get(User, current["id"])
        finally:
            db.close()

    app.dependency_overrides[get_current_user] = _override_current_user

    c = TestClient(app)
    c.current = current  # 테스트에서 사용자 전환용
    yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def anon_client():
    """인증 안 된 클라이언트 (get_current_user 실제 동작 → 쿠키 없으니 401)."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
