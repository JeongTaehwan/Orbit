"""
구글 OAuth 2.0 서버-사이드 호출 모음.

라우터(api/auth.py)는 이 함수들을 순서대로 부른다:
  build_auth_url  → (구글 로그인) → exchange_code → fetch_userinfo
"""

from urllib.parse import urlencode

import httpx

from app.core import config


def build_auth_url(state: str) -> str:
    """구글 로그인(동의) 화면 URL 을 만든다. state 는 CSRF 방지용 무작위 값."""
    params = {
        "client_id": config.GOOGLE_CLIENT_ID,
        "redirect_uri": config.GOOGLE_REDIRECT_URI,
        "response_type": "code",           # Authorization Code 방식
        "scope": "openid email profile",   # 받고 싶은 정보 범위
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{config.GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    """구글이 준 임시 code 를 access_token 으로 교환한다 (서버↔구글, 시크릿 사용)."""
    data = {
        "code": code,
        "client_id": config.GOOGLE_CLIENT_ID,
        "client_secret": config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": config.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(config.GOOGLE_TOKEN_URL, data=data)
        res.raise_for_status()
        return res.json()


async def fetch_userinfo(access_token: str) -> dict:
    """access_token 으로 사용자 프로필(sub, email, name, picture)을 가져온다."""
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            config.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        return res.json()
