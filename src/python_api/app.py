# FastAPI 앱 진입점
# - Express 백엔드(포트 3000)에서 HTTP 요청을 받아 실제 DB 작업을 처리
# - 포트 8000에서 실행 (uvicorn 사용)
# - 실행 명령: uvicorn app:app --reload --port 8000

from fastapi import FastAPI

from routers import user, routine  # 유저/루틴 라우터 모듈

app = FastAPI()

# 유저 관련 라우터 등록: /user/signup, /user/{login_id}
app.include_router(user.router)

# 루틴 관련 라우터 등록: /routine/, /routine/{user_id}, /routine/{routine_id}
app.include_router(routine.router)
