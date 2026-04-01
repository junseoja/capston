#!/bin/bash

echo "🚀 서버 시작 중..."

# FastAPI 실행
echo "🐍 FastAPI 시작..."
cd /Users/sayongja/ProjectFile/capston-main/src/python_api
source venv/bin/activate
uvicorn app:app --reload --port 8000 &
FASTAPI_PID=$!

# Express 실행
echo "🟩 Express 시작..."
cd /Users/sayongja/ProjectFile/capston-main/src/backend
node app.js &
EXPRESS_PID=$!

# React 실행
echo "⚛️  React 시작..."
cd /Users/sayongja/ProjectFile/capston-main
npm run dev &
REACT_PID=$!

echo "✅ 모든 서버 시작 완료!"
echo "📌 React   → http://localhost:5173"
echo "📌 Express → http://localhost:3000"
echo "📌 FastAPI → http://localhost:8000"
echo ""
echo "종료하려면 Ctrl+C 누르세요"

# Ctrl+C 누르면 전부 종료
trap "kill $FASTAPI_PID $EXPRESS_PID $REACT_PID; echo '👋 서버 종료'" SIGINT
wait