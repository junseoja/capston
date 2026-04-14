from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str

router = APIRouter(prefix="/completion", tags=["completion"])

class CompletionCreate(BaseModel):
    routine_id: str
    user_id: str
    proof_text: Optional[str] = ""

# 루틴 완료 생성
@router.post("/")
def create_completion(body: CompletionCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()
            cursor.execute(
                """INSERT INTO routine_completions (completion_id, routine_id, user_id, proof_text)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.routine_id, body.user_id, body.proof_text)
            )
        conn.commit()
        return {"success": True, "completion_id": new_uuid}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 유저의 오늘 완료 기록 조회
@router.get("/today/{user_id}")
def get_today_completions(user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT * FROM routine_completions
                WHERE user_id = %s
                AND DATE(completed_at) = CURDATE()
                ORDER BY completed_at DESC""",
                (user_id,)
            )
            completions = cursor.fetchall()
        return completions
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 루틴 완료 취소 (삭제)
@router.delete("/{completion_id}")
def delete_completion(completion_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM routine_completions WHERE completion_id = %s",
                (completion_id,)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 유저 전체 완료 기록 조회 (마이페이지용)
@router.get("/history/{user_id}")
def get_completion_history(user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT rc.*, r.title, r.category, r.routine_mode
                FROM routine_completions rc
                JOIN routines r ON rc.routine_id = r.routine_id
                WHERE rc.user_id = %s
                ORDER BY rc.completed_at DESC
                LIMIT 20""",
                (user_id,)
            )
            history = cursor.fetchall()
        return history
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()