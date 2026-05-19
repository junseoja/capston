#!/bin/bash
# ============================================================
# Routine Mate — 공개 서빙 원클릭 스크립트 (Named Tunnel)
# ============================================================
# [생성 2026-05-18 / cloudflared Named Tunnel 편의 스크립트]
#   오류번호: 배포 편의 (터널 운영 휴먼에러)
#   날짜:     2026-05-18
#   기대효과:
#     "./start.sh prod" + "cloudflared tunnel run routimate" 두 터미널을
#     매번 따로 띄우던 것을 ./serve.sh 하나로 통합. prod 누락(흰화면) 방지.
#   장점:
#     - prod 모드 강제 → dev 로 잘못 띄워 터널서 흰화면 나는 사고 차단.
#     - Ctrl+C 한 번으로 로컬 서버(start.sh 자식 3개) + 터널 동시 정리.
#     - 사전 점검(cloudflared/config.yml/start.sh)으로 원인 모를 실패 예방.
#
# 쓰임새:
#   ./serve.sh        외부 공개 (https://routimate.com)  ← 평소 이거
#
# 순수 로컬 개발(터널 없이, HMR) 은 기존대로:
#   ./start.sh        (dev, NODE_ENV=development 로 두고)
#
# 전제 (1회성, 이미 끝남):
#   cloudflared tunnel login / create routimate
#   ~/.cloudflared/config.yml 작성
#   cloudflared tunnel route dns routimate routimate.com (+ api.)
#   루트 .env / src/backend/.env 가 routimate.com 고정값
# ============================================================

set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TUNNEL_NAME="routimate"
CF_CONFIG="$HOME/.cloudflared/config.yml"

# ── 0. 사전 점검 ─────────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
    echo "❌ cloudflared 가 설치되어 있지 않습니다 (brew install cloudflared)"
    exit 1
fi
if [ ! -f "$CF_CONFIG" ]; then
    echo "❌ $CF_CONFIG 없음 — Named Tunnel 미설정. docs/cloudflared-tunnel.md §6 참고"
    exit 1
fi
if [ ! -f "$SCRIPT_DIR/start.sh" ]; then
    echo "❌ $SCRIPT_DIR/start.sh 없음"
    exit 1
fi

echo "🌐 Routine Mate 공개 서빙 시작 (https://routimate.com)"
echo "   - 로컬: ./start.sh prod"
echo "   - 터널: cloudflared tunnel run $TUNNEL_NAME"
echo "   종료: Ctrl+C (둘 다 함께 정리)"
echo ""

# ── 1. 로컬 서버 (prod 강제) ─────────────────────────────────
"$SCRIPT_DIR/start.sh" prod &
START_PID=$!

# 로컬 서버가 포트를 열 시간을 잠깐 준 뒤 터널 연결
# (start.sh prod 는 npm run build 가 있어 수십 초 — 너무 빨리 터널 붙으면
#  502 가 잠깐 뜰 수 있어 5초만 양보. 그래도 터널이 알아서 재시도함.)
sleep 5

# ── 2. Named Tunnel ─────────────────────────────────────────
cloudflared tunnel run "$TUNNEL_NAME" &
TUNNEL_PID=$!

# ── 3. 정리 (Ctrl+C / 어느 한쪽 종료 시 둘 다) ───────────────
cleanup() {
    trap '' SIGINT SIGTERM
    echo ""
    echo "🧹 종료 중..."
    # start.sh 는 SIGINT 트랩으로 FastAPI/Express/React 자식을 스스로 정리한다.
    kill -INT "$START_PID" 2>/dev/null
    kill "$TUNNEL_PID" 2>/dev/null
    wait "$START_PID" 2>/dev/null
    wait "$TUNNEL_PID" 2>/dev/null
    echo "👋 종료 완료"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── 4. 한쪽이 죽으면 같이 내림 (좀비 방지) ───────────────────
while kill -0 "$START_PID" 2>/dev/null && kill -0 "$TUNNEL_PID" 2>/dev/null; do
    sleep 2
done
echo ""
echo "⚠️  로컬 서버 또는 터널 중 하나가 종료됨 → 나머지도 정리합니다."
cleanup
