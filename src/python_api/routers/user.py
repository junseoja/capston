# ============================================================
# 유저(User) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /user/signup                    : 회원가입
#   GET    /user/{login_id}                : 아이디로 유저 조회 (로그인용)
#   POST   /user/session                   : 세션 생성 (로그인 성공 시 호출)
#   GET    /user/session/{session_id}      : 세션 조회 (인증 미들웨어 역할)
#   DELETE /user/session/{session_id}      : 세션 삭제 (로그아웃)
#   PATCH  /user/password/{user_id}        : 비밀번호 해시 업데이트 (Lazy Migration 전용)
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
#
# ─────────────────────────────────────────────────────────────────
# [Soft Delete 도입 2026-05-01]
# ─────────────────────────────────────────────────────────────────
# users 테이블에도 deleted_at 컬럼이 추가되었음 (NULL=활성, NOT NULL=탈퇴).
# 회원 탈퇴 엔드포인트 자체는 본 작업 범위가 아니므로 추가하지 않으나,
# "탈퇴한 사용자가 다시 로그인되거나 검색되지 않도록" 모든 조회/세션 관련
# SQL 에 WHERE deleted_at IS NULL (또는 u.deleted_at IS NULL) 을 추가한다.
#
# 영향:
#   - get_user (로그인용)        : 탈퇴 사용자 조회 차단
#   - get_session                : JOIN 한 user 가 탈퇴 상태면 세션 무효
#   - check_login_id / nickname  : 탈퇴 사용자의 ID/닉네임은 재사용 가능
#
# 추후 회원 탈퇴 기능 도입 시:
#   - DELETE /user/me 같은 엔드포인트에서 UPDATE users SET deleted_at = NOW()
#   - 이때 login_id/email UNIQUE 제약과 충돌 가능 → 별도 정책 필요
#     (해당 시점에 검토)
# ─────────────────────────────────────────────────────────────────

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

# ─────────────────────────────────────────────────────────────────────────────
# [추가 2026-04-29] 비밀번호 업데이트 요청 스키마
# ─────────────────────────────────────────────────────────────────────────────
# 평문 비밀번호 Lazy Migration 용도로 신설.
#   - Express login.js 가 평문 비번 매치 성공 시 즉시 bcrypt 해시 생성 후
#     이 엔드포인트로 PATCH 호출하여 DB 의 password 를 해시값으로 교체.
#   - 따라서 이 모델의 password 필드는 "이미 해싱된 bcrypt 문자열($2b$...)" 만
#     들어와야 함. 평문이 들어오면 사실상 평문 저장이 되어 보안 사고가 됨.
# ─────────────────────────────────────────────────────────────────────────────
class PasswordUpdate(BaseModel):
    """비밀번호 업데이트 요청 데이터 스키마 (반드시 bcrypt 해시값을 받음)"""
    password: str  # bcrypt 해시 문자열 (~60자, "$2a$" 또는 "$2b$" 로 시작)

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
            # [수정 2026-05-01] Soft Delete 필터 추가:
            #   AND deleted_at IS NULL → 탈퇴한 사용자는 로그인/조회 대상에서 제외.
            #   현재는 회원 탈퇴 엔드포인트가 없어 항상 0건 매치되지만,
            #   향후 도입 시 자동으로 차단되도록 미리 적용.
            cursor.execute(
                "SELECT * FROM users WHERE login_id = %s AND deleted_at IS NULL",
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
            # [수정 2026-05-01] Soft Delete 필터 추가:
            #   AND u.deleted_at IS NULL → 세션은 살아있어도 사용자가 탈퇴 상태면
            #   세션을 무효 처리하여 보호 라우트 접근 차단.
            #   (탈퇴 직후 로그인 상태였던 사용자가 자동으로 로그아웃되는 효과)
            cursor.execute(
                """SELECT s.session_id, u.user_id, u.login_id, u.nickname
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_id = %s
                  AND s.expires_at > NOW()
                  AND u.deleted_at IS NULL""",
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

# ─────────────────────────────────────────────────────────────────────────────
# [추가 2026-04-29] 비밀번호 업데이트 엔드포인트 (Lazy Migration 전용)
# ─────────────────────────────────────────────────────────────────────────────
# 배경:
#   기존에는 일부 사용자 비밀번호가 평문으로 DB 에 저장되어 있어,
#   Express login.js 에 "평문 매치" 라는 보안상 취약한 폴백 로직이 존재했음.
#   이 폴백을 즉시 제거하면 평문 계정 사용자들이 로그인 불가가 되므로,
#   "로그인 성공 시점에 자동으로 bcrypt 해시로 업그레이드" 하는 패턴(Lazy Migration)
#   을 도입하여 점진적 마이그레이션을 수행한다.
#
# 호출 흐름:
#   사용자 로그인(평문 매치 성공)
#     → Express 가 bcrypt.hash(평문, 10) 로 해시 생성
#     → 이 PATCH /user/password/{user_id} 호출
#     → DB 의 users.password 컬럼이 해시값으로 교체
#     → 다음 로그인부터는 bcrypt.compare 분기로 흘러감
#
# 보안 주의사항:
#   - [수정 2026-05-10] 본 엔드포인트는 사용자 세션 검증 대신
#     app.py 전역 미들웨어의 X-Internal-Api-Key 검사를 통과한 내부 호출만 허용한다.
#     이유: Lazy Migration 은 Express 로그인 흐름 내부에서만 필요하며,
#     외부 직접 호출이 가능하면 임의 user_id 의 password 컬럼 변경으로 이어질 수 있다.
#   - 네트워크 레벨에서도 FastAPI(8000) 는 외부 노출을 차단(보안 그룹/방화벽)해야 한다.
#   - 일반적인 "비밀번호 변경" UI 가 추가될 경우 별도 엔드포인트로 분리 권장.
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/password/{user_id}")
def update_password(user_id: str, body: PasswordUpdate):
    """유저 비밀번호 해시값 업데이트 (Lazy Migration 용)

    호출자는 반드시 bcrypt 해싱된 문자열을 body.password 로 전달해야 한다.
    엔드포인트 자체는 해싱을 수행하지 않고 단순히 컬럼을 UPDATE 한다.

    Args:
        user_id (str): 업데이트 대상 유저 UUID v7 (URL 경로 파라미터)
        body (PasswordUpdate): {"password": "$2b$10$..."} (bcrypt 해시)

    Returns:
        dict: {"success": True}  → UPDATE 성공
              {"success": False, "message": "..."} → 대상 유저가 존재하지 않음

    Raises:
        HTTPException 500: DB 업데이트 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET password = %s WHERE user_id = %s",
                (body.password, user_id)
            )
            affected = cursor.rowcount  # UPDATE 된 행 수 — 0 이면 user_id 가 없거나 동일값
        conn.commit()

        # affected == 0 → 해당 user_id 의 행이 없거나 이미 같은 해시값으로 저장됨
        # MySQL 은 동일값 UPDATE 시 rowcount 0 을 반환할 수 있어 두 케이스가 합쳐짐.
        # 실제 운영에서는 user_id 미존재 케이스가 사실상 없으므로 관대하게 success 처리.
        if affected == 0:
            # 안전을 위해 별도 SELECT 로 존재 여부 검증
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT user_id FROM users WHERE user_id = %s",
                    (user_id,)
                )
                exists = cursor.fetchone() is not None
            if not exists:
                return {"success": False, "message": "존재하지 않는 user_id 입니다."}

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
            # [수정 2026-05-01] Soft Delete 필터 추가:
            #   AND deleted_at IS NULL → 탈퇴한 사용자의 login_id 는 재사용 가능하도록
            #   중복으로 보지 않음.
            #   ※ 다만 users 테이블의 UNIQUE(login_id) 제약은 그대로이므로,
            #     실제 회원 탈퇴 기능 추가 시 재가입을 허용하려면 UNIQUE 제약 정책도
            #     함께 검토해야 한다 (예: UNIQUE (login_id, deleted_at) 등).
            cursor.execute(
                "SELECT user_id FROM users WHERE login_id = %s AND deleted_at IS NULL",
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
            # [수정 2026-05-01] Soft Delete 필터 추가:
            #   AND deleted_at IS NULL → 탈퇴한 사용자의 닉네임은 재사용 가능.
            #   (login_id 와 달리 nickname 에는 UNIQUE 제약이 걸려있지 않으므로
            #    DB 레벨 충돌은 없으나, 의미상 일관된 동작을 위해 동일 정책 적용)
            cursor.execute(
                "SELECT user_id FROM users WHERE nickname = %s AND deleted_at IS NULL",
                (nickname,)
            )
            user = cursor.fetchone()
        return {"isDuplicate": user is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
