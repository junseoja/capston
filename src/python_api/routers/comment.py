from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import pymysql
from uuid_extensions import uuid7str

router = APIRouter(prefix="/comment", tags=["comment"])

class CommentCreate(BaseModel):
    feed_id: str
    user_id: str
    content: str

# 댓글 작성
@router.post("/")
def create_comment(body: CommentCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()
            cursor.execute(
                """INSERT INTO feed_comments (comment_id, feed_id, user_id, content)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.feed_id, body.user_id, body.content)
            )
        conn.commit()
        return {"success": True, "comment_id": new_uuid}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 피드 댓글 목록 조회
@router.get("/{feed_id}")
def get_comments(feed_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT fc.*, u.nickname, u.profile_img
                FROM feed_comments fc
                JOIN users u ON fc.user_id = u.user_id
                WHERE fc.feed_id = %s
                ORDER BY fc.created_at ASC""",
                (feed_id,)
            )
            comments = cursor.fetchall()
        return comments
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 댓글 삭제
@router.delete("/{comment_id}")
def delete_comment(comment_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM feed_comments WHERE comment_id = %s",
                (comment_id,)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()