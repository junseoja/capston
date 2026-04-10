from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # ✅ UUID v7 추가

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
            new_uuid = uuid7str()  # ✅ UUID v7 생성
            cursor.execute(
                """INSERT INTO users (user_id, login_id, password, nickname, birth_date, gender, email)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.login_id, body.password, body.nickname,
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

# 세션 저장
class SessionCreate(BaseModel):
    session_id: str
    user_id: str  # ✅ INT → str (UUID)

@router.post("/session")
def create_session(body: SessionCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO sessions (session_id, user_id) VALUES (%s, %s)",
                (body.session_id, body.user_id)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 세션 조회
@router.get("/session/{session_id}")
def get_session(session_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT s.session_id, u.user_id, u.login_id, u.nickname
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_id = %s""",
                (session_id,)
            )
            session = cursor.fetchone()
        return session if session else {}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 세션 삭제 (로그아웃)
@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM sessions WHERE session_id = %s", (session_id,))
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 아이디 중복체크
@router.get("/check/login_id/{login_id}")
def check_login_id(login_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE login_id = %s", (login_id,))
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 닉네임 중복체크
@router.get("/check/nickname/{nickname}")
def check_nickname(nickname: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE nickname = %s", (nickname,))
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()