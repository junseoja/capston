#!/usr/bin/env bash
# ============================================================
# Routine Mate — 팀원용 Docker 실행 스크립트
# ============================================================
# 사용법:
#   1. Docker Desktop 설치 + 실행
#   2. .env 파일 3개 채우기 (.env.example 참고, AWS/RDS 키는 슬랙 DM)
#   3. ./start-docker.sh
#
# Windows 사용자:
#   - WSL2 터미널에서 실행 (PowerShell/cmd 에서도 가능하지만 WSL 권장)
#   - 또는 그냥 docker compose up 직접 실행해도 동일
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🐳 Routine Mate — Docker 실행"
echo "============================================================"

# ── 1. Docker 설치 확인 ──────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ docker 명령을 찾을 수 없습니다."
    echo "   Docker Desktop 을 설치하고 실행하세요: https://docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker 데몬이 실행 중이 아닙니다."
    echo "   Docker Desktop 을 실행한 뒤 다시 시도하세요."
    exit 1
fi

echo "✅ Docker 정상 동작 중"

# ── 2. .env 파일 3개 존재 확인 ───────────────────────────────────────────────
missing_env=0
for f in ".env" "src/backend/.env" "src/python_api/.env"; do
    if [ ! -f "$f" ]; then
        echo "❌ $f 가 없습니다."
        echo "   $f.example 을 복사해서 만들고 값을 채우세요."
        missing_env=1
    fi
done

if [ "$missing_env" -eq 1 ]; then
    echo ""
    echo "💡 빠른 셋업:"
    echo "   cp .env.example .env"
    echo "   cp src/backend/.env.example src/backend/.env"
    echo "   cp src/python_api/.env.example src/python_api/.env"
    echo "   (그 다음 각 파일 열어 AWS/RDS 자격증명 입력)"
    exit 1
fi

echo "✅ .env 파일 3개 모두 존재"

# ── 3. AWS S3 자격증명 누락 사전 경고 ────────────────────────────────────────
if ! grep -q "^AWS_ACCESS_KEY_ID=AKIA" src/backend/.env 2>/dev/null; then
    echo "⚠️  src/backend/.env 의 AWS_ACCESS_KEY_ID 가 비었거나 형식이 다릅니다."
    echo "   피드 이미지 업로드가 실패할 수 있습니다. (계속 진행)"
fi

# ── 4. docker compose up ─────────────────────────────────────────────────────
echo ""
echo "🚀 컨테이너 시작 중..."
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:3000"
echo "   - FastAPI:  http://localhost:8000"
echo ""
echo "   중지: Ctrl+C 또는 다른 터미널에서 'docker compose down'"
echo "============================================================"
echo ""

# 첫 실행 시 자동으로 이미지 빌드 (이미 있으면 캐시 사용)
docker compose up
