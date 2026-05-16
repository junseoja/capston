# ============================================================
# 게시글 신고(Report) 관련 API 라우터
# ============================================================
# 작성일: 2026-05-16
# 담당 엔드포인트:
#   POST   /report/                : 신고 접수 (일반 사용자)
#   GET    /report/                : 신고 목록 (관리자) — feed_id 별 그룹 집계
#   GET    /report/{report_id}     : 신고 단건 상세 (관리자)
#   PATCH  /report/process         : 게시물 제재 처리 (관리자) — 단일 트랜잭션
#
# DB 테이블:
#   reports : report_id PK(UUID v7),
#             feed_id FK(feeds), reporter_user_id/target_user_id/processed_by FK(users),
#             report_category ENUM 6종, status ENUM(pending/completed),
#             Soft Delete(deleted_at) O
#   feeds   : 제재 시 함께 Soft Delete 대상
#   (docs/migrations-2026-05-13-admin-challenge.sql 참고)
#
# 호출 흐름:
#   - 신고: React FeedPage(🚩) → Express(report.js) → 이 라우터 → MySQL
#   - 관리: React AdminPage     → Express(report.js, require_admin) → 이 라우터 → MySQL
#
# 기존 규약 준수 (notice.py / feed.py 패턴 그대로):
#   - UUID v7 PK (uuid7str)
#   - 트랜잭션 정합성 (5/11 #18): try / except 2종 / rollback / finally close
#   - Soft Delete (5/1): 조회는 deleted_at IS NULL, 삭제는 UPDATE deleted_at
#   - 관리자 권한은 Express report.js 의 require_admin 에서 검증 (FastAPI 는 안 함)
#
# ────────────────────────────────────────────────────────────
# 설계 핵심 2가지 (notice.py 보다 복잡한 이유)
# ────────────────────────────────────────────────────────────
# 1) GET /report/ 는 "신고 1건 = 1행" 이 아니라
#    "게시물(feed_id) 단위로 묶어서" 보여준다.
#    같은 게시물을 10명이 신고하면 → 관리자 화면엔 1줄 + reportCount=10.
#    → SQL 의 GROUP BY feed_id + JSON_ARRAYAGG 로 신고자 배열 집계.
#
# 2) PATCH /report/process 는 두 가지를 한 트랜잭션으로 처리:
#    (a) 해당 게시물의 모든 pending 신고를 completed 로 전환
#    (b) 그 게시물(feeds) 자체를 Soft Delete
#    둘 중 하나만 성공하면 데이터가 어긋나므로 반드시 단일 트랜잭션.
#    (feed.py 의 create_feed_with_images #16 트랜잭션 패턴과 같은 사상)
# ────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str

router = APIRouter(prefix="/report", tags=["report"])

# reports.report_category 가 DB ENUM 이므로 사전 검증용 화이트리스트.
# 프론트 FeedPage(Stage 2-5) 신고 모달의 6개 분류와 정확히 일치해야 한다.
ALLOWED_REPORT_CATEGORIES = {
    "욕설/비방", "부적절한 홍보", "도용/저작권",
    "스팸/도배", "음란/혐오", "기타",
}


# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    """신고 접수 요청 (POST /report/)

    Express report.js 가 세션에서 reporter_user_id 를 주입.
    target_user_id(작성자) 는 Express 가 feed_id 로 조회해 주입하거나
    프론트가 보낸 값을 그대로 전달 (Express 에서 결정).
    """
    feed_id: str                       # 신고된 게시글 UUID v7
    reporter_user_id: str              # 신고한 사용자 (세션 주입)
    target_user_id: str                # 게시글 작성자
    report_category: str               # 6종 ENUM 중 하나
    report_detail: Optional[str] = None  # 상세 사유 (선택)


class ReportProcess(BaseModel):
    """게시물 제재 처리 요청 (PATCH /report/process)

    관리자가 특정 게시물을 제재할 때 호출.
    feed_id 단위로 처리 — 그 게시물의 모든 pending 신고를 한 번에 완료 처리.
    """
    feed_id: str                       # 제재할 게시물
    admin_comment: str                 # 제재 사유 (작성자에게 전달될 메시지)
    processed_by: str                  # 처리한 관리자 user_id (Express 주입)


# ════════════════════════════════════════════════════════════
# 1) 신고 접수  POST /report/
# ════════════════════════════════════════════════════════════

@router.post("/")
def create_report(body: ReportCreate):
    """게시글 신고 접수 (일반 사용자)

    동작:
        1. report_category 가 허용 ENUM 인지 검증 (아니면 400)
        2. (정책) 같은 사용자가 같은 게시물을 중복 신고하는 것 차단:
            이미 pending 상태로 신고한 적 있으면 409.
            → 어뷰징 방지. "한 사람이 한 게시물에 한 번만"
        3. uuid7str() 로 report_id 생성 후 INSERT (status 기본 'pending')
        4. commit

    반환:
        {"success": True, "report_id": "<uuid-v7>"}

    예외:
        400 : category 잘못됨
        409 : 이미 신고한 게시물 (중복)
        500 : DB 오류
    """
    if body.report_category not in ALLOWED_REPORT_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"report_category 는 {sorted(ALLOWED_REPORT_CATEGORIES)} 중 하나여야 합니다.",
        )

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 2) 중복 신고 차단 — 같은 사람이 같은 게시물을 또 신고했는지 확인.
            #    아직 처리 안 된(pending) 신고가 이미 있으면 막는다.
            cursor.execute(
                """SELECT report_id FROM reports
                    WHERE feed_id = %s
                    AND reporter_user_id = %s
                    AND status = 'pending'
                    AND deleted_at IS NULL""",
                (body.feed_id, body.reporter_user_id),
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=409,
                    detail="이미 신고한 게시물입니다. 관리자 검토 중입니다.",
                )

            # 3) 신고 INSERT (status / created_at 은 DB DEFAULT)
            new_id = uuid7str()
            cursor.execute(
                """INSERT INTO reports
                    (report_id, feed_id, reporter_user_id, target_user_id,
                        report_category, report_detail)
                    VALUES (%s, %s, %s, %s, %s, %s)""",
                (new_id, body.feed_id, body.reporter_user_id, body.target_user_id,
                body.report_category, body.report_detail),
            )
        conn.commit()
        return {"success": True, "report_id": new_id}

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
        print("🔴 create_report 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 2) 신고 목록  GET /report/   (게시물 단위 그룹 집계)
# ════════════════════════════════════════════════════════════

@router.get("/")
def list_reports(
    status: str = Query(
        "pending",
        description="'pending'(검토 대기) | 'completed'(처리 완료)",
    ),
    limit: int = Query(100, ge=1, le=200),
):
    """신고 목록 (관리자) — feed_id 별로 묶어서 집계

    설계 메모:
        같은 게시물을 여러 명이 신고하면 관리자 화면엔 1줄로 보여야 한다.
        그래서 GROUP BY feed_id 로 묶고:
            - report_count        : 그 게시물 신고 누적 횟수 COUNT(*)
            - last_reported_at    : 가장 최근 신고 시각 MAX(created_at)
            - representative_id   : 대표 report_id (가장 최근 것)
            - reporters           : 신고자 목록을 JSON 배열로 (JSON_ARRAYAGG)
        프론트 AdminPage 의 reportCount / reporters 구조와 맞춘다.

    동작:
        1. WHERE r.status = %s AND r.deleted_at IS NULL
        2. JOIN feeds f / users u 로 게시물 제목·작성자 닉네임 결합
            (피드가 이미 Soft Delete 됐어도 보이게 LEFT JOIN)
        3. GROUP BY r.feed_id
        4. ORDER BY report_count DESC  (많이 신고된 게 위로)
        5. LIMIT %s

    반환:
        {
            "success": True,
            "reports": [
            {
                "feed_id": "...", "report_count": 10,
                "representative_id": "...", "last_reported_at": "...",
                "target_user_id": "...", "author_nickname": "...",
                "feed_content": "...", "feed_deleted": 0|1,
                "reporters": [ {"reporter_user_id":"...", "report_category":"...",
                            "report_detail":"...", "created_at":"..."}, ... ]
            }, ...
        ]
        }

    주의 (MySQL 버전):
        JSON_ARRAYAGG / JSON_OBJECT 는 MySQL 5.7.22+ 필요.
        AWS RDS MySQL 8.x 이므로 사용 가능.
    """
    if status not in ("pending", "completed"):
        raise HTTPException(status_code=400, detail="status 는 pending 또는 completed 여야 합니다.")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    r.feed_id                                   AS feed_id,
                    COUNT(*)                                     AS report_count,
                    MAX(r.created_at)                            AS last_reported_at,
                    -- 대표 report_id: 가장 최근(=가장 큰 created_at) 신고 1건
                    SUBSTRING_INDEX(
                        GROUP_CONCAT(r.report_id ORDER BY r.created_at DESC), ',', 1
                    )                                            AS representative_id,
                    MAX(r.target_user_id)                        AS target_user_id,
                    u.nickname                                   AS author_nickname,
                    f.content                                    AS feed_content,
                    -- 피드가 이미 Soft Delete 됐는지 (관리자 참고용)
                    (f.deleted_at IS NOT NULL)                   AS feed_deleted,
                    -- 신고자들을 JSON 배열로 집계 (프론트 reporters 와 매핑)
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'reporter_user_id', r.reporter_user_id,
                            'report_category',  r.report_category,
                            'report_detail',    r.report_detail,
                            'created_at',       r.created_at
                        )
                    )                                            AS reporters
                FROM reports r
                LEFT JOIN feeds f ON f.feed_id = r.feed_id
                LEFT JOIN users u ON u.user_id = r.target_user_id
                WHERE r.status = %s
                    AND r.deleted_at IS NULL
                GROUP BY r.feed_id, u.nickname, f.content, f.deleted_at
                ORDER BY report_count DESC, last_reported_at DESC
                LIMIT %s
                """,
                (status, limit),
            )
            rows = cursor.fetchall()

        return {"success": True, "reports": rows}

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
        print("🔴 list_reports 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 3) 신고 단건 상세  GET /report/{report_id}
# ════════════════════════════════════════════════════════════

@router.get("/{report_id}")
def get_report(report_id: str):
    """신고 단건 상세 (관리자)

    동작:
        1. report_id + deleted_at IS NULL 로 1건 SELECT
        2. feeds / users JOIN 으로 게시물 정보 + 작성자 닉네임 결합
        3. 없으면 404

    반환:
        {"success": True, "report": { ... }}
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    r.report_id, r.feed_id, r.reporter_user_id, r.target_user_id,
                    r.report_category, r.report_detail, r.status,
                    r.admin_comment, r.processed_by, r.created_at, r.processed_at,
                    u.nickname  AS author_nickname,
                    f.content   AS feed_content,
                    (f.deleted_at IS NOT NULL) AS feed_deleted
                FROM reports r
                LEFT JOIN feeds f ON f.feed_id = r.feed_id
                LEFT JOIN users u ON u.user_id = r.target_user_id
                WHERE r.report_id = %s AND r.deleted_at IS NULL
                """,
                (report_id,),
            )
            row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="신고 내역을 찾을 수 없습니다.")

        return {"success": True, "report": row}

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
        print("🔴 get_report 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 4) 게시물 제재 처리  PATCH /report/process   (★ 단일 트랜잭션)
# ════════════════════════════════════════════════════════════

@router.patch("/process")
def process_report(body: ReportProcess):
    """관리자 게시물 제재 처리 (단일 트랜잭션)

    [핵심] 두 작업을 하나의 트랜잭션으로 묶는다:
        (a) 그 게시물(feed_id)의 모든 pending 신고 → completed 전환
            + admin_comment / processed_by / processed_at 기록
        (b) 그 게시물(feeds) 자체를 Soft Delete (deleted_at = NOW())

    왜 단일 트랜잭션인가:
        (a)만 되고 (b)가 실패하면 → "처리 완료"인데 게시물은 살아있음 (모순)
        (b)만 되고 (a)가 실패하면 → 게시물은 삭제됐는데 신고는 계속 pending
        둘 다 성공 or 둘 다 롤백 이어야 데이터가 일관됨.
        (feed.py create_feed_with_images #16 과 같은 사상)

    동작 순서:
        1. 대상 게시물에 pending 신고가 실제로 있는지 확인 (없으면 404)
        2. UPDATE reports SET status='completed', admin_comment, processed_by,
                                processed_at=NOW()
            WHERE feed_id=%s AND status='pending' AND deleted_at IS NULL
        3. UPDATE feeds SET deleted_at=NOW()
            WHERE feed_id=%s AND deleted_at IS NULL
        4. 모두 성공 시 단 한 번 commit

    반환:
        {"success": True, "processed_count": <완료 처리된 신고 건수>}

    예외:
        404 : 처리할 pending 신고가 없음
        500 : DB 오류 (이 시점엔 reports/feeds 모두 ROLLBACK 됨)

    참고:
        피드의 좋아요/댓글/이미지는 Soft Delete 이므로 함께 정리 안 됨.
        피드 조회 라우터들이 이미 deleted_at IS NULL 필터를 하므로
        사용자 화면에서는 게시물이 사라진다 (5/1 규약 덕분에 자동).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1) 처리 대상 pending 신고 존재 확인
            cursor.execute(
                """SELECT COUNT(*) AS cnt FROM reports
                    WHERE feed_id = %s AND status = 'pending' AND deleted_at IS NULL""",
                (body.feed_id,),
            )
            pending_cnt = cursor.fetchone()["cnt"]
            if pending_cnt == 0:
                raise HTTPException(
                    status_code=404,
                    detail="처리할 신고가 없습니다 (이미 처리됐거나 존재하지 않음).",
                )

            # 2) 해당 게시물의 모든 pending 신고를 한 번에 완료 처리
            cursor.execute(
                """UPDATE reports
                    SET status = 'completed',
                        admin_comment = %s,
                        processed_by = %s,
                        processed_at = NOW()
                    WHERE feed_id = %s
                        AND status = 'pending'
                        AND deleted_at IS NULL""",
                (body.admin_comment, body.processed_by, body.feed_id),
            )
            processed_count = cursor.rowcount

            # 3) 게시물 Soft Delete (이미 삭제됐어도 멱등 — AND deleted_at IS NULL)
            cursor.execute(
                """UPDATE feeds
                    SET deleted_at = NOW()
                    WHERE feed_id = %s AND deleted_at IS NULL""",
                (body.feed_id,),
            )
            # feeds rowcount 가 0 이어도(이미 삭제된 피드) 신고 처리는 유효하므로
            # 별도 에러로 막지 않는다. 멱등 처리.

        # 4) 둘 다(2,3) 성공한 경우에만 commit
        conn.commit()
        return {"success": True, "processed_count": processed_count}

    except HTTPException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        # 2 또는 3 중 어디서 터지든 reports + feeds 변경 모두 무효화
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 process_report 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
