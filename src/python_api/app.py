from fastapi import FastAPI

from routers import user, routine  # ✅ routine 추가


app = FastAPI()

app.include_router(user.router)
app.include_router(routine.router)  # ✅ 추가

##uvicorn app:app --reload --port 8000