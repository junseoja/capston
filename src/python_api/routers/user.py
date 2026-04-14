from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7 생성 라이브러리

router = APIRouter(prefix="/user", tags=["user"])

# ───── 요청 데이터 모델 ─────

class UserCreate(BaseModel):
    """회원가입 요청 데이터"""
    login_id: str
    password: str
    nickname: str
    birth_date: str   # "2000-03-15" 형식
    gender: str       # "남", "여", "기타"
    email: str

class SessionCreate(BaseModel):
    """세션 생성 요청 데이터"""
    session_id: str
    user_id: str      # UUID v7 형식

# ───── 회원가입 ─────

@router.post("/signup")
def signup(body: UserCreate):
    """
    회원가입 API
    - UUID v7로 user_id 생성
    - users 테이블에 유저 정보 저장
    - 아이디/이메일 중복 시 409 에러 반환
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # UUID v7 생성
            cursor.execute(
                """INSERT INTO users (user_id, login_id, password, nickname, birth_date, gender, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.login_id, body.password, body.nickname,
                body.birth_date, body.gender, body.email)
            )
        conn.commit()
        return {"success": True}
    except pymysql.err.IntegrityError:
        # 아이디 또는 이메일 중복
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디 또는 이메일입니다.")
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 유저 조회 ─────

@router.get("/{login_id}")
def get_user(login_id: str):
    """
    로그인 아이디로 유저 정보 조회
    - 로그인 시 비밀번호 확인용
    - 존재하지 않으면 빈 딕셔너리 반환
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE login_id = %s",
                (login_id,)
            )
            user = cursor.fetchone()
        return user if user else {}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 세션 저장 ─────

@router.post("/session")
def create_session(body: SessionCreate):
    """
    로그인 성공 시 세션 DB에 저장
    - expires_at: 현재 시간 + 1일 (자동 만료)
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO sessions (session_id, user_id, expires_at)
                VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 1 DAY))""",
                (body.session_id, body.user_id)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 세션 조회 ─────

@router.get("/session/{session_id}")
def get_session(session_id: str):
    """
    세션 ID로 세션 정보 조회
    - 만료된 세션은 조회 안됨 (expires_at > NOW())
    - 유저 정보(user_id, login_id, nickname) 함께 반환
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT s.session_id, u.user_id, u.login_id, u.nickname
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_id = %s
                AND s.expires_at > NOW()""",  # 만료 안된 세션만 조회
                (session_id,)
            )
            session = cursor.fetchone()
        return session if session else {}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 세션 삭제 (로그아웃) ─────

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    """
    로그아웃 시 세션 DB에서 삭제
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM sessions WHERE session_id = %s",
                (session_id,)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 아이디 중복체크 ─────

@router.get("/check/login_id/{login_id}")
def check_login_id(login_id: str):
    """
    회원가입 시 아이디 중복 여부 확인
    - isDuplicate: true → 이미 사용 중인 아이디
    - isDuplicate: false → 사용 가능한 아이디
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM users WHERE login_id = %s",
                (login_id,)
            )
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ───── 닉네임 중복체크 ─────

@router.get("/check/nickname/{nickname}")
def check_nickname(nickname: str):
    """
    회원가입 시 닉네임 중복 여부 확인
    - isDuplicate: true → 이미 사용 중인 닉네임
    - isDuplicate: false → 사용 가능한 닉네임
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM users WHERE nickname = %s",
                (nickname,)
            )
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()