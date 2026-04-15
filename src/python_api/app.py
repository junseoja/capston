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

from fastapi import FastAPI

# 각 기능별 라우터 임포트
# - user     : 회원가입, 로그인, 세션 관리, 중복체크
# - routine  : 루틴 CRUD
# - completion: 루틴 완료 기록 (생성/조회/삭제)
# - feed     : 피드 게시물 CRUD
# - like     : 피드 좋아요 토글/조회
# - comment  : 피드 댓글 CRUD
from routers import user, routine, completion, feed, like, comment

# FastAPI 앱 인스턴스 생성
app = FastAPI()

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
