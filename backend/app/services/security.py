"""세션 토큰(우리 서비스의 JWT) 발급·검증."""

from datetime import datetime, timedelta, timezone

import jwt

from app.core import config


def create_session_token(user_id: int) -> str:
    """user_id 를 담은 서명된 JWT 를 만든다 (httpOnly 쿠키에 실을 값)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),           # 누구인지
        "iat": now,                    # 발급 시각
        "exp": now + timedelta(seconds=config.SESSION_MAX_AGE),  # 만료
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def read_session_token(token: str) -> int | None:
    """토큰이 유효하면 user_id 를, 아니면(만료·위조) None 을 돌려준다."""
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None
