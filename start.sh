#!/bin/bash
# ============================================================
# Routine Mate — 로컬 직접 실행 스크립트 (도커 미사용)
# ============================================================
# [개정 2026-05-17]
#   - 도커 도입(5/7) 후 호스트에 venv/node_modules 가 없어 ./start.sh 가
#     깨지던 문제 수정: 없으면 자동 설치(첫 1회만, 이후 빠름).
#   - node --watch 로 Express 핫리로드 (네이티브라 도커와 달리 polling 불필요).
#
# 언제 이걸 쓰나:
#   - 본인 PC 에서 가장 빠른 개발 루프가 필요할 때 (네이티브 핫리로드)
#
# 도커로 팀 공유/검증/디펜스 데모를 할 때는:
#   ./start-docker.sh   또는   docker compose up
#
# 주의:
#   - AWS RDS 3306 이 막힌 네트워크(예: 학교)에서는 도커든 로컬이든
#     DB 접속이 동일하게 실패함 (이건 별개 이슈).
# ============================================================

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# ── 환경변수 로드 (src/backend/.env) ─────────────────────────────────────────
ENV_FILE="$SCRIPT_DIR/src/backend/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
else
    echo "⚠️  $ENV_FILE 없음 — 기본값 사용"
fi

PORT=${PORT:-3000}
PYTHON_API=${PYTHON_API:-"http://localhost:8000"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:5173"}
FASTAPI_PORT=$(echo "$PYTHON_API" | grep -oE '[0-9]+$')
FASTAPI_PORT=${FASTAPI_PORT:-8000}

# ── 0. 호스트 실행 환경 자동 점검 / 설치 (첫 1회만 시간 소요) ─────────────────
echo "🔍 실행 환경 점검 중..."

# 0-1. FastAPI venv
if [ ! -d "$SCRIPT_DIR/src/python_api/venv" ]; then
    echo "📦 Python venv 가 없습니다. 생성 + 패키지 설치 (첫 1회, 1~3분)..."
    cd "$SCRIPT_DIR/src/python_api" || exit 1
    python3 -m venv venv || { echo "❌ venv 생성 실패 (python3 설치 확인)"; exit 1; }
    # shellcheck disable=SC1091
    source venv/bin/activate
    pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt || { echo "❌ pip install 실패"; exit 1; }
    deactivate
    cd "$SCRIPT_DIR" || exit 1
    echo "✅ Python 환경 준비 완료"
fi

# 0-2. Express node_modules
if [ ! -d "$SCRIPT_DIR/src/backend/node_modules" ]; then
    echo "📦 Express node_modules 없음. npm install (첫 1회)..."
    cd "$SCRIPT_DIR/src/backend" || exit 1
    npm install || { echo "❌ Express npm install 실패"; exit 1; }
    cd "$SCRIPT_DIR" || exit 1
    echo "✅ Express 환경 준비 완료"
fi

# 0-3. 프론트(루트) node_modules
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Frontend node_modules 없음. npm install (첫 1회)..."
    cd "$SCRIPT_DIR" || exit 1
    npm install || { echo "❌ Frontend npm install 실패"; exit 1; }
    echo "✅ Frontend 환경 준비 완료"
fi

echo ""
echo "🚀 서버 시작..."
echo ""

# ── FastAPI (uvicorn --reload: 네이티브라 polling 불필요) ────────────────────
echo "🐍 FastAPI  → 포트 $FASTAPI_PORT"
cd "$SCRIPT_DIR/src/python_api" || exit 1
# shellcheck disable=SC1091
source venv/bin/activate
uvicorn app:app --reload --port "$FASTAPI_PORT" &
FASTAPI_PID=$!

# ── Express (node --watch: Node 20+ 네이티브 핫리로드) ───────────────────────
echo "🟩 Express  → 포트 $PORT"
cd "$SCRIPT_DIR/src/backend" || exit 1
node --watch app.js &
EXPRESS_PID=$!

# ── React ────────────────────────────────────────────────────────────────────
# [수정 2026-05-18 / 배포 준비] dev vs prod(터널/배포) 모드 분기
#   - 인자 없음        : npm run dev   (HMR 핫리로드 — 로컬 개발용)
#   - 인자 "prod"      : npm run build → npm run preview (정적 서빙 — 터널/배포용)
#     이유: dev 서버 HMR(Fast Refresh, $RefreshSig$)은 cloudflared 터널을
#     통과하지 못해 흰 화면이 됨. 배포/터널 노출은 빌드 산출물 정적 서빙이 정석.
#   사용: ./start.sh         (로컬 개발)
#         ./start.sh prod    (터널/외부 공개)
cd "$SCRIPT_DIR" || exit 1
if [ "$1" = "prod" ]; then
    echo "⚛️  React    → build + preview (정적 서빙, 터널/배포 모드)"
    echo "    빌드 중... (수십 초 소요, VITE_EXPRESS_URL 이 이 시점에 코드에 박힘)"
    npm run build || { echo "❌ 프론트 빌드 실패"; kill "$FASTAPI_PID" "$EXPRESS_PID" 2>/dev/null; exit 1; }
    npm run preview &
    REACT_PID=$!
else
    echo "⚛️  React    → $FRONTEND_URL (dev HMR)"
    npm run dev &
    REACT_PID=$!
fi

echo ""
echo "✅ 모두 시작됨"
echo "📌 React   → $FRONTEND_URL"
echo "📌 Express → http://localhost:$PORT"
echo "📌 FastAPI → $PYTHON_API"
echo ""
echo "종료: Ctrl+C"

trap "kill $FASTAPI_PID $EXPRESS_PID $REACT_PID 2>/dev/null; echo ''; echo '👋 종료'" SIGINT
wait
