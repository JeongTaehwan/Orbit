#!/usr/bin/env bash
#
# Orbit 개발 서버 동시 실행
#   ./scripts/dev.sh
#
# 백엔드(:8000) + 프론트(:3000)를 함께 띄우고,
# 로그를 [backend] / [frontend] 접두사로 구분해 출력한다.
# Ctrl+C 한 번으로 두 서버를 모두 종료한다.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CYAN=$'\033[36m'
MAGENTA=$'\033[35m'
RESET=$'\033[0m'
BE="${CYAN}[backend] ${RESET}"
FE="${MAGENTA}[frontend]${RESET}"

# 종료 처리: Ctrl+C(INT) / 종료(TERM) / 스크립트 exit 시
# 현재 프로세스 그룹 전체를 정리한다(두 서버 + 로그 파이프 포함).
cleanup() {
  trap - EXIT INT TERM   # 핸들러 재진입 방지
  echo
  echo "종료합니다…"
  kill 0                 # 이 스크립트가 속한 프로세스 그룹 전체에 신호
}
trap cleanup EXIT INT TERM

echo "▶ 백엔드  http://localhost:8000   (API 문서: /docs)"
echo "▶ 프론트  http://localhost:3000"
echo "  (Ctrl+C 로 둘 다 종료)"
echo

# 백엔드: venv 의 fastapi 로 실행. PYTHONUNBUFFERED 로 로그 즉시 출력.
(
  cd "$ROOT/backend"
  export PYTHONUNBUFFERED=1
  exec ./venv/bin/fastapi dev app/main.py --port 8000
) 2>&1 | sed -u "s|^|${BE}|" &

# 프론트: next dev
(
  cd "$ROOT/frontend"
  exec npm run dev
) 2>&1 | sed -u "s|^|${FE}|" &

wait
