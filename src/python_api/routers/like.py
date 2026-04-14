from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import pymysql
from uuid_extensions import uuid7str

router = APIRouter(prefix="/like", tags=["like"])

class LikeCreate(BaseModel):
    feed_id: str
    user_id: str

# 좋아요 추가
@router.post("/")
def add_like(body: LikeCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()
            cursor.execute(
                """INSERT INTO feed_likes (like_id, feed_id, user_id)
                VALUES (%s, %s, %s)""",
                (new_uuid, body.feed_id, body.user_id)
            )
        conn.commit()
        return {"success": True, "liked": True}
    except pymysql.err.IntegrityError:
        # 이미 좋아요 한 경우 → 좋아요 취소
        conn2 = get_connection()
        try:
            with conn2.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM feed_likes WHERE feed_id = %s AND user_id = %s",
                    (body.feed_id, body.user_id)
                )
            conn2.commit()
            return {"success": True, "liked": False}
        finally:
            conn2.close()
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 좋아요 수 조회
@router.get("/{feed_id}")
def get_likes(feed_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS like_count FROM feed_likes WHERE feed_id = %s",
                (feed_id,)
            )
            result = cursor.fetchone()
        return result
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 유저가 좋아요 했는지 확인
@router.get("/{feed_id}/{user_id}")
def check_like(feed_id: str, user_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT like_id FROM feed_likes WHERE feed_id = %s AND user_id = %s",
                (feed_id, user_id)
            )
            result = cursor.fetchone()
        return {"liked": result is not None}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()