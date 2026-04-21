# ============================================================
# 댓글(Comment) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /comment/             : 댓글 작성
#   GET    /comment/{feed_id}    : 특정 피드의 댓글 목록 조회 (작성 순)
#   DELETE /comment/{comment_id} : 댓글 삭제
#
# DB 테이블: feed_comments
#   - comment_id : UUID v7 (PK)
#   - feed_id    : UUID v7 (FK → feeds.feed_id)
#   - user_id    : UUID v7 (FK → users.user_id)
#   - content    : 댓글 내용
#   - created_at : 작성 일시 (자동)
#
# 연결 상태:
#   Express comment.js 라우터를 통해 프론트엔드와 연결 완료
#   FeedPage.jsx에서 댓글 모달을 통해 댓글 작성/삭제 기능 사용 가능
#   댓글 목록은 Express GET /feed 에서 피드 상세 조회 시 함께 반환됨
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /comment 접두사 라우터 생성
router = APIRouter(prefix="/comment", tags=["comment"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    """댓글 작성 요청 데이터 스키마"""
    feed_id: str   # UUID v7 (feeds.feed_id FK) - 댓글을 달 피드
    user_id: str   # UUID v7 (users.user_id FK) - 댓글 작성자
    content: str   # 댓글 내용 (필수, 빈 값 불허 - pydantic Optional 미사용)

# ── 댓글 작성 (POST /comment/) ───────────────────────────────────────────────

@router.post("/")
def create_comment(body: CommentCreate):
    """댓글 작성

    feed_comments 테이블에 새 댓글 레코드를 INSERT.
    댓글 작성 후 생성된 comment_id를 반환.

    Args:
        body (CommentCreate): 댓글 데이터 (feed_id, user_id, content)

    Returns:
        dict: {"success": True, "comment_id": "uuid-v7-..."}

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 댓글 레코드 고유 ID 생성
            cursor.execute(
                """INSERT INTO feed_comments (comment_id, feed_id, user_id, content)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.feed_id, body.user_id, body.content)
                # created_at은 DB DEFAULT CURRENT_TIMESTAMP으로 자동 입력
            )
        conn.commit()
        return {"success": True, "comment_id": new_uuid}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 댓글 목록 조회 (GET /comment/{feed_id}) ──────────────────────────────────

@router.get("/{feed_id}")
def get_comments(feed_id: str):
    """특정 피드의 댓글 목록 조회

    피드 상세 화면에서 댓글 목록을 불러올 때 사용됨.
    users 테이블과 JOIN하여 작성자 닉네임과 프로필 이미지도 함께 반환.
    작성 순서대로(created_at ASC) 정렬.

    NOTE: GET /feed/{feed_id} 에서도 comments를 포함하여 반환하므로
        피드 상세 페이지에서는 중복 호출하지 않아도 됨.

    Args:
        feed_id (str): 조회할 피드의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 댓글 목록 (작성 순)
                    각 항목: comment_id, feed_id, user_id, content,
                            created_at, nickname, profile_img

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT fc.*, u.nickname, u.profile_img
                FROM feed_comments fc
                JOIN users u ON fc.user_id = u.user_id    -- 작성자 닉네임/프로필 포함
                WHERE fc.feed_id = %s
                ORDER BY fc.created_at ASC""",             ## 오래된 댓글이 먼저
                (feed_id,)
            )
            comments = cursor.fetchall()
        return comments
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 댓글 삭제 (DELETE /comment/{comment_id}) ─────────────────────────────────

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: str,
    user_id: str = Query(..., description="작성자 UUID v7 — 본인 댓글만 삭제 가능")
):
    """댓글 삭제 (소유자 검증 포함)

    WHERE comment_id = %s AND user_id = %s 조건으로 삭제하여
    다른 유저의 댓글은 삭제되지 않도록 보장.

    Args:
        comment_id (str): 삭제할 댓글의 UUID v7 (URL 경로 파라미터)
        user_id    (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

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
                "DELETE FROM feed_comments WHERE comment_id = %s AND user_id = %s",
                (comment_id, user_id)
            )
            affected = cursor.rowcount

        conn.commit()

        if affected == 0:
            return {"success": False, "message": "삭제 권한이 없거나 존재하지 않는 댓글입니다."}

        return {"success": True}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
