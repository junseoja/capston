# ============================================================
# 좋아요(Like) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /like/                    : 좋아요 추가 (이미 있으면 취소 = 토글)
#   GET    /like/{feed_id}           : 특정 피드 좋아요 수 조회
#   GET    /like/{feed_id}/{user_id} : 특정 유저가 해당 피드에 좋아요 했는지 확인
#
# DB 테이블: feed_likes
#   - like_id   : UUID v7 (PK)
#   - feed_id   : UUID v7 (FK → feeds.feed_id)
#   - user_id   : UUID v7 (FK → users.user_id)
#   - UNIQUE(feed_id, user_id): 한 유저가 같은 피드에 중복 좋아요 방지
#
# 좋아요 토글 메커니즘:
#   INSERT 시도 → IntegrityError(중복) 발생 → DELETE로 취소
# ============================================================

from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /like 접두사 라우터 생성
router = APIRouter(prefix="/like", tags=["like"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class LikeCreate(BaseModel):
    """좋아요 추가/취소 요청 데이터 스키마"""
    feed_id: str   # UUID v7 (feeds.feed_id FK) - 좋아요를 누를 피드
    user_id: str   # UUID v7 (users.user_id FK) - 좋아요를 누른 유저

# ── 좋아요 토글 (POST /like/) ─────────────────────────────────────────────────

@router.post("/")
def add_like(body: LikeCreate):
    """좋아요 추가 또는 취소 (토글)

    처리 흐름:
        1. feed_likes 테이블에 (feed_id, user_id) INSERT 시도
        2. 이미 좋아요 했으면 → IntegrityError(UNIQUE 중복) 발생
           → 해당 레코드를 DELETE (좋아요 취소)
        3. 처음 좋아요 → INSERT 성공

    Args:
        body (LikeCreate): {"feed_id": "...", "user_id": "..."}

    Returns:
        dict: {"success": True, "liked": True}  → 좋아요 추가됨
              {"success": True, "liked": False} → 좋아요 취소됨

    Raises:
        HTTPException 500: 예상치 못한 DB 오류

    NOTE:
        IntegrityError 처리 시 새 커넥션(conn2)을 열어 사용.
        이는 기존 conn이 오류 상태이기 때문.
        추후 단일 커넥션으로 개선하려면 트랜잭션 롤백 후 재시도 방식으로 변경 가능.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 좋아요 레코드 고유 ID 생성
            cursor.execute(
                """INSERT INTO feed_likes (like_id, feed_id, user_id)
                VALUES (%s, %s, %s)""",
                (new_uuid, body.feed_id, body.user_id)
            )
        conn.commit()
        return {"success": True, "liked": True}  # 좋아요 추가 완료
    except pymysql.err.IntegrityError:
        # UNIQUE(feed_id, user_id) 중복 → 이미 좋아요 누른 상태 → 취소 처리
        # 기존 conn은 오류 상태이므로 새 커넥션 사용
        conn2 = get_connection()
        try:
            with conn2.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM feed_likes WHERE feed_id = %s AND user_id = %s",
                    (body.feed_id, body.user_id)
                )
            conn2.commit()
            return {"success": True, "liked": False}  # 좋아요 취소 완료
        finally:
            conn2.close()  # 두 번째 커넥션도 반드시 닫기
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()  # 첫 번째 커넥션 반환

# ── 좋아요 수 조회 (GET /like/{feed_id}) ─────────────────────────────────────

@router.get("/{feed_id}")
def get_likes(feed_id: str):
    """특정 피드의 좋아요 수 조회

    피드 카드에 좋아요 수를 표시할 때 사용.
    (현재 GET /feed/ 의 like_count 집계와 중복 - 개별 업데이트 시 사용 예정)

    Args:
        feed_id (str): 조회할 피드의 UUID v7 (URL 경로 파라미터)

    Returns:
        dict: {"like_count": 5}

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                # COUNT(*): 해당 feed_id의 모든 좋아요 레코드 수 집계
                "SELECT COUNT(*) AS like_count FROM feed_likes WHERE feed_id = %s",
                (feed_id,)
            )
            result = cursor.fetchone()  # {"like_count": N}
        return result
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 좋아요 여부 확인 (GET /like/{feed_id}/{user_id}) ──────────────────────────

@router.get("/{feed_id}/{user_id}")
def check_like(feed_id: str, user_id: str):
    """특정 유저가 특정 피드에 좋아요 했는지 확인

    피드 페이지 로드 시 현재 유저의 좋아요 상태(하트 채워짐/비어있음)를
    초기화할 때 사용됨. Express feed.js의 GET /feed에서 각 피드별로 호출.

    Args:
        feed_id (str): 확인할 피드의 UUID v7 (URL 경로 파라미터)
        user_id (str): 확인할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        dict: {"liked": True}  → 이 유저가 이 피드에 좋아요 누른 상태
              {"liked": False} → 좋아요 안 누른 상태

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                # like_id만 SELECT (최소 데이터, 존재 여부만 확인)
                "SELECT like_id FROM feed_likes WHERE feed_id = %s AND user_id = %s",
                (feed_id, user_id)
            )
            result = cursor.fetchone()
        return {"liked": result is not None}  # 레코드 있으면 liked: True
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
