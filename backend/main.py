from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  (import 해야 테이블 정의가 Base에 등록됨)
from database import Base, engine
from routers import planets, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱이 시작될 때 실행: models.py 에 정의된 테이블을 DB에 생성한다.
    # (이미 있으면 건드리지 않음. 존재하지 않는 것만 CREATE)
    Base.metadata.create_all(bind=engine)
    yield
    # yield 이후는 앱 종료 시 실행되는 자리 (지금은 정리할 것 없음)


app = FastAPI(title="Orbit API", lifespan=lifespan)

# CORS: 브라우저가 다른 출처(localhost:3000)에서 이 API(localhost:8000)를
# 호출하도록 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 개발 서버
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, DELETE 등 전부 허용
    allow_headers=["*"],
)

# 라우터 등록: 각 파일에 흩어진 경로들을 앱에 붙인다.
app.include_router(planets.router)
app.include_router(records.router)


@app.get("/")
def read_root():
    return {"message": "Orbit API is running"}
