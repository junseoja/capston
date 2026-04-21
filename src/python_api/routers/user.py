# ============================================================
# 유저(User) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /user/signup                    : 회원가입
#   GET    /user/{login_id}                : 아이디로 유저 조회 (로그인용)
#   POST   /user/session                   : 세션 생성 (로그인 성공 시 호출)
#   GET    /user/session/{session_id}      : 세션 조회 (인증 미들웨어 역할)
#   DELETE /user/session/{session_id}      : 세션 삭제 (로그아웃)
#   GET    /user/check/login_id/{login_id} : 아이디 중복 확인
#   GET    /user/check/nickname/{nickname} : 닉네임 중복 확인
#
# 호출 흐름:
#   React → Express(3000) → 이 라우터(8000) → MySQL
#
# 비밀번호 처리 전략:
#   - Express(login.js)에서 bcryptjs로 해싱 후 이 라우터로 전달
#   - 이 라우터는 받은 해시를 그대로 DB에 저장 (이중 해싱 방지)
#   - 로그인 시 bcrypt.compare()는 Express에서 처리
# ============================================================

from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
import bcrypt as bcrypt_lib  # 비밀번호 해시 검증용 (해싱은 Express에서 수행)
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성 라이브러리

# /user 접두사 라우터 생성, Swagger UI 태그 "user"로 그룹화
router = APIRouter(prefix="/user", tags=["user"])

# ── 요청 데이터 모델 (Pydantic BaseModel) ────────────────────────────────────
# Pydantic이 자동으로 타입 검증 및 JSON 파싱을 처리함

class UserCreate(BaseModel):
    """회원가입 요청 데이터 스키마

    Express login.js의 createUser() 에서 전달하는 필드와 동일
    """
    login_id: str    # 로그인 아이디 (5~15자, 영문 소문자+숫자)
    password: str    # 비밀번호 (Express에서 bcryptjs로 해싱된 값이 전달됨)
    nickname: str    # 닉네임 (2~10자)
    birth_date: str  # 생년월일 "YYYY-MM-DD" 형식 (Express에서 변환 후 전달)
    gender: str      # 성별 DB ENUM: "남", "여", "기타"
    email: str       # 이메일 주소

class SessionCreate(BaseModel):
    """세션 생성 요청 데이터 스키마

    Express login.js의 /login 라우트에서 로그인 성공 후 호출
    """
    session_id: str  # UUID v4 (Express에서 생성)
    user_id: str     # UUID v7 (users 테이블의 PK)

# ── 회원가입 ─────────────────────────────────────────────────────────────────

@router.post("/signup")
def signup(body: UserCreate):
    """회원가입 API

    처리 흐름:
        1. UUID v7로 새 user_id 생성
        2. users 테이블에 유저 정보 INSERT
        3. 성공 시 {"success": True} 반환

    Args:
        body (UserCreate): 회원가입 데이터 (login_id, password, nickname, birth_date, gender, email)

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 409: login_id 또는 email 중복 (UNIQUE 제약 위반)
        HTTPException 500: 기타 DB 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 시간 기반 고유 user_id 생성 (UUID v7)
            cursor.execute(
                """INSERT INTO users (user_id, login_id, password, nickname, birth_date, gender, email)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                # body.password: Express에서 bcryptjs로 해싱된 값이 전달됨 (평문 아님)
                (new_uuid, body.login_id, body.password, body.nickname,
                body.birth_date, body.gender, body.email)
            )
        conn.commit()  # INSERT 완료 후 커밋 (이전까지는 트랜잭션 미완료 상태)
        return {"success": True}
    except pymysql.err.IntegrityError:
        # UNIQUE 제약 위반: login_id 또는 email이 이미 존재
        raise HTTPException(status_code=409, detail="이미 존재하는 아이디 또는 이메일입니다.")
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()  # 성공/실패 관계없이 항상 커넥션 반환

# ── 유저 조회 ─────────────────────────────────────────────────────────────────

@router.get("/{login_id}")
def get_user(login_id: str):
    """로그인 아이디로 유저 정보 조회

    Express login.js의 findUser() 에서 호출.
    로그인 시 비밀번호 비교, /me 엔드포인트의 유저 조회에 사용.

    Args:
        login_id (str): 조회할 로그인 아이디 (URL 경로 파라미터)

    Returns:
        dict: 유저 정보 (user_id, login_id, password, nickname, email, gender, birth_date, profile_img 등)
              유저가 없으면 빈 딕셔너리 {} 반환
              → Express에서 Object.keys(data).length === 0 으로 없음 판단

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE login_id = %s",
                (login_id,)  # 파라미터 바인딩으로 SQL Injection 방지
            )
            user = cursor.fetchone()  # 한 행만 반환 (login_id는 UNIQUE)
        return user if user else {}   # 없으면 빈 dict 반환 (None 대신)
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 세션 저장 ─────────────────────────────────────────────────────────────────

@router.post("/session")
def create_session(body: SessionCreate):
    """로그인 성공 시 세션 DB에 저장

    Express login.js의 /login 라우트에서 비밀번호 확인 후 호출.
    sessions 테이블에 session_id와 user_id를 저장하며, expires_at을 1일 후로 설정.

    Args:
        body (SessionCreate): {"session_id": "uuid-v4", "user_id": "uuid-v7"}

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO sessions (session_id, user_id, expires_at)
                VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 1 DAY))""",
                # DATE_ADD(NOW(), INTERVAL 1 DAY): 현재 시간 + 1일 → 세션 만료 시간
                (body.session_id, body.user_id)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 세션 조회 ─────────────────────────────────────────────────────────────────

@router.get("/session/{session_id}")
def get_session(session_id: str):
    """세션 ID로 세션 정보 조회 (인증 검증)

    Express의 findSession() 에서 호출.
    쿠키의 sessionId로 유효한 세션인지 확인하며, 유저 정보도 함께 반환.
    모든 보호된 라우트(/routine, /me, /logout 등)에서 사용됨.

    Args:
        session_id (str): 브라우저 쿠키에서 가져온 세션 ID (URL 경로 파라미터)

    Returns:
        dict: {"session_id": ..., "user_id": ..., "login_id": ..., "nickname": ...}
              만료된 세션이거나 없으면 빈 딕셔너리 {} 반환

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT s.session_id, u.user_id, u.login_id, u.nickname
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_id = %s
                AND s.expires_at > NOW()""",
                # AND s.expires_at > NOW(): 만료된 세션은 자동으로 조회 안됨
                (session_id,)
            )
            session = cursor.fetchone()
        return session if session else {}  # 없거나 만료된 세션이면 빈 dict
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 세션 삭제 (로그아웃) ──────────────────────────────────────────────────────

@router.delete("/session/{session_id}")
def delete_session(session_id: str):
    """로그아웃 시 세션 DB에서 삭제

    Express login.js의 /logout 라우트에서 호출.
    DB에서 세션 레코드를 삭제하면 해당 세션 ID로는 더 이상 인증 불가.

    Args:
        session_id (str): 삭제할 세션 ID (URL 경로 파라미터)

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 500: DB 삭제 오류
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

# ── 아이디 중복체크 ───────────────────────────────────────────────────────────

@router.get("/check/login_id/{login_id}")
def check_login_id(login_id: str):
    """회원가입 시 아이디 중복 여부 확인

    Express login.js의 /check-duplicate?field=userId 에서 호출.
    SignupPage.jsx의 중복체크 버튼 클릭 시 Express를 경유하여 이 엔드포인트에 도달.

    Args:
        login_id (str): 중복 확인할 아이디 (URL 경로 파라미터)

    Returns:
        dict: {"isDuplicate": True}  → 이미 사용 중인 아이디
              {"isDuplicate": False} → 사용 가능한 아이디

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # user_id만 SELECT (최소 데이터 조회로 성능 최적화)
            cursor.execute(
                "SELECT user_id FROM users WHERE login_id = %s",
                (login_id,)
            )
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}  # 결과 있으면 중복
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 닉네임 중복체크 ───────────────────────────────────────────────────────────

@router.get("/check/nickname/{nickname}")
def check_nickname(nickname: str):
    """회원가입 시 닉네임 중복 여부 확인

    Express login.js의 /check-duplicate?field=nickname 에서 호출.
    SignupPage.jsx의 중복체크 버튼 클릭 시 Express를 경유하여 이 엔드포인트에 도달.

    Args:
        nickname (str): 중복 확인할 닉네임 (URL 경로 파라미터)

    Returns:
        dict: {"isDuplicate": True}  → 이미 사용 중인 닉네임
              {"isDuplicate": False} → 사용 가능한 닉네임

    Raises:
        HTTPException 500: DB 조회 오류
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
