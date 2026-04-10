# 루틴 관련 API 라우터
# - POST   /routine/             : 루틴 생성 (UUID v7 PK 사용)
# - GET    /routine/{user_id}    : 특정 유저의 루틴 전체 조회
# - DELETE /routine/{routine_id} : 루틴 삭제

from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간순 정렬 가능한 UUID 생성

router = APIRouter(prefix="/routine", tags=["routine"])

# 루틴 생성 요청 데이터 스키마
class RoutineCreate(BaseModel):
    user_id: str              # UUID v7 (users.user_id FK) - str 타입으로 UUID 수신
    title: str                # 루틴 제목
    category: str             # 카테고리 (운동, 공부, 식단 등)
    time_slot: str            # 시간대 (morning / lunch / dinner) - 목표 시간으로 자동 분류됨
    routine_mode: str         # 완료 방식 (check / detail)
    goal: Optional[str] = ""          # 목표 시간 문자열 (예: "07:30")
    repeat_cycle: Optional[str] = ""  # 반복 주기 (예: "매일" 또는 "월, 수, 금")
    description: Optional[str] = ""   # 루틴 설명

# ── POST /routine/ ───────────────────────────────────────────────────────────
# 루틴 생성: UUID v7로 routine_id 생성 → routines 테이블 INSERT
# Express의 createRoutine()에서 호출 (user_id는 Express 세션에서 자동 주입)
@router.post("/")
def create_routine(body: RoutineCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 시간 기반 고유 routine_id 생성
            cursor.execute(
                """INSERT INTO routines (routine_id, user_id, title, category, time_slot, routine_mode, goal, repeat_cycle, description)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.user_id, body.title, body.category, body.time_slot,
                 body.routine_mode, body.goal, body.repeat_cycle, body.description)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── GET /routine/{user_id} ───────────────────────────────────────────────────
# 특정 유저의 루틴 전체 조회 (생성일 내림차순 - 최신 루틴이 먼저)
# Express의 getRoutines(user.user_id)에서 호출
# user_id: str 타입 (UUID v7)
@router.get("/{user_id}")
def get_routines(user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM routines WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            routines = cursor.fetchall()  # DictCursor → dict 배열 반환
        return routines
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── DELETE /routine/{routine_id} ─────────────────────────────────────────────
# 루틴 삭제: routine_id로 routines 테이블에서 DELETE
# routine_id: str 타입 (UUID v7)
# 주의: 현재 권한 검사 없음 → 추후 user_id 검증 추가 권장
@router.delete("/{routine_id}")
def delete_routine(routine_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM routines WHERE routine_id = %s",
                (routine_id,)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
