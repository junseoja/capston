# ============================================================
# 피드(Feed) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /feed/          : 피드 게시물 생성
#   POST   /feed/image     : 피드 이미지 추가
#   GET    /feed/          : 전체 피드 목록 조회 (최신순, 좋아요/댓글 수 포함)
#   GET    /feed/{feed_id} : 특정 피드 상세 조회 (이미지, 댓글 포함)
#   DELETE /feed/{feed_id} : 피드 게시물 삭제
#
# DB 테이블:
#   feeds        : 피드 게시물 (feed_id PK, user_id FK, routine_id FK, completion_id FK, content)
#   feed_images  : 피드 첨부 이미지 (image_id PK, feed_id FK, file_url, file_type)
#
# 현재 상태:
#   React 프론트의 FeedPage는 App.jsx의 feedPosts state(메모리)를 사용 중
#   이 API는 구현되어 있지만 아직 프론트와 연결되지 않음
#   추후 FeedPage에서 직접 이 API를 호출하도록 연결 예정
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional, List
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /feed 접두사 라우터 생성
router = APIRouter(prefix="/feed", tags=["feed"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class FeedCreate(BaseModel):
    """피드 게시물 생성 요청 데이터 스키마"""
    user_id: str                        # UUID v7 (users.user_id FK)
    routine_id: str                     # UUID v7 (routines.routine_id FK)
    completion_id: str                  # UUID v7 (routine_completions.completion_id FK)
    content: Optional[str] = ""        # 게시물 본문 (인증 글)

class ImageCreate(BaseModel):
    """피드 이미지 추가 요청 데이터 스키마"""
    feed_id: str                        # UUID v7 (feeds.feed_id FK)
    file_url: str                       # 업로드된 이미지/영상 URL (S3 등)
    file_type: Optional[str] = ""      # 파일 MIME 타입 (예: "image/jpeg", "video/mp4")

# ── 피드 생성 (POST /feed/) ───────────────────────────────────────────────────

@router.post("/")
def create_feed(body: FeedCreate):
    """피드 게시물 생성

    루틴 완료 후 "피드에도 업로드하기" 체크 시 호출 예정.
    feeds 테이블에 INSERT 후 생성된 feed_id를 반환.
    이미지/영상은 별도로 POST /feed/image로 추가 필요.

    Args:
        body (FeedCreate): 피드 생성 데이터

    Returns:
        dict: {"success": True, "feed_id": "uuid-v7-..."}
            feed_id는 이미지 추가 시 사용

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 피드 고유 ID 생성
            cursor.execute(
                """INSERT INTO feeds (feed_id, user_id, routine_id, completion_id, content)
                VALUES (%s, %s, %s, %s, %s)""",
                (new_uuid, body.user_id, body.routine_id,
                body.completion_id, body.content)
                # created_at은 DB DEFAULT CURRENT_TIMESTAMP으로 자동 입력
            )
        conn.commit()
        return {"success": True, "feed_id": new_uuid}  # 이미지 추가에 feed_id 필요
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 피드 이미지 추가 (POST /feed/image) ──────────────────────────────────────

@router.post("/image")
def add_feed_image(body: ImageCreate):
    """피드 이미지/영상 추가

    피드 생성 후 첨부 파일을 추가할 때 호출.
    파일당 한 번씩 호출하며, 여러 파일이면 여러 번 호출.
    file_url은 S3 등 외부 스토리지에 업로드 후 받은 URL을 전달.

    Args:
        body (ImageCreate): 이미지 데이터 (feed_id, file_url, file_type)

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 이미지 레코드 고유 ID 생성
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

# ── 전체 피드 목록 조회 (GET /feed/) ─────────────────────────────────────────

@router.get("/")
def get_feeds():
    """전체 피드 목록 조회 (최신순, 좋아요/댓글 수 포함)

    FeedPage에서 피드 목록을 불러올 때 호출 예정.
    users, routines 테이블과 JOIN하여 닉네임, 루틴 제목, 카테고리도 함께 반환.
    feed_likes, feed_comments와 LEFT JOIN + COUNT로 좋아요/댓글 수도 포함.

    Returns:
        list[dict]: 피드 목록 (최신순)
                    각 항목: feed_id, content, created_at, nickname, profile_img,
                            routine_title, category, like_count, comment_count

    Raises:
        HTTPException 500: DB 조회 오류
    """
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
                    r.title AS routine_title,       -- 피드 카드에 루틴 제목 표시용
                    r.category,
                    COUNT(DISTINCT fl.like_id) AS like_count,       -- 좋아요 수 집계
                    COUNT(DISTINCT fc.comment_id) AS comment_count  -- 댓글 수 집계
                FROM feeds f
                JOIN users u ON f.user_id = u.user_id              -- 게시자 정보
                JOIN routines r ON f.routine_id = r.routine_id      -- 루틴 정보
                LEFT JOIN feed_likes fl ON f.feed_id = fl.feed_id   -- 없어도 feed 표시 (LEFT)
                LEFT JOIN feed_comments fc ON f.feed_id = fc.feed_id
                GROUP BY f.feed_id                                  -- 집계를 위해 feed_id로 그룹화
                ORDER BY f.created_at DESC"""                       # 최신 피드가 먼저
            )
            feeds = cursor.fetchall()
        return feeds
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 피드 상세 조회 (GET /feed/{feed_id}) ─────────────────────────────────────

@router.get("/{feed_id}")
def get_feed_detail(feed_id: str):
    """특정 피드 상세 조회 (이미지 + 댓글 포함)

    피드 상세 페이지에서 호출 예정.
    피드 기본 정보 + 첨부 이미지 목록 + 댓글 목록을 한 번에 반환.

    Args:
        feed_id (str): 조회할 피드의 UUID v7 (URL 경로 파라미터)

    Returns:
        dict: 피드 상세 정보
              - 기본 필드: feed_id, content, created_at, nickname, profile_img,
                        routine_title, category
              - images: 첨부 이미지 목록 [{image_id, feed_id, file_url, file_type}, ...]
              - comments: 댓글 목록 [{comment_id, feed_id, user_id, content,
                                    created_at, nickname}, ...]

    Raises:
        HTTPException 404: 해당 feed_id의 피드 없음
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # ── 피드 기본 정보 조회 ──
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

            # 피드가 없으면 404 반환
            if not feed:
                raise HTTPException(status_code=404, detail="피드를 찾을 수 없습니다.")

            # ── 첨부 이미지 목록 조회 ──
            cursor.execute(
                "SELECT * FROM feed_images WHERE feed_id = %s",
                (feed_id,)
            )
            images = cursor.fetchall()

            # ── 댓글 목록 조회 (작성 순서대로) ──
            cursor.execute(
                """SELECT fc.*, u.nickname
                FROM feed_comments fc
                JOIN users u ON fc.user_id = u.user_id
                WHERE fc.feed_id = %s
                ORDER BY fc.created_at ASC""",  # 댓글은 오래된 순으로 표시
                (feed_id,)
            )
            comments = cursor.fetchall()

        # dict에 images, comments 필드 추가 후 반환
        feed["images"] = images
        feed["comments"] = comments
        return feed
    except HTTPException:
        raise  # HTTPException(404)은 그대로 전달, 아래 except에서 잡지 않도록
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 피드 삭제 (DELETE /feed/{feed_id}) ───────────────────────────────────────

@router.delete("/{feed_id}")
def delete_feed(
    feed_id: str,
    user_id: str = Query(..., description="작성자 UUID v7 — 본인 피드만 삭제 가능")
):
    """피드 게시물 삭제 (소유자 검증 포함)

    WHERE feed_id = %s AND user_id = %s 조건으로 삭제하여
    다른 유저의 피드는 삭제되지 않도록 보장.
    ON DELETE CASCADE 설정이 되어 있으면 feed_images, feed_likes,
    feed_comments도 자동으로 삭제됨.

    Args:
        feed_id (str): 삭제할 피드의 UUID v7 (URL 경로 파라미터)
        user_id (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
                {"success": False, "message": "..."}  → 권한 없음

    Raises:
        HTTPException 500: DB 삭제 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM feeds WHERE feed_id = %s AND user_id = %s",
                (feed_id, user_id)
            )
            affected = cursor.rowcount

        conn.commit()

        if affected == 0:
            return {"success": False, "message": "삭제 권한이 없거나 존재하지 않는 피드입니다."}

        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
