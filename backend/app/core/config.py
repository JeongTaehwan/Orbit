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

# ── CORS 허용 오리진 ──
# 프론트 주소(로컬/배포)가 환경마다 달라지므로 환경변수로 받는다.
# 쉼표로 여러 개 지정 가능. 없으면 로컬 개발용 기본값.
#   예: CORS_ORIGINS=http://localhost:3000,https://orbit-xxx.vercel.app
# (빈 문자열로 설정된 경우도 기본값으로 — .env.example 을 그대로 복사한 상황 대비)
CORS_ORIGINS = [
    origin.strip()
    for origin in (os.getenv("CORS_ORIGINS") or "http://localhost:3000").split(",")
    if origin.strip()
]

# ── 로컬 개발용 기본값 (비밀 아님) — 배포 시 실제 주소로 오버라이드 ──
# 구글 콘솔의 "승인된 리디렉션 URI" 에 이 값을 등록해야 한다.
# 콜백은 프론트의 /api 프록시를 거친다(프론트 next.config.ts rewrites → 백엔드).
#   → 브라우저는 프론트 오리진만 상대하므로 세션 쿠키가 same-origin(퍼스트파티)으로 유지됨.
# 로컬 기본값: http://localhost:3000/api/auth/google/callback
# 배포 예:    https://orbit-xxx.vercel.app/api/auth/google/callback
GOOGLE_REDIRECT_URI = (
    os.getenv("GOOGLE_REDIRECT_URI")
    or "http://localhost:3000/api/auth/google/callback"
)
# 로그인 완료 후 브라우저를 돌려보낼 프론트 주소.
FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:3000"

# 세션 쿠키
SESSION_COOKIE_NAME = "orbit_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7일(초)
# 세션 쿠키 SameSite/Secure:
#   프론트의 /api 프록시 덕분에 브라우저는 프론트 오리진하고만 통신한다(same-origin).
#   따라서 크로스사이트용 SameSite=None 이 필요 없고, 더 안전하고 모바일에서도 잘 동작하는
#   SameSite=Lax 로 충분하다. (구글 콜백은 top-level GET 이라 Lax 쿠키가 정상 전송됨)
#   → 배포(https): COOKIE_SAMESITE=lax, COOKIE_SECURE=true
#   → 로컬(http):  기본값 lax + Secure=false
COOKIE_SAMESITE = (os.getenv("COOKIE_SAMESITE") or "lax").lower()
COOKIE_SECURE = (os.getenv("COOKIE_SECURE") or "false").lower() == "true"

# 구글 OAuth 엔드포인트
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
