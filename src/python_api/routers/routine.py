from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # ✅ UUID v7 추가

router = APIRouter(prefix="/routine", tags=["routine"])

class RoutineCreate(BaseModel):
    user_id: str          # ✅ INT → str (UUID)
    title: str
    category: str
    time_slot: str
    routine_mode: str
    goal: Optional[str] = ""
    repeat_cycle: Optional[str] = ""
    description: Optional[str] = ""

# 루틴 생성
@router.post("/")
def create_routine(body: RoutineCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # ✅ UUID v7 생성
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

# 유저 루틴 전체 조회
@router.get("/{user_id}")
def get_routines(user_id: str):  # ✅ int → str (UUID)
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM routines WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            routines = cursor.fetchall()
        return routines
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 루틴 삭제
@router.delete("/{routine_id}")
def delete_routine(routine_id: str):  # ✅ int → str (UUID)
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