# Orbit 프로젝트 규칙

학습 동기부여 앱 "Orbit" 모노레포. `backend/` (FastAPI + PostgreSQL), `frontend/` (Next.js + TypeScript).

## 코드 수정 후 테스트 확인 (필수)

코드를 수정하면 **반드시 관련 테스트를 실행해 통과를 확인**한 뒤 작업 완료를 보고한다.

- **전체 한 번에**: `./scripts/test-all.sh` (백엔드 + 프론트 유닛 + e2e)
  - 부분 실행: `./scripts/test-all.sh backend | unit | e2e`
- **백엔드만**: `cd backend && ./venv/bin/pytest`
- **프론트만**: `cd frontend && npm test` (유닛) / `npm run test:e2e` (e2e)
- **새 기능·버그 수정 시**: 그 동작을 검증하는 테스트를 추가하거나 갱신한다.
- 테스트가 실패하는 상태로 "완료"라고 보고하지 않는다. 실패 시 원인을 밝히고 고친다.

## 구조 규칙 (실용 계층형)

새 코드는 아래 구조와 **레이어 방향**을 따른다. 레이어를 건너뛰거나 역방향 의존을 만들지 않는다.

### 백엔드 `backend/app/`
```
main.py            # 앱 조립만 (lifespan, CORS, 라우터 등록)
core/              # config.py(설정·.env), database.py(engine/session/Base/get_db)
models/            # SQLAlchemy 테이블. 엔티티당 파일, __init__ 에서 재노출
schemas/           # Pydantic 입출력 계약 (요청/응답). 도메인 Enum·상수 포함
api/               # 엔드포인트 + deps.py(공통 의존성). HTTP 흐름만, 얇게 유지
services/          # 비즈니스 로직 (계산·규칙). DB 접근이 늘면 repositories/ 도입
```
- **의존 방향**: `api → services → models` (schemas 는 api 경계에서만 사용).
- **라우터는 얇게**: 검증된 요청 받기 → 서비스 호출 → 응답. 계산/복잡한 쿼리 금지.
- **schema(Pydantic) ≠ model(SQLAlchemy)** 절대 혼용하지 않는다.
- DB 세션 등은 `Depends` 로 주입. 실행: `cd backend && ./venv/bin/fastapi dev app/main.py`.

### 프론트엔드 `frontend/`
```
app/               # 라우트/페이지 — 조립만 (얇게)
features/<도메인>/  # 도메인별 컴포넌트·훅 (예: features/planets/)
components/ui/      # 재사용 순수 프레젠테이션 컴포넌트
lib/api/           # 백엔드 호출 클라이언트 (fetch 는 여기에만)
lib/utils/         # 순수 유틸 (예: progress)
types/             # 공용 도메인 타입
```
- **페이지는 얇게**, 로직·UI 는 `features`/`lib` 로.
- **서버 컴포넌트가 기본**, 상호작용(useState/onClick 등)은 잎(leaf) 클라이언트 컴포넌트로 최소화.
- **API 호출은 `lib/api` 에만** 모은다. 컴포넌트에서 직접 fetch 하지 않는다.
- 공용 타입은 `types/` 에 두고 `@/types/...` 로 import.

## 참고
- 프론트엔드는 Next.js 16 (App Router). 훈련 데이터와 다를 수 있으니 코드 작성 전 `frontend/node_modules/next/dist/docs/` 의 관련 문서를 확인한다. (`frontend/AGENTS.md` 참고)
