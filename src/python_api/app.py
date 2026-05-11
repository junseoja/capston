# ============================================================
# FastAPI 앱 진입점 (Entry Point)
# ============================================================
# 역할:
#   - Express 백엔드(포트 3000)에서 HTTP 요청을 받아 실제 DB 작업을 처리
#   - 포트 8000에서 실행 (uvicorn 사용)
#
# 실행 방법:
#   cd src/python_api
#   uvicorn app:app --reload --port 8000
#
# 아키텍처 흐름:
#   React(5173) → Express(3000) → FastAPI(8000) → MySQL(AWS RDS)
# ============================================================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import time

# [추가 2026-05-10] FastAPI 전역 내부 인증 설정.
#
# 이유:
#   이 FastAPI 서버는 브라우저가 직접 사용하는 공개 API가 아니라
#   Express 서버가 세션 인증을 마친 뒤 호출하는 내부 데이터 계층이다.
#   포트 8000이 개발/배포 환경에서 실수로 외부에 열리면 Express 인증을 우회해
#   DB 변경 엔드포인트를 직접 호출할 수 있으므로, 내부 공유 키를 요구한다.
#
# 동작:
#   Express(src/backend/database.js, routes/login.js)가 모든 FastAPI 요청에
#   X-Internal-Api-Key 헤더를 붙이고, 아래 미들웨어가 .env의 INTERNAL_API_KEY와 비교한다.
#   /docs, /openapi.json 같은 문서 경로는 확인을 위해 열어두되 실제 API 호출은 차단한다.
#
# 결과:
#   키가 없거나 틀린 직접 호출은 403, 서버에 INTERNAL_API_KEY 자체가 없으면 500으로 실패한다.
#   즉, 설정 누락/직접 접근 모두 "실패 닫힘(fail closed)"으로 처리한다.
load_dotenv()
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
PUBLIC_PATHS = {"/docs", "/redoc", "/openapi.json", "/docs/oauth2-redirect", "/favicon.ico"}
SLOW_REQUEST_MS = int(os.getenv("SLOW_REQUEST_MS", "500"))

# 각 기능별 라우터 임포트
# - user     : 회원가입, 로그인, 세션 관리, 중복체크
# - routine  : 루틴 CRUD
# - completion: 루틴 완료 기록 (생성/조회/삭제)
# - feed     : 피드 게시물 CRUD
# - like     : 피드 좋아요 토글/조회
# - comment  : 피드 댓글 CRUD
# - mypage   : 마이페이지 summary/gallery 실제 데이터
# - stats    : 상세 분석 통계 실제 데이터
from routers import user, routine, completion, feed, like, comment, mypage, stats

# FastAPI 앱 인스턴스 생성
app = FastAPI()


@app.middleware("http")
async def require_internal_api_key(request: Request, call_next):
    """Express를 거치지 않은 FastAPI 직접 호출을 차단한다."""
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    if not INTERNAL_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"detail": "FastAPI INTERNAL_API_KEY가 설정되지 않았습니다."},
        )

    if request.headers.get("X-Internal-Api-Key") != INTERNAL_API_KEY:
        return JSONResponse(
            status_code=403,
            content={"detail": "FastAPI 내부 호출 인증에 실패했습니다."},
        )

    return await call_next(request)


@app.middleware("http")
async def log_slow_requests(request: Request, call_next):
    """[추가 2026-05-10] FastAPI 요청 처리 시간 측정."""
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000

    # 이유:
    #   Express 에서 느린 API가 보였을 때 FastAPI 내부도 함께 느린지 확인하기 위함.
    #   SLOW_REQUEST_MS 미만의 정상 요청은 로그를 남기지 않아 노이즈를 줄인다.
    if elapsed_ms >= SLOW_REQUEST_MS and request.url.path not in PUBLIC_PATHS:
        print(
            f"🐢 [fastapi] {request.method} {request.url.path} "
            f"{response.status_code} {elapsed_ms:.1f}ms"
        )

    return response

# ── 라우터 등록 ───────────────────────────────────────────────────────────────
# 각 라우터는 prefix로 URL 경로가 자동 분리됨
# 예: user.router → prefix="/user" → /user/signup, /user/{login_id} 등

# 유저 관련 라우터: /user/signup, /user/{login_id}, /user/session, /user/check/...
app.include_router(user.router)

# 루틴 관련 라우터: /routine/, /routine/{user_id}, /routine/{routine_id}
app.include_router(routine.router)

# 루틴 완료 기록 라우터: /completion/, /completion/today/{user_id}, /completion/history/{user_id}
app.include_router(completion.router)

# 피드 라우터: /feed/, /feed/{feed_id}, /feed/image
app.include_router(feed.router)

# 좋아요 라우터: /like/, /like/{feed_id}, /like/{feed_id}/{user_id}
app.include_router(like.router)

# 댓글 라우터: /comment/, /comment/{feed_id}, /comment/{comment_id}
app.include_router(comment.router)

# [추가 2026-05-10] 마이페이지/통계 실제 데이터 라우터 등록.
# 이유: MyPage.jsx / StatsPage.jsx 의 mock 값을 DB 기반 값으로 대체하기 위함.
# 설명: Express requireAuth 이후 user_id 를 붙여 호출하며, 내부 인증 헤더 미들웨어를 통과해야 한다.
app.include_router(mypage.router)
app.include_router(stats.router)
