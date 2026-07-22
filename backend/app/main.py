"""앱 조립: 테이블 생성(lifespan) + CORS + 라우터 등록."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (import 해야 테이블이 Base에 등록됨)
from app.api import auth, me, planets, records, uploads
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시 테이블 생성 (없는 것만 CREATE)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Orbit API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(me.router)
app.include_router(planets.router)
app.include_router(records.router)
app.include_router(uploads.router)


@app.get("/")
def read_root():
    return {"message": "Orbit API is running"}
