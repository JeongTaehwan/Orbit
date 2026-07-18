"""
앱 설정 한 곳에 모음.

.env 를 로드하고, 다른 모듈은 여기서 값을 가져다 쓴다.
(설정을 여기저기서 os.getenv 하지 않고 이 파일로 일원화)
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
