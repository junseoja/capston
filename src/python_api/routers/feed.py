from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
from typing import Optional, List
import pymysql
from uuid_extensions import uuid7str

router = APIRouter(prefix="/feed", tags=["feed"])

class FeedCreate(BaseModel):
    user_id: str
    routine_id: str
    completion_id: str
    content: Optional[str] = ""

class ImageCreate(BaseModel):
    feed_id: str
    file_url: str
    file_type: Optional[str] = ""

# 피드 생성
@router.post("/")
def create_feed(body: FeedCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()
            cursor.execute(
                """INSERT INTO feeds (feed_id, user_id, routine_id, completion_id, content)
                VALUES (%s, %s, %s, %s, %s)""",
                (new_uuid, body.user_id, body.routine_id,
                body.completion_id, body.content)
            )
        conn.commit()
        return {"success": True, "feed_id": new_uuid}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 피드 이미지 추가
@router.post("/image")
def add_feed_image(body: ImageCreate):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()
            cursor.execute(
                """INSERT INTO feed_images (image_id, feed_id, file_url, file_type)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.feed_id, body.file_url, body.file_type)
            )
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 전체 피드 조회 (최신순) - 좋아요 수, 댓글 수 포함
@router.get("/")
def get_feeds():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT 
                f.feed_id,
                f.content,
                f.created_at,
                u.nickname,
                u.profile_img,
                r.title AS routine_title,
                r.category,
                COUNT(DISTINCT fl.like_id) AS like_count,
                COUNT(DISTINCT fc.comment_id) AS comment_count
                FROM feeds f
                JOIN users u ON f.user_id = u.user_id
                JOIN routines r ON f.routine_id = r.routine_id
                LEFT JOIN feed_likes fl ON f.feed_id = fl.feed_id
                LEFT JOIN feed_comments fc ON f.feed_id = fc.feed_id
                GROUP BY f.feed_id
                ORDER BY f.created_at DESC"""
            )
            feeds = cursor.fetchall()
        return feeds
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 특정 피드 상세 조회 (이미지 포함)
@router.get("/{feed_id}")
def get_feed_detail(feed_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 피드 기본 정보
            cursor.execute(
                """SELECT f.*, u.nickname, u.profile_img,
                        r.title AS routine_title, r.category
                FROM feeds f
                JOIN users u ON f.user_id = u.user_id
                JOIN routines r ON f.routine_id = r.routine_id
                WHERE f.feed_id = %s""",
                (feed_id,)
            )
            feed = cursor.fetchone()

            if not feed:
                raise HTTPException(status_code=404, detail="피드를 찾을 수 없습니다.")

            # 이미지 목록
            cursor.execute(
                "SELECT * FROM feed_images WHERE feed_id = %s",
                (feed_id,)
            )
            images = cursor.fetchall()

            # 댓글 목록
            cursor.execute(
                """SELECT fc.*, u.nickname
                FROM feed_comments fc
                JOIN users u ON fc.user_id = u.user_id
                WHERE fc.feed_id = %s
                ORDER BY fc.created_at ASC""",
                (feed_id,)
            )
            comments = cursor.fetchall()

        feed["images"] = images
        feed["comments"] = comments
        return feed
    except HTTPException:
        raise
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 피드 삭제
@router.delete("/{feed_id}")
def delete_feed(feed_id: str):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM feeds WHERE feed_id = %s", (feed_id,))
        conn.commit()
        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()