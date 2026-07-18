#!/usr/bin/env bash
#
# Orbit 전체 테스트 러너
#   ./scripts/test-all.sh          # 백엔드 + 프론트 유닛 + e2e 모두 실행
#   ./scripts/test-all.sh backend  # 백엔드(pytest)만
#   ./scripts/test-all.sh unit     # 프론트 유닛(Vitest)만
#   ./scripts/test-all.sh e2e      # 프론트 e2e(Playwright)만
#
# 하나가 실패해도 나머지는 계속 실행하고, 마지막에 요약을 출력한다.
# 하나라도 실패하면 종료 코드 1 (CI에서 실패로 인식).

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-all}"

backend_result="건너뜀"
unit_result="건너뜀"
e2e_result="건너뜀"
failed=0

run_backend() {
  echo "▶ 백엔드 (pytest)"
  if ( cd "$ROOT/backend" && ./venv/bin/pytest -q ); then
    backend_result="✅ 통과"
  else
    backend_result="❌ 실패"; failed=1
  fi
  echo
}

run_unit() {
  echo "▶ 프론트 유닛 (Vitest)"
  if ( cd "$ROOT/frontend" && npm test ); then
    unit_result="✅ 통과"
  else
    unit_result="❌ 실패"; failed=1
  fi
  echo
}

run_e2e() {
  echo "▶ 프론트 e2e (Playwright)"
  if ( cd "$ROOT/frontend" && npm run test:e2e ); then
    e2e_result="✅ 통과"
  else
    e2e_result="❌ 실패"; failed=1
  fi
  echo
}

case "$TARGET" in
  all)     run_backend; run_unit; run_e2e ;;
  backend) run_backend ;;
  unit)    run_unit ;;
  e2e)     run_e2e ;;
  *) echo "알 수 없는 대상: $TARGET (all|backend|unit|e2e)"; exit 2 ;;
esac

echo "================ 결과 요약 ================"
echo "  백엔드(pytest)     : $backend_result"
echo "  프론트 유닛(Vitest): $unit_result"
echo "  프론트 e2e(PW)     : $e2e_result"
echo "=========================================="

exit $failed
