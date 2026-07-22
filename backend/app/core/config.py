"""
앱 설정 한 곳에 모음.

.env 를 로드하고, 다른 모듈은 여기서 값을 가져다 쓴다.
(설정을 여기저기서 os.getenv 하지 않고 이 파일로 일원화)
비밀값(시크릿)만 .env 에서 읽고, 나머지는 여기 기본값을 둔다.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/.env 를 명시적 경로로 로드 → 실행 위치(cwd)와 무관하게 동작.
# config.py 위치: backend/app/core/config.py → parents[2] == backend/
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    raise RuntimeError(".env 에 DATABASE_URL 이 설정되어 있지 않습니다.")

# ── 구글 OAuth (시크릿은 .env 에서) ──
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# ── 세션 JWT 서명 키 (.env 에 직접 넣을 것) ──
JWT_SECRET = os.getenv("JWT_SECRET")

# ── Cloudinary (이미지 저장소) — 대시보드의 Product Environment Credentials ──
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# ── 로컬 개발용 고정값 (비밀 아님) ──
# 구글 콘솔의 "승인된 리디렉션 URI" 에 이 값을 등록해야 한다.
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# 세션 쿠키
SESSION_COOKIE_NAME = "orbit_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7일(초)
# 로컬은 http 라 Secure=False. 배포(https)에서는 True 로.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

# 구글 OAuth 엔드포인트
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
