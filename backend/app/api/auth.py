"""구글 OAuth 로그인 흐름 + 세션 관리 엔드포인트."""

import secrets

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_current_user, get_db
from app.core import config
from app.services import google_oauth
from app.services.security import create_session_token

router = APIRouter(prefix="/auth", tags=["auth"])

# CSRF 방지용 state 를 잠깐 저장하는 쿠키
STATE_COOKIE = "orbit_oauth_state"


@router.get("/google")
def google_login():
    """구글 로그인(동의) 화면으로 리다이렉트."""
    state = secrets.token_urlsafe(16)
    res = RedirectResponse(google_oauth.build_auth_url(state))
    res.set_cookie(
        STATE_COOKIE,
        state,
        max_age=300,
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_SECURE,
    )
    return res


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: Session = Depends(get_db),
):
    """구글 콜백: code→토큰 교환→사용자 조회→User upsert→세션 쿠키 발급→프론트로."""
    saved_state = request.cookies.get(STATE_COOKIE)
    if not code or not state or state != saved_state:
        # 실패 시 프론트 로그인 화면으로 (에러 표시용 쿼리)
        return RedirectResponse(f"{config.FRONTEND_URL}/login?error=oauth")

    # 1) code → access_token, 2) access_token → 프로필
    token_data = await google_oauth.exchange_code(code)
    info = await google_oauth.fetch_userinfo(token_data["access_token"])

    # 3) 같은 google_sub 면 기존 사용자, 없으면 새로 생성 (upsert)
    google_sub = info["sub"]
    user = db.query(models.User).filter(models.User.google_sub == google_sub).first()
    if user is None:
        user = models.User(
            google_sub=google_sub,
            email=info.get("email", ""),
            name=info.get("name"),
            picture=info.get("picture"),
        )
        db.add(user)
    else:
        # 이름/사진은 바뀔 수 있으니 갱신
        user.email = info.get("email", user.email)
        user.name = info.get("name")
        user.picture = info.get("picture")
    db.commit()
    db.refresh(user)

    # 4) 세션 토큰(JWT)을 httpOnly 쿠키로 심고 프론트로 리다이렉트
    res = RedirectResponse(config.FRONTEND_URL)
    res.set_cookie(
        config.SESSION_COOKIE_NAME,
        create_session_token(user.id),
        max_age=config.SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_SECURE,
        path="/",
    )
    res.delete_cookie(STATE_COOKIE)
    return res


@router.post("/logout")
def logout(response: Response):
    """세션 쿠키 삭제."""
    response.delete_cookie(config.SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=schemas.UserResponse)
def me(user: models.User = Depends(get_current_user)):
    """현재 로그인 사용자 정보 (미로그인이면 get_current_user 가 401)."""
    return user
