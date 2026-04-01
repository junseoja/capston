from fastapi import FastAPI
from routers import user

app = FastAPI()

app.include_router(user.router)

##uvicorn app:app --reload --port 8000