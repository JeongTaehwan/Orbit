"""
Orbit API - 데이터베이스 연결 설정

여기서는 "PostgreSQL과 어떻게 대화할지"를 딱 한 번 설정합니다.
- engine       : 실제 DB로 가는 연결 통로
- SessionLocal : 요청 하나당 쓰는 "작업 세션"을 찍어내는 공장
- Base         : 모든 모델(models.py)이 상속할 부모 클래스
- get_db()     : FastAPI가 요청마다 세션을 넣어주고, 끝나면 닫아주는 함수
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# .env 파일을 읽어서 os.environ 에 채워 넣음
load_dotenv()

# 접속 정보는 코드에 하드코딩하지 않고 .env 에서 가져옴
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise RuntimeError(".env 에 DATABASE_URL 이 설정되어 있지 않습니다.")


# 1) 엔진: DB로 가는 연결 통로 (커넥션 풀을 내부에 들고 있음)
engine = create_engine(DATABASE_URL)

# 2) 세션 공장: 이 공장을 호출(SessionLocal())하면 세션 1개가 나옴
#    autocommit=False → 우리가 명시적으로 commit() 할 때까지 DB에 반영 안 함
#    autoflush=False  → 자동으로 미리 DB에 내보내지 않음 (제어를 우리가 가짐)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3) Base: models.py 의 모든 모델이 이걸 상속함.
#    이 Base 가 "어떤 테이블들이 있는지"를 전부 기억함.
Base = declarative_base()


# 4) 의존성 주입용 세션 제공 함수
def get_db():
    """요청 1건 동안 쓸 DB 세션을 열고, 끝나면 반드시 닫는다."""
    db = SessionLocal()
    try:
        yield db          # 여기서 세션을 엔드포인트에 "빌려줌"
    finally:
        db.close()        # 요청이 끝나면(성공/실패 무관) 반드시 닫음
