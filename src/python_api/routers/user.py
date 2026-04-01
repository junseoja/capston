from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import pymysql

router = APIRouter(prefix="/user", tags=["user"])

class UserCreate(BaseModel):
    login_id: str
    password: str
    nickname: str
    birth_date: str
    gender: str
    email: str

# 회원가입
@router.post("/signup")
def signup(body: UserCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO users (login_id, password, nickname, birth_date, gender, email)
                VALUES (%s, %s, %s, %s, %s, %s)""",
                (body.login_id, body.password, body.nickname,
                body.birth_date, body.gender, body.email)
            )
        conn.commit()
        return {"success": True}
    except pymysql.err.IntegrityError:
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디 또는 이메일입니다.")
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 유저 조회 (로그인용)
@router.get("/{login_id}")
def get_user(login_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE login_id = %s", (login_id,))
            user = cursor.fetchone()
        return user if user else {}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()