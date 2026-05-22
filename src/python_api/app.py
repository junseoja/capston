# ============================================================
# FastAPI 앱 진입점 (Entry Point)
# ============================================================
# 역할:
#   - Express 백엔드에서 내부 HTTP 요청을 받아 실제 DB 작업을 처리
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

# FastAPI는 브라우저 공개 API가 아니라 Express 뒤의 내부 데이터 계층이다.
# 모든 실제 API 요청은 X-Internal-Api-Key를 요구하고, 문서 경로만 공개 예외로 둔다.
# 키 누락/불일치와 서버 설정 누락은 모두 실패 응답으로 닫힌다.
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
# - notice   : 관리자 공지사항 CRUD
# - report   : 게시글 신고 접수 + 관리자 제재 처리
# - challenge : 챌린지 목록/참여/인증 등록·취소 + 관리자 CRUD/현황
from routers import user, routine, completion, feed, like, comment, mypage, stats
from routers import notice, report, challenge

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
    """FastAPI 요청 처리 시간을 측정하고 느린 요청만 로그로 남긴다."""
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000

    # Express 지연과 FastAPI/DB 지연을 분리해 볼 수 있도록 기준값 이상만 기록한다.
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

# 마이페이지/통계 라우터는 Express requireAuth가 전달한 user_id 기준으로 조회한다.
app.include_router(mypage.router)
app.include_router(stats.router)

# 관리자 공지/신고 라우터.
# 관리자 권한 검사는 Express notice.js/report.js에서 처리한 뒤 내부 키와 함께 호출한다.
# - notice : POST/GET/PATCH/DELETE /notice
# - report : POST /report, GET /report, GET /report/{id}, PATCH /report/process
app.include_router(notice.router)
app.include_router(report.router)

# 챌린지 라우터: 사용자 참여/인증과 관리자 CRUD/현황을 모두 포함한다.
app.include_router(challenge.router)
