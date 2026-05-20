# ============================================================
# 피드(Feed) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /feed/             : 피드 게시물 생성
#   POST   /feed/image        : 피드 이미지 추가
#   POST   /feed/with-images  : 피드 + 이미지 N건 단일 트랜잭션 생성
#   GET    /feed/             : 전체 피드 목록 조회 (최신순, 좋아요/댓글 수 포함)
#   GET    /feed/{feed_id}    : 특정 피드 상세 조회 (이미지, 댓글 포함)
#   DELETE /feed/{feed_id}    : 피드 게시물 삭제
#
# DB 테이블:
#   feeds        : 피드 게시물 (feed_id PK, user_id FK, routine_id FK, completion_id FK, content)
#   feed_images  : 피드 첨부 이미지 (image_id PK, feed_id FK, file_url, file_type)
#
# 연결 상태:
#   Express feed.js 라우터를 통해 프론트엔드와 연결 완료
#   FeedPage.jsx에서 GET /feed로 피드 목록 조회
#   App.jsx에서 POST /feed로 피드 생성 (상세 루틴 완료 시 피드 업로드)
#   파일 업로드는 Express multer-s3가 S3에 저장하고 URL을 전달
# ============================================================
# 모든 실패 경로는 rollback 후 커넥션을 반환해 풀 재사용 상태를 깨끗하게 유지한다.

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
    file_url: str                       # 업로드된 이미지/영상 URL (S3 퍼블릭 URL)
    file_type: Optional[str] = ""      # 파일 MIME 타입 (예: "image/jpeg", "video/mp4")


class FeedImagePayload(BaseModel):
    """단일 트랜잭션 INSERT 대상 이미지 1건 (file_url + MIME 타입)"""
    file_url: str
    file_type: Optional[str] = ""


class FeedWithImagesCreate(BaseModel):
    """피드 본문 + 첨부 이미지 N개 통합 생성 요청"""
    user_id: str                              # UUID v7 (Express 세션에서 주입)
    routine_id: str                           # UUID v7
    completion_id: str                        # UUID v7
    content: Optional[str] = ""
    images: List[FeedImagePayload] = []      # 0건이면 텍스트 전용 피드

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
            # completion_id/routine_id는 클라이언트 입력이므로 세션 user_id와의 관계를 검증한다.
            cursor.execute(
                """SELECT completion_id
                FROM routine_completions
                WHERE completion_id = %s
                  AND routine_id = %s
                  AND user_id = %s
                  AND deleted_at IS NULL""",
                (body.completion_id, body.routine_id, body.user_id)
            )
            completion = cursor.fetchone()
            if not completion:
                raise HTTPException(status_code=403, detail="본인 소유의 완료 기록에만 피드를 생성할 수 있습니다.")

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
    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
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
    file_url은 Express가 S3에 업로드한 파일의 퍼블릭 URL.

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
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 피드 + 이미지 단일 트랜잭션 (POST /feed/with-images) ──────────────────────

@router.post("/with-images")
def create_feed_with_images(body: FeedWithImagesCreate):
    """피드 + 첨부 이미지 N개를 단일 트랜잭션으로 일괄 생성.

    동작:
        1. routine_completions 소유권 검증 (POST /feed/ 와 동일)
        2. feeds 행 INSERT (commit 하지 않음)
        3. images 배열 순회하며 feed_images INSERT (commit 하지 않음)
        4. 모두 성공하면 단 한 번 conn.commit()
        5. 어느 단계든 예외 발생 시 except 분기에서 rollback → 모든 INSERT 무효화

    Returns:
        dict: {"success": True, "feed_id": "uuid-v7-...", "image_count": N}

    Raises:
        HTTPException 403: 본인 소유 완료 기록이 아님
        HTTPException 500: DB 저장 오류 (이 시점엔 feeds/feed_images 모두 ROLLBACK 됨)
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1) 소유권 검증 — POST /feed/ 와 동일 패턴
            cursor.execute(
                """SELECT completion_id
                FROM routine_completions
                WHERE completion_id = %s
                  AND routine_id = %s
                  AND user_id = %s
                  AND deleted_at IS NULL""",
                (body.completion_id, body.routine_id, body.user_id)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=403,
                    detail="본인 소유의 완료 기록에만 피드를 생성할 수 있습니다."
                )

            # 2) feeds 행 INSERT (commit 하지 않음)
            feed_id = uuid7str()
            cursor.execute(
                """INSERT INTO feeds (feed_id, user_id, routine_id, completion_id, content)
                VALUES (%s, %s, %s, %s, %s)""",
                (feed_id, body.user_id, body.routine_id,
                 body.completion_id, body.content or "")
            )

            # 3) feed_images N건 INSERT (commit 하지 않음)
            #    - executemany 도 가능하지만 row 별 image_id(uuid7str) 가 다르므로
            #      가독성 위해 순회 INSERT 유지. N <= 10 (Express upload.array 한도)
            #      정도이므로 성능 영향 미미.
            for image in body.images:
                cursor.execute(
                    """INSERT INTO feed_images (image_id, feed_id, file_url, file_type)
                    VALUES (%s, %s, %s, %s)""",
                    (uuid7str(), feed_id, image.file_url, image.file_type or "")
                )

        # 4) 모두 성공한 경우에만 commit
        conn.commit()
        return {"success": True, "feed_id": feed_id, "image_count": len(body.images)}

    except HTTPException:
        # 403 등은 commit 전이므로 명시적으로 rollback 후 재전파
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        # 어느 단계든 실패하면 feeds + feed_images INSERT를 모두 무효화한다.
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 전체 피드 목록 조회 (GET /feed/) ─────────────────────────────────────────

# 목록 조회는 user_id / cursor / limit으로 피드 메타, 좋아요 상태, 카운트, 이미지를
# 페이지 단위로 조회한다. 댓글은 모달을 열 때 /comment/{feed_id}에서 별도로 가져온다.

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


# ────────────────────────────────────────────────────────────────────
# [추가 2026-05-20] frontend-cy(7dd5535) 챌린지 피드 통합용 컬럼 가드
# ────────────────────────────────────────────────────────────────────
# 오류 번호: 머지 작업 (frontend-cy → dev 챌린지 통합)
# 날짜: 2026-05-20
# 기대효과:
#   - migrations-2026-05-20-challenge-feed-share.sql 적용 전 환경에서도
#     get_feeds() 가 컬럼 부재로 500 에러 내지 않고 routine 피드만 정상 반환
# 장점:
#   - 마이그레이션 미적용 환경(개발자 로컬, 신규 클론)에서도 안전 fallback
#   - 단일 SHOW COLUMNS 비용만 들이고 challenge 쿼리 전체를 skip 가능
# ────────────────────────────────────────────────────────────────────
def _has_challenge_share_column(cursor) -> bool:
    cursor.execute("SHOW COLUMNS FROM challenge_proofs LIKE 'share_to_feed'")
    return cursor.fetchone() is not None


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

            # 신고 제재로 Soft Delete 된 피드는 목록에서 제외한다.
            # cursor 조건은 deleted_at 필터 뒤에 AND로 이어붙인다.
            base_sql += " WHERE f.deleted_at IS NULL"
            if parsed_cursor:
                base_sql += " AND (f.created_at, f.feed_id) < (%s, %s)"
                params.extend([parsed_cursor[0], parsed_cursor[1]])

            base_sql += """
                GROUP BY f.feed_id
                ORDER BY f.created_at DESC, f.feed_id DESC
                LIMIT %s
            """
            params.append(limit)

            cur.execute(base_sql, tuple(params))
            routine_feeds = cur.fetchall()

            # 2단계: 위 페이지에 속한 feed_id 들의 이미지 일괄 조회 (IN 쿼리 1회)
            images_by_feed = {}
            if routine_feeds:
                feed_ids = [f["feed_id"] for f in routine_feeds]
                placeholders = ",".join(["%s"] * len(feed_ids))
                cur.execute(
                    f"SELECT image_id, feed_id, file_url, file_type "
                    f"FROM feed_images WHERE feed_id IN ({placeholders})",
                    tuple(feed_ids),
                )
                for img in cur.fetchall():
                    images_by_feed.setdefault(img["feed_id"], []).append(img)

            # 3단계: 피드에 이미지/liked bool 결합 + source_type 부착
            for f in routine_feeds:
                f["images"] = images_by_feed.get(f["feed_id"], [])
                f["liked"] = bool(f["liked"])
                # [추가 2026-05-20] 챌린지 통합 시 FeedPage 가 게시물 출처를 구분하도록 메타 부착
                f["source_type"] = "routine"

            # ────────────────────────────────────────────────────────────────────
            # [추가 2026-05-20] frontend-cy(7dd5535) 챌린지 피드 통합
            # ────────────────────────────────────────────────────────────────────
            # 오류 번호: 머지 작업 (frontend-cy → dev 챌린지 통합)
            # 날짜: 2026-05-20
            # 기대효과:
            #   - ChallengePage 에서 "피드에 업로드" 체크 후 등록된 챌린지 인증이
            #     FeedPage 의 단일 목록에 routine 피드와 시간순으로 섞여 노출
            # 장점:
            #   - 별도 챌린지 피드 화면을 만들 필요 없이 기존 FeedPage 재사용
            #   - share_to_feed 컬럼 가드(_has_challenge_share_column) 로
            #     마이그레이션 미적용 환경에서도 routine 피드만 안전하게 반환
            # ────────────────────────────────────────────────────────────────────
            challenge_feeds = []
            if _has_challenge_share_column(cur):
                challenge_sql = """SELECT
                        cp.proof_id AS feed_id,
                        cp.content,
                        cp.created_at,
                        cp.user_id,
                        COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname,
                        u.profile_img,
                        CONCAT('[챌린지] ', c.title) AS routine_title,
                        c.category,
                        0 AS like_count,
                        0 AS comment_count,
                        0 AS liked,
                        'challenge' AS source_type,
                        c.challenge_id,
                        c.title AS challenge_title,
                        c.category AS challenge_category
                    FROM challenge_proofs cp
                    JOIN challenges c ON cp.challenge_id = c.challenge_id
                    LEFT JOIN users u ON cp.user_id = u.user_id
                    WHERE cp.deleted_at IS NULL
                      AND c.deleted_at IS NULL
                      AND cp.share_to_feed = 1
                """
                challenge_params = []

                if parsed_cursor:
                    challenge_sql += " AND (cp.created_at, cp.proof_id) < (%s, %s)"
                    challenge_params.extend([parsed_cursor[0], parsed_cursor[1]])

                challenge_sql += """
                    ORDER BY cp.created_at DESC, cp.proof_id DESC
                    LIMIT %s
                """
                challenge_params.append(limit)
                cur.execute(challenge_sql, tuple(challenge_params))
                challenge_feeds = cur.fetchall()

                challenge_images_by_feed = {}
                if challenge_feeds:
                    challenge_feed_ids = [feed["feed_id"] for feed in challenge_feeds]
                    placeholders = ",".join(["%s"] * len(challenge_feed_ids))
                    cur.execute(
                        f"""SELECT proof_file_id, proof_id, file_url, file_type
                            FROM challenge_proof_files
                            WHERE proof_id IN ({placeholders})
                            ORDER BY file_order ASC, created_at ASC""",
                        tuple(challenge_feed_ids),
                    )
                    for image in cur.fetchall():
                        challenge_images_by_feed.setdefault(image["proof_id"], []).append(
                            {
                                "image_id": image["proof_file_id"],
                                "feed_id": image["proof_id"],
                                "file_url": image["file_url"],
                                "file_type": image["file_type"],
                            }
                        )

                for feed in challenge_feeds:
                    feed["images"] = challenge_images_by_feed.get(feed["feed_id"], [])
                    feed["liked"] = False

        # ────────────────────────────────────────────────────────────────────
        # [추가 2026-05-20] routine + challenge 피드를 created_at DESC 기준으로 머지
        # ────────────────────────────────────────────────────────────────────
        # 장점:
        #   - 두 소스를 한 응답으로 합쳐 프론트엔드의 페이지네이션 로직 그대로 사용
        #   - tie-breaker 로 feed_id 를 포함해 같은 created_at 다중 행도 결정적 정렬
        # ────────────────────────────────────────────────────────────────────
        feeds = sorted(
            [*routine_feeds, *challenge_feeds],
            key=lambda item: (str(item["created_at"]), item["feed_id"]),
            reverse=True,
        )[:limit]

        has_more = (
            len(routine_feeds) == limit
            or len(challenge_feeds) == limit
            or len(routine_feeds) + len(challenge_feeds) > limit
        )

        next_cursor = None
        if feeds and has_more:
            last = feeds[-1]
            next_cursor = _build_cursor(last["created_at"], last["feed_id"])

        return {"feeds": feeds, "next_cursor": next_cursor}
    except Exception as e:
        # 조회 라우트도 실패 시 열린 트랜잭션을 정리한다.
        try:
            conn.rollback()
        except Exception:
            pass
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
            # 루틴 삭제/회원 탈퇴 후에도 피드는 열릴 수 있어 LEFT JOIN과 fallback 라벨을 사용한다.
            cursor.execute(
                """SELECT f.*,
                        COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname,
                        u.profile_img,
                        COALESCE(r.title, '(삭제된 루틴)') AS routine_title,
                        r.category
                FROM feeds f
                LEFT JOIN users u ON f.user_id = u.user_id
                LEFT JOIN routines r ON f.routine_id = r.routine_id
                WHERE f.feed_id = %s AND f.deleted_at IS NULL""",
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
            # 탈퇴한 사용자의 댓글도 표시되도록 LEFT JOIN과 fallback 라벨을 사용한다.
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
        try:
            conn.rollback()
        except Exception:
            pass
        raise  # HTTPException(404)은 그대로 전달, 아래 except에서 잡지 않도록
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
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
    """피드 게시물 삭제 (Soft Delete, 소유자 검증 포함)

    WHERE feed_id = %s AND user_id = %s 조건으로 본인 피드만 처리하며,
    물리 삭제가 아니라 deleted_at 갱신(Soft Delete)으로 동작한다.
    연관 feed_images / feed_likes / feed_comments 는 보존된다
    (조회 경로가 feeds.deleted_at IS NULL 로 이미 가려줌).

    Args:
        feed_id (str): 삭제할 피드의 UUID v7 (URL 경로 파라미터)
        user_id (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
                {"success": False, "message": "..."}  → 권한 없음 / 이미 삭제됨

    Raises:
        HTTPException 500: DB 삭제 오류
    """
    # ── [오류번호] #18 인접 — 피드 삭제 모델 정합성 (Soft Delete 위반)
    #    [날짜]   2026-05-18
    #    [기대효과]
    #      사용자 본인 피드 삭제가 물리 DELETE → Soft Delete(UPDATE deleted_at)로 전환되어
    #      루틴/완료/공지/신고/신고제재(report.process)와 동일한 삭제 모델로 통일.
    #    [장점]
    #      - ON DELETE CASCADE 로 feed_images/likes/comments 가 영구 소멸하던 문제 제거(복구 가능).
    #      - 신고된 피드를 작성자가 직접 지워 제재 이력과 어긋나던 정합성 깨짐 방지.
    #      - 조회(get_feeds/get_feed_detail)는 이미 deleted_at IS NULL 필터라 추가 변경 불필요.
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """UPDATE feeds
                       SET deleted_at = NOW()
                     WHERE feed_id = %s
                       AND user_id = %s
                       AND deleted_at IS NULL""",
                (feed_id, user_id)
            )
            affected = cursor.rowcount

        conn.commit()

        if affected == 0:
            return {"success": False, "message": "삭제 권한이 없거나 이미 삭제된 피드입니다."}

        return {"success": True}
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
