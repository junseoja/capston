#!/bin/bash

# 이 스크립트가 위치한 디렉토리를 기준으로 경로 설정
# (어떤 디렉토리에서 실행하든 올바른 경로를 찾음)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# ── 환경변수 로드 ──────────────────────────────────────────────────────────────
# src/backend/.env 에서 PORT, PYTHON_API, FRONTEND_URL 읽기
ENV_FILE="$SCRIPT_DIR/src/backend/.env"

if [ -f "$ENV_FILE" ]; then
    # set -a: 이후 선언되는 변수를 자동으로 export
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
else
    echo "⚠️  $ENV_FILE 파일이 없습니다. 기본값을 사용합니다."
fi

# 기본값 (src/backend/.env 파일이 없을 때 fallback)
PORT=${PORT:-3000}
PYTHON_API=${PYTHON_API:-"http://localhost:8000"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:5173"}

# PYTHON_API URL에서 포트 번호만 추출 (예: "http://localhost:8000" → "8000")
FASTAPI_PORT=$(echo "$PYTHON_API" | grep -oE '[0-9]+$')
FASTAPI_PORT=${FASTAPI_PORT:-8000}

echo "🚀 서버 시작 중..."
echo ""

# ── FastAPI 실행 ───────────────────────────────────────────────────────────────
echo "🐍 FastAPI 시작... (포트: $FASTAPI_PORT)"
cd "$SCRIPT_DIR/src/python_api" || exit 1
source venv/bin/activate
uvicorn app:app --reload --port "$FASTAPI_PORT" &
FASTAPI_PID=$!

# ── Express 실행 ───────────────────────────────────────────────────────────────
echo "🟩 Express 시작... (포트: $PORT)"
cd "$SCRIPT_DIR/src/backend" || exit 1
node app.js &
EXPRESS_PID=$!

# ── React 실행 ────────────────────────────────────────────────────────────────
echo "⚛️  React 시작..."
cd "$SCRIPT_DIR" || exit 1
npm run dev &
REACT_PID=$!

echo ""
echo "✅ 모든 서버 시작 완료!"
echo "📌 React   → $FRONTEND_URL"
echo "📌 Express → http://localhost:$PORT"
echo "📌 FastAPI → $PYTHON_API"
echo ""
echo "종료하려면 Ctrl+C 누르세요"

# Ctrl+C 누르면 세 서버 모두 종료
trap "kill $FASTAPI_PID $EXPRESS_PID $REACT_PID 2>/dev/null; echo ''; echo '👋 서버 종료'" SIGINT
wait
