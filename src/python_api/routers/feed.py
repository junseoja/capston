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
# 연결 상태:
#   Express feed.js 라우터를 통해 프론트엔드와 연결 완료
#   FeedPage.jsx에서 GET /feed로 피드 목록 조회
#   App.jsx에서 POST /feed로 피드 생성 (상세 루틴 완료 시 피드 업로드)
#   파일 업로드는 Express multer가 디스크에 저장 후 URL을 POST /feed/image로 전달
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
    file_url: str                       # 업로드된 이미지/영상 URL (Express uploads/ 경로)
    file_type: Optional[str] = ""      # 파일 MIME 타입 (예: "image/jpeg", "video/mp4")

# ── 피드 생성 (POST /feed/) ───────────────────────────────────────────────────

@router.post("/")
def create_feed(body: FeedCreate):
    """피드 게시물 생성

    루틴 완료 후 "피드에도 업로드하기" 체크 시 Express feed.js를 통해 호출됨.
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
    file_url은 Express multer가 디스크에 저장한 파일의 경로 (예: /uploads/xxx.jpg).

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

# ─────────────────────────────────────────────────────────────────────────────
# [수정 2026-05-03] 신규 #10 + 신규 #11 동시 해결
# ─────────────────────────────────────────────────────────────────────────────
# 기존 문제:
#   1) Express GET /feed 가 본 엔드포인트로 피드 목록을 받은 뒤,
#      각 피드마다 GET /feed/{feed_id} (이미지+댓글) 와 GET /like/{feed_id}/{uid}
#      를 추가 호출하여 N+1 쿼리 발생 — 피드 100개 시 HTTP 호출 201회.
#   2) LIMIT 절 없이 전체 피드를 한 번에 반환 — 피드 1000개 시 페이로드 폭증.
#
# 해결:
#   본 엔드포인트에 user_id / cursor / limit 쿼리 파라미터를 추가하여
#   - 피드 + 현재 사용자 좋아요 상태(LEFT JOIN feed_likes) + 카운트 = 단일 쿼리
#   - 이미지는 페이지 단위 피드 ID 목록으로 한 번의 IN 쿼리
#   - 댓글은 응답에서 제외 (모달 열 때 GET /comment/{feed_id} 별도 호출)
#   - cursor "<created_at_iso>_<feed_id>" 형태로 안정적인 페이지네이션
#
# 하위 호환:
#   모든 신규 파라미터는 optional + 기본값 보유.
#   user_id 미전달 시 liked 는 항상 false 로 채움.
#   cursor 미전달 시 첫 페이지부터 limit 만큼 반환.
#
# 응답 형식 변경 (구버전: list, 신버전: dict):
#   기존: 피드 배열만 반환
#   신규: { feeds: [...], next_cursor: "<...>" | null }
#   → Express getFeeds() 와 routes/feed.js 가 동시에 갱신되므로 호환 OK.
# ─────────────────────────────────────────────────────────────────────────────

# ── 헬퍼: cursor 직렬화/역직렬화 ──
# cursor 문자열은 "<created_at_iso>_<feed_id>" 형태.
# created_at 은 KST 기준 ISO 8601 문자열, feed_id 는 UUID v7.
# UUID 와 ISO 시간에는 '_' 가 포함되지 않아 안전하게 1회 split 가능.

def _parse_cursor(cursor: Optional[str]):
    """cursor 문자열을 (created_at_iso, feed_id) 튜플로 분해.

    유효하지 않은 형식이면 None 을 반환하여 "첫 페이지" 로 간주.
    """
    if not cursor:
        return None
    parts = cursor.split("_", 1)
    if len(parts) != 2:
        return None
    return (parts[0], parts[1])


def _build_cursor(created_at, feed_id: str) -> str:
    """다음 cursor 문자열 생성. created_at 이 datetime 이면 isoformat() 적용."""
    ts = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)
    return f"{ts}_{feed_id}"


@router.get("/")
def get_feeds(
    user_id: Optional[str] = Query(
        None,
        description="현재 로그인한 사용자 UUID v7 — 각 피드의 좋아요 상태(liked) 결정용. 미전달 시 liked=False",
    ),
    cursor: Optional[str] = Query(
        None,
        description="페이지 커서 '<created_at_iso>_<feed_id>'. 첫 페이지면 미전달",
    ),
    limit: int = Query(20, ge=1, le=100, description="페이지 크기 (1~100)"),
):
    """전체 피드 목록 조회 (최신순, 좋아요/댓글 수 + 이미지 포함, 커서 기반 페이지네이션)

    FeedPage에서 피드 목록을 불러올 때 Express feed.js를 통해 호출됨.
    users, routines 테이블과 JOIN하여 닉네임, 루틴 제목, 카테고리 함께 반환.
    feed_likes, feed_comments와 LEFT JOIN + COUNT로 좋아요/댓글 수도 포함.

    [수정 2026-05-03]
        - user_id / cursor / limit 쿼리 파라미터 추가 (모두 optional)
        - 좋아요 상태(liked)를 단일 쿼리에 결합 → N+1 제거
        - 이미지를 페이지 단위 IN 쿼리 1회로 일괄 조회
        - 응답을 { feeds, next_cursor } dict 로 변경

    Returns:
        dict: {
            "feeds": [
                {
                    feed_id, content, created_at, nickname, profile_img,
                    routine_title, category, like_count, comment_count,
                    liked,           # bool — user_id 의 좋아요 상태
                    images: [...],  # 첨부 이미지 목록 (file_url, file_type 등)
                },
                ...
            ],
            "next_cursor": "<...>" | None,  # 다음 페이지 cursor, 더 없으면 None
        }

    Raises:
        HTTPException 500: DB 조회 오류
    """
    parsed_cursor = _parse_cursor(cursor)

    conn = get_connection()
    try:
        # ────────────────────────────────────────────────────────────────
        # [수정 2026-05-01] Soft Delete: routines/users LEFT JOIN + COALESCE fallback
        # [수정 2026-05-03] N+1 제거를 위해 좋아요 상태(liked) 를 동일 쿼리에 결합
        #                   + 커서 기반 페이지네이션 적용
        # ────────────────────────────────────────────────────────────────
        # 좋아요 상태 결합 방식:
        #   LEFT JOIN feed_likes fl_me ON fl_me.feed_id=f.feed_id
        #                              AND fl_me.user_id=:user_id
        #   → fl_me.like_id IS NOT NULL AS liked
        #   user_id 가 None 이면 조건이 NULL=NULL 이므로 항상 매칭 실패 → liked=false
        #
        # 커서 페이지네이션:
        #   ORDER BY f.created_at DESC, f.feed_id DESC
        #   WHERE (f.created_at, f.feed_id) < (:cursor_ts, :cursor_id)
        #   tie-breaker(feed_id) 필수 — 같은 created_at 다중 행 시 페이지 경계 누락 방지
        # ────────────────────────────────────────────────────────────────
        with conn.cursor() as cur:
            # 1단계: 페이지 단위 피드 메타 + liked + 카운트 (단일 쿼리)
            base_sql = """SELECT
                    f.feed_id,
                    f.content,
                    f.created_at,
                    f.user_id,
                    COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname,
                    u.profile_img,
                    COALESCE(r.title, '(삭제된 루틴)') AS routine_title,
                    r.category,
                    COUNT(DISTINCT fl.like_id) AS like_count,
                    COUNT(DISTINCT fc.comment_id) AS comment_count,
                    -- 현재 사용자의 좋아요 여부 (user_id 미전달 시 항상 0)
                    MAX(CASE WHEN fl_me.like_id IS NOT NULL THEN 1 ELSE 0 END) AS liked
                FROM feeds f
                LEFT JOIN users u ON f.user_id = u.user_id
                LEFT JOIN routines r ON f.routine_id = r.routine_id
                LEFT JOIN feed_likes fl ON f.feed_id = fl.feed_id
                LEFT JOIN feed_comments fc ON f.feed_id = fc.feed_id
                LEFT JOIN feed_likes fl_me
                    ON fl_me.feed_id = f.feed_id AND fl_me.user_id = %s
            """
            params = [user_id]

            if parsed_cursor:
                base_sql += " WHERE (f.created_at, f.feed_id) < (%s, %s)"
                params.extend([parsed_cursor[0], parsed_cursor[1]])

            base_sql += """
                GROUP BY f.feed_id
                ORDER BY f.created_at DESC, f.feed_id DESC
                LIMIT %s
            """
            params.append(limit)

            cur.execute(base_sql, tuple(params))
            feeds = cur.fetchall()

            # 2단계: 위 페이지에 속한 feed_id 들의 이미지 일괄 조회 (IN 쿼리 1회)
            images_by_feed = {}
            if feeds:
                feed_ids = [f["feed_id"] for f in feeds]
                placeholders = ",".join(["%s"] * len(feed_ids))
                cur.execute(
                    f"SELECT image_id, feed_id, file_url, file_type "
                    f"FROM feed_images WHERE feed_id IN ({placeholders})",
                    tuple(feed_ids),
                )
                for img in cur.fetchall():
                    images_by_feed.setdefault(img["feed_id"], []).append(img)

            # 3단계: 피드에 이미지/liked bool 결합
            for f in feeds:
                f["images"] = images_by_feed.get(f["feed_id"], [])
                f["liked"] = bool(f["liked"])

        # 다음 페이지 cursor 계산 — 페이지 크기만큼 채워졌을 때만 다음이 있다고 간주
        next_cursor = None
        if feeds and len(feeds) == limit:
            last = feeds[-1]
            next_cursor = _build_cursor(last["created_at"], last["feed_id"])

        return {"feeds": feeds, "next_cursor": next_cursor}
    except Exception as e:
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 피드 상세 조회 (GET /feed/{feed_id}) ─────────────────────────────────────

@router.get("/{feed_id}")
def get_feed_detail(feed_id: str):
    """특정 피드 상세 조회 (이미지 + 댓글 포함)

    Express feed.js의 GET /feed 라우트에서 각 피드별 이미지/댓글 조회를 위해 호출됨.
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
            # [수정 2026-05-01] Soft Delete 적용:
            #   - users / routines INNER JOIN → LEFT JOIN
            #     루틴이 삭제됐어도(피드 보존 정책), 게시자가 탈퇴했어도 피드 상세는 열려야 함.
            #   - COALESCE 로 닉네임/루틴 제목 fallback
            #   - f.* 가 모든 feeds 컬럼을 그대로 가져오므로, 추가로 routine_title/category 만 명시.
            cursor.execute(
                """SELECT f.*,
                        COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname,
                        u.profile_img,
                        COALESCE(r.title, '(삭제된 루틴)') AS routine_title,
                        r.category
                FROM feeds f
                LEFT JOIN users u ON f.user_id = u.user_id
                LEFT JOIN routines r ON f.routine_id = r.routine_id
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
            # [수정 2026-05-01] users LEFT JOIN + 닉네임 fallback
            #   탈퇴한 사용자의 댓글이라도 표시되도록 LEFT JOIN.
            #   nickname 은 COALESCE 로 "(탈퇴한 사용자)" fallback 처리.
            cursor.execute(
                """SELECT fc.*,
                          COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname
                FROM feed_comments fc
                LEFT JOIN users u ON fc.user_id = u.user_id
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
