# ============================================================
# 루틴(Routine) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /routine/             : 루틴 생성 (UUID v7 PK 사용)
#   GET    /routine/{user_id}    : 특정 유저의 루틴 전체 조회 (최신순)
#   DELETE /routine/{routine_id} : 루틴 삭제
#
# 호출 흐름:
#   React(RoutinePage) → Express /routine → 이 라우터 → MySQL routines 테이블
#
# DB 테이블: routines
#   - routine_id : UUID v7 (PK)
#   - user_id    : UUID v7 (FK → users.user_id)
#   - title      : 루틴 제목
#   - category   : 카테고리 (운동, 공부, 식단 등)
#   - time_slot  : 시간대 (morning / lunch / dinner)
#   - routine_mode: 완료 방식 (check / detail)
#   - goal       : 목표 시간 문자열 (예: "07:30")
#   - repeat_cycle: 반복 주기 (예: "매일" 또는 "월, 수, 금")
#   - description: 루틴 설명
#   - created_at : 생성 일시 (자동)
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /routine 접두사 라우터 생성, Swagger UI 태그 "routine"으로 그룹화
router = APIRouter(prefix="/routine", tags=["routine"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class RoutineCreate(BaseModel):
    """루틴 생성 요청 데이터 스키마

    Express routine.js의 POST /routine 에서 전달하는 필드와 동일.
    user_id는 Express 세션에서 자동으로 주입되어 같이 전달됨.
    """
    user_id: str                         # UUID v7 (users.user_id FK) - 세션에서 자동 주입
    title: str                           # 루틴 제목 (필수)
    category: str                        # 카테고리 (운동, 공부, 식단 등) (필수)
    time_slot: str                       # 시간대 (morning/lunch/dinner) - 목표 시간으로 자동 분류됨
    routine_mode: str                    # 완료 방식: "check" (버튼) / "detail" (인증글+사진)
    goal: Optional[str] = ""            # 목표 시간 문자열 (예: "07:30"), 선택사항
    repeat_cycle: Optional[str] = ""    # 반복 주기 (예: "매일" 또는 "월, 수, 금"), 선택사항
    description: Optional[str] = ""     # 루틴 설명, 선택사항

# ── 루틴 생성 (POST /routine/) ────────────────────────────────────────────────

@router.post("/")
def create_routine(body: RoutineCreate):
    """루틴 생성 API

    UUID v7로 routine_id를 생성하고 routines 테이블에 INSERT.
    Express의 createRoutine() 에서 호출되며, user_id는 Express 세션에서 자동 주입됨.

    Args:
        body (RoutineCreate): 루틴 생성 데이터

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 시간 기반 고유 routine_id 생성 (정렬 가능한 UUID v7)
            cursor.execute(
                """INSERT INTO routines
                    (routine_id, user_id, title, category, time_slot,
                     routine_mode, goal, repeat_cycle, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.user_id, body.title, body.category,
                 body.time_slot, body.routine_mode, body.goal,
                 body.repeat_cycle, body.description)
            )
        conn.commit()  # INSERT 완료 후 트랜잭션 커밋
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()  # 항상 커넥션 반환

# ── 루틴 목록 조회 (GET /routine/{user_id}) ───────────────────────────────────

@router.get("/{user_id}")
def get_routines(user_id: str):
    """특정 유저의 루틴 전체 조회

    Express의 getRoutines(user_id) 에서 호출.
    최신 생성 순(created_at DESC)으로 정렬하여 반환.

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 루틴 목록 (DictCursor 사용으로 dict 배열 반환)
                    각 항목: routine_id, user_id, title, category, time_slot,
                             routine_mode, goal, repeat_cycle, description, created_at

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                # ORDER BY created_at DESC: 최신 루틴이 먼저 나오도록 정렬
                "SELECT * FROM routines WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            routines = cursor.fetchall()  # DictCursor → dict 배열 반환 (없으면 빈 리스트)
        return routines
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 루틴 삭제 (DELETE /routine/{routine_id}) ─────────────────────────────────

@router.delete("/{routine_id}")
def delete_routine(
    routine_id: str,
    user_id: str = Query(..., description="소유자 UUID v7 — Express 세션에서 전달")
):
    """루틴 삭제 API (소유자 검증 포함)

    Express의 deleteRoutine(routine_id, user_id) 에서 호출.
    WHERE routine_id = %s AND user_id = %s 조건으로 삭제하여
    다른 유저의 루틴은 삭제되지 않도록 보장.

    Args:
        routine_id (str): 삭제할 루틴의 UUID v7 (URL 경로 파라미터)
        user_id    (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
              {"success": False, "message": "..."}  → 권한 없음 (본인 루틴 아님)

    Raises:
        HTTPException 500: DB 삭제 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # AND user_id = %s: 본인 루틴이 아니면 WHERE 조건 불일치 → 0행 삭제
            cursor.execute(
                "DELETE FROM routines WHERE routine_id = %s AND user_id = %s",
                (routine_id, user_id)
            )
            affected = cursor.rowcount  # 실제로 삭제된 행 수

        conn.commit()

        if affected == 0:
            # 삭제된 행이 없음: 존재하지 않거나 본인 소유 아님
            return {"success": False, "message": "삭제 권한이 없거나 존재하지 않는 루틴입니다."}

        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
