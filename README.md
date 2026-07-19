# Orbit

> 공부하면 내 우주가 자라난다 — 학습 동기부여 웹앱

학습 주제를 하나의 행성으로 만들고, 학습 기록을 남길 때마다 그 행성이 황량한 암석에서 생명이 사는 행성으로 **테라포밍**되는 과정을 시각적으로 보여주는 애플리케이션입니다. 성장의 시각화를 통해 꾸준한 학습을 유도합니다.

<br />

## ✨ 핵심 컨셉

- **학습 = 테라포밍** — 학습 주제마다 행성 하나. 기록을 남길수록 진행도가 오릅니다.
- **성장의 시각화** — 진행도에 따라 행성이 단계별로 변화합니다. (암석 → 대기 → 바다 → 생명)
- **나만의 우주** — 완성한 행성들이 우주 지도에 쌓여갑니다.

<br />

## 🛠 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- `useTaehwan()/ui` — 자체 제작 디자인 시스템 재사용 (우주 테마 적용)

### Backend
- **FastAPI** (Python 3.12)
- **PostgreSQL** — 데이터 저장
- **Google OAuth** — 소셜 로그인

### Infra
- Frontend: Vercel
- Backend: (예정)

<br />

## 📁 프로젝트 구조

```
Orbit/
├── frontend/     # Next.js 애플리케이션
└── backend/      # FastAPI 서버
```

<br />

## 🚀 실행 방법

### 동시 실행 (권장)
최초 1회 아래 "개별 설치"로 의존성을 설치한 뒤, **루트에서 명령 하나로** 둘 다 실행:
```bash
./scripts/dev.sh
# 백엔드 :8000 (API 문서 /docs) + 프론트 :3000 을 함께 실행
# 로그는 [backend] / [frontend] 접두사로 구분, Ctrl+C 한 번으로 둘 다 종료
```

### 개별 설치 / 실행

**Frontend**
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev app/main.py
# http://localhost:8000
# API 문서: http://localhost:8000/docs
```

### 테스트
```bash
./scripts/test-all.sh          # 백엔드 + 프론트 유닛 + e2e 한 번에
# 부분 실행: ./scripts/test-all.sh backend | unit | e2e
```

<br />

## 🌱 진행 상황

- [x] 모노레포 초기 세팅 (Next.js + FastAPI)
- [x] 데이터 모델 설계 (행성 / 학습 기록)
- [x] 행성 CRUD API
- [x] 디자인 시스템 적용 (`@usetaehwan/ui`) + 우주 테마
- [ ] 구글 OAuth 로그인
- [ ] 행성 SVG 비주얼 (진행도별 단계 변화)
- [ ] 우주 지도 화면
- [ ] 배포

<br />

## 📝 About

프론트엔드 개발자가 백엔드·인프라까지 직접 구성하며 풀스택 구조를 이해하기 위해 진행하는 개인 프로젝트입니다. 자체 제작한 디자인 시스템(`useTaehwan()/ui`)을 다른 테마로 재사용하는 사례이기도 합니다.

made by [Taehwan Jeong](https://usetaehwan.page)