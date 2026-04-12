# 유저 관련 API 라우터
# - POST   /user/signup                  : 회원가입 (UUID v7 PK 사용)
# - GET    /user/{login_id}              : 로그인/세션 검증용 유저 조회
# - POST   /user/session                 : 세션 DB 저장 (Express 메모리 세션 대체 준비 중)
# - GET    /user/session/{session_id}    : 세션 조회 (유저 정보 JOIN)
# - DELETE /user/session/{session_id}    : 세션 삭제 (로그아웃)
# - GET    /user/check/login_id/{login_id}: 아이디 중복체크
# - GET    /user/check/nickname/{nickname}: 닉네임 중복체크

from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간순 정렬 가능한 UUID 생성

router = APIRouter(prefix="/user", tags=["user"])

# 회원가입 요청 데이터 스키마
# Pydantic BaseModel: 요청 body 자동 파싱 + 타입 검증
class UserCreate(BaseModel):
    login_id: str   # 로그인 아이디 (5~15자 영문 소문자+숫자)
    password: str   # 비밀번호 (평문 저장 중 - 추후 bcrypt 해싱 권장)
    nickname: str   # 닉네임 (2~10자)
    birth_date: str # 생년월일 "YYYY-MM-DD" 형식
    gender: str     # 성별 ("남" / "여" / "기타")
    email: str      # 이메일

# ── POST /user/signup ────────────────────────────────────────────────────────
# 회원가입: UUID v7로 user_id 생성 → users 테이블 INSERT
# UUID v7: 시간순 정렬이 가능한 UUID (기존 AUTO_INCREMENT int에서 변경됨)
@router.post("/signup")
def signup(body: UserCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 시간 기반 고유 ID 생성 (예: "01965b3a-...")
            cursor.execute(
                """INSERT INTO users (user_id, login_id, password, nickname, birth_date, gender, email)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.login_id, body.password, body.nickname,
                 body.birth_date, body.gender, body.email)
            )
        conn.commit()
        return {"success": True}
    except pymysql.err.IntegrityError:
        # UNIQUE 제약 위반: login_id 또는 email 중복
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디 또는 이메일입니다.")
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()  # 요청마다 커넥션 해제 (추후 커넥션 풀 적용 권장)

# ── GET /user/{login_id} ─────────────────────────────────────────────────────
# login_id로 유저 전체 정보 조회
# Express의 findUser()에서 호출 → 로그인, /me, 중복체크 시 사용
# 유저 없으면 빈 dict {} 반환 (Express에서 null 처리)
@router.get("/{login_id}")
def get_user(login_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE login_id = %s", (login_id,))
            user = cursor.fetchone()  # DictCursor → dict or None
        return user if user else {}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 세션 관련 (DB 저장 방식으로 전환 준비 중) ──────────────────────────────
# 현재 Express는 메모리 Map으로 세션 관리
# 아래 API는 sessions 테이블에 DB 저장하는 방식으로 교체하기 위한 준비

# 세션 저장 요청 스키마
class SessionCreate(BaseModel):
    session_id: str  # UUID v4 세션 ID
    user_id: str     # UUID v7 유저 ID

# ── POST /user/session ───────────────────────────────────────────────────────
# 세션 생성: sessions 테이블에 INSERT
# 서버 재시작 후에도 세션 유지 가능 (메모리 Map의 한계 해결)
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

# ── GET /user/session/{session_id} ───────────────────────────────────────────
# 세션 조회: session_id → users JOIN → 유저 정보 반환
# 세션이 없으면 빈 dict {} 반환
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

# ── DELETE /user/session/{session_id} ────────────────────────────────────────
# 세션 삭제: 로그아웃 시 sessions 테이블에서 해당 세션 제거
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

# ── GET /user/check/login_id/{login_id} ─────────────────────────────────────
# 아이디 중복체크: 해당 login_id가 존재하면 isDuplicate: true
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

# ── GET /user/check/nickname/{nickname} ──────────────────────────────────────
# 닉네임 중복체크: 해당 nickname이 존재하면 isDuplicate: true
# Express의 /check-duplicate?field=nickname 에서 현재 미연결 상태 → 연결 필요
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
