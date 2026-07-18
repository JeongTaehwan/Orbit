# Orbit 프로젝트 규칙

학습 동기부여 앱 "Orbit" 모노레포. `backend/` (FastAPI + PostgreSQL), `frontend/` (Next.js + TypeScript).

## 코드 수정 후 테스트 확인 (필수)

코드를 수정하면 **반드시 관련 테스트를 실행해 통과를 확인**한 뒤 작업 완료를 보고한다.

- **백엔드 변경 시**: `cd backend && ./venv/bin/pytest` 실행 → 전부 통과 확인
- **프론트 변경 시**: `cd frontend && npm test` (유닛) 실행 → 전부 통과 확인
  - 화면 흐름/라우팅에 영향 있으면 `npm run test:e2e` 도 확인
- **새 기능·버그 수정 시**: 그 동작을 검증하는 테스트를 추가하거나 갱신한다.
- 테스트가 실패하는 상태로 "완료"라고 보고하지 않는다. 실패 시 원인을 밝히고 고친다.

## 참고
- 프론트엔드는 Next.js 16 (App Router). 훈련 데이터와 다를 수 있으니 코드 작성 전 `frontend/node_modules/next/dist/docs/` 의 관련 문서를 확인한다. (`frontend/AGENTS.md` 참고)
