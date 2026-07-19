"""
엔드포인트 공통 의존성 모음.

- get_db          : DB 세션
- get_current_user: httpOnly 쿠키의 세션 토큰 → 현재 로그인 사용자
"""

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core import config
from app.core.database import get_db
from app.models import User
from app.services.security import read_session_token

__all__ = ["get_db", "get_current_user"]


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """요청 쿠키에서 세션 토큰을 읽어 현재 사용자를 돌려준다. 없으면 401."""
    token = request.cookies.get(config.SESSION_COOKIE_NAME)
    user_id = read_session_token(token) if token else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return user
