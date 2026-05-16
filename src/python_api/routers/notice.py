# ============================================================
# 공지사항(Notice) 관련 API 라우터
# ============================================================
# 작성일: 2026-05-16
# 담당 엔드포인트:
#   POST   /notice/                : 공지 작성 (관리자)
#   GET    /notice/                : 공지 목록 (active, 카테고리 필터, 최신순)
#   GET    /notice/{notice_id}     : 공지 상세
#   PATCH  /notice/{notice_id}     : 공지 수정 (관리자)
#   DELETE /notice/{notice_id}     : 공지 Soft Delete (관리자)
#
# DB 테이블:
#   notices : notice_id PK(UUID v7), category ENUM 4종,
#             created_by FK(users), Soft Delete(deleted_at) O
#   (docs/migrations-2026-05-13-admin-challenge.sql 참고)
#
# 호출 흐름:
#   React(AdminPage/NoticeList) → Express(notice.js) → 이 라우터(8000) → MySQL
#
# 기존 규약 준수 (feed.py / user.py 패턴 그대로):
#   - UUID v7 PK (uuid7str)
#   - 트랜잭션 정합성 (5/11 #18): try / except HTTPException / except Exception
#     모두 rollback 후 처리, finally conn.close()
#   - Soft Delete (5/1): 조회는 WHERE deleted_at IS NULL,
#     삭제는 UPDATE deleted_at = NOW()
#   - KST: database.py 가 커넥션 풀에서 SET time_zone='+09:00' 적용 (여기서 신경 X)
#   - 응답 포맷: 성공 {"success": True, ...}, 실패 HTTPException
#
# 관리자 권한 처리 정책:
#   challenge.py 가이드와 동일 — Express 라우터(notice.js)가
#   require_admin 미들웨어로 session.login_id === "admin" 검증 후 호출.
#   FastAPI 는 별도 관리자 검증 안 함 (옵션 a). created_by 는 Express 가 주입.
# ============================================================

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
from datetime import date
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 PK 생성

# /notice 접두사 라우터. Swagger UI 에서 "notice" 태그로 그룹화.
router = APIRouter(prefix="/notice", tags=["notice"])

# notices.category 가 DB ENUM 이므로, 잘못된 값이 오면 DB 가 거부한다.
# 그 전에 FastAPI 단에서 400 으로 친절하게 막기 위해 화이트리스트를 둔다.
ALLOWED_CATEGORIES = {"일반", "이벤트", "점검", "업데이트"}


# ── 요청 데이터 모델 (Pydantic) ───────────────────────────────────────────────
# Pydantic 이 JSON 파싱 + 타입 검증을 자동으로 해준다.
# Express 가 보내는 body 필드와 1:1 로 맞춰야 한다.

class NoticeCreate(BaseModel):
    """공지 작성 요청 (POST /notice/)

    Express notice.js 가 require_admin 미들웨어 통과 후 호출.
    created_by 는 Express 가 session.user_id 로 주입.
    """
    category: str            # '일반' | '이벤트' | '점검' | '업데이트'
    title: str               # 공지 제목 (1~255자)
    content: str             # 공지 본문
    post_date: date          # 리스트 표시용 게시일 'YYYY-MM-DD'
    created_by: str          # 관리자 user_id (UUID v7, Express 주입)


class NoticeUpdate(BaseModel):
    """공지 수정 요청 (PATCH /notice/{id})

    전달되지 않은(None) 필드는 변경하지 않는다 (부분 수정).
    SQL 의 SET 절을 동적으로 구성한다.
    """
    category: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    post_date: Optional[date] = None


# ════════════════════════════════════════════════════════════
# 1) 공지 작성  POST /notice/
# ════════════════════════════════════════════════════════════

@router.post("/")
def create_notice(body: NoticeCreate):
    """공지사항 작성 (관리자 전용)

    동작:
        1. category 가 허용된 ENUM 값인지 검증 (아니면 400)
        2. uuid7str() 로 notice_id 생성
        3. notices 테이블 INSERT
        4. commit 후 생성된 notice_id 반환

    반환:
        {"success": True, "notice_id": "<uuid-v7>"}

    예외:
        400 : category 값이 잘못됨
        500 : DB 오류
    """
    # category 사전 검증 — DB ENUM 거부(1265 에러) 전에 친절한 400 으로 막는다.
    if body.category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"category 는 {sorted(ALLOWED_CATEGORIES)} 중 하나여야 합니다.",
        )

    conn = get_connection()  # 커넥션 풀에서 연결 1개 빌려옴 (database.py)
    try:
        with conn.cursor() as cursor:
            new_id = uuid7str()  # 시간순 정렬 가능한 UUID v7
            cursor.execute(
                """INSERT INTO notices
                       (notice_id, category, title, content, post_date, created_by)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                # created_at / updated_at 은 DB DEFAULT 로 자동 입력
                (new_id, body.category, body.title, body.content,
                 body.post_date, body.created_by),
            )
        conn.commit()  # 여기까지 와야 실제 DB 반영
        return {"success": True, "notice_id": new_id}

    except HTTPException:
        # [5/11 #18] HTTPException 도 트랜잭션 미정리 가능 → rollback 후 재전파
        # (풀 반환 시 다음 요청에 더러운 트랜잭션이 새지 않게)
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
        print("🔴 create_notice 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # close() 는 실제 종료가 아니라 풀 반환 (database.py PooledConnection)
        conn.close()


# ════════════════════════════════════════════════════════════
# 2) 공지 목록  GET /notice/
# ════════════════════════════════════════════════════════════

@router.get("/")
def list_notices(
    category: Optional[str] = Query(
        None,
        description="'일반'|'이벤트'|'점검'|'업데이트' 중 하나. 미전달 시 전체",
    ),
    limit: int = Query(
        100, ge=1, le=200,
        description="최대 반환 개수 (프론트 NoticeList 가 클라이언트 페이지네이션을 하므로 넉넉히)",
    ),
):
    """공지 목록 조회 (Soft Delete 제외, 최신 게시일 순)

    설계 메모:
        프론트 NoticeList.jsx 가 검색/카테고리/페이지네이션을 클라이언트에서
        처리하므로, 백엔드는 'active 공지 전체를 최신순으로' 주면 충분하다.
        다만 트래픽/데이터 증가 대비해 limit + category 필터는 옵션으로 제공.

    동작:
        1. WHERE deleted_at IS NULL   (Soft Delete 된 공지 제외 — 5/1 규약)
        2. category 가 있으면 AND category = %s
        3. ORDER BY post_date DESC, created_at DESC  (최신 공지가 위로)
        4. LIMIT %s

    반환:
        {"success": True, "notices": [ { ...공지... }, ... ]}
    """
    # category 가 들어왔는데 허용값이 아니면 400
    if category is not None and category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"category 는 {sorted(ALLOWED_CATEGORIES)} 중 하나여야 합니다.",
        )

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # SQL 과 파라미터를 동적으로 구성한다.
            # 문자열 포매팅(f-string)으로 값을 직접 넣지 않고 %s 플레이스홀더만 사용
            # → SQL 인젝션 방어 (PyMySQL 이 이스케이프 처리)
            sql = """
                SELECT notice_id, category, title, content,
                       post_date, created_by, created_at, updated_at
                FROM notices
                WHERE deleted_at IS NULL
            """
            params = []

            if category is not None:
                sql += " AND category = %s"
                params.append(category)

            sql += " ORDER BY post_date DESC, created_at DESC LIMIT %s"
            params.append(limit)

            cursor.execute(sql, params)
            rows = cursor.fetchall()  # DictCursor 라 [{컬럼:값}, ...] 형태

        return {"success": True, "notices": rows}

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
        print("🔴 list_notices 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 3) 공지 상세  GET /notice/{notice_id}
# ════════════════════════════════════════════════════════════

@router.get("/{notice_id}")
def get_notice(notice_id: str):
    """공지 단건 상세 조회

    동작:
        1. notice_id + deleted_at IS NULL 로 1건 SELECT
        2. 없으면 404 (존재하지 않거나 이미 삭제됨)

    반환:
        {"success": True, "notice": { ... }}
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT notice_id, category, title, content,
                          post_date, created_by, created_at, updated_at
                   FROM notices
                   WHERE notice_id = %s AND deleted_at IS NULL""",
                (notice_id,),
            )
            row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")

        return {"success": True, "notice": row}

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
        print("🔴 get_notice 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 4) 공지 수정  PATCH /notice/{notice_id}
# ════════════════════════════════════════════════════════════

@router.patch("/{notice_id}")
def update_notice(notice_id: str, body: NoticeUpdate):
    """공지 부분 수정 (관리자 전용)

    동작:
        1. body 에서 None 이 아닌 필드만 골라 동적 SET 절 구성
        2. 수정할 필드가 하나도 없으면 400
        3. category 가 들어왔으면 ENUM 값 검증
        4. UPDATE ... WHERE notice_id=%s AND deleted_at IS NULL
           (updated_at 은 DB ON UPDATE CURRENT_TIMESTAMP 로 자동 갱신)
        5. rowcount == 0 이면 404 (없거나 이미 삭제됨)

    반환:
        {"success": True}
    """
    # 1) category 가 들어왔으면 먼저 검증
    if body.category is not None and body.category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"category 는 {sorted(ALLOWED_CATEGORIES)} 중 하나여야 합니다.",
        )

    # 2) 동적 SET 절 구성 — 전달된 필드만 UPDATE
    #    이렇게 하면 "제목만 수정" 같은 부분 수정이 자연스럽게 된다.
    fields = []
    params = []
    if body.category is not None:
        fields.append("category = %s")
        params.append(body.category)
    if body.title is not None:
        fields.append("title = %s")
        params.append(body.title)
    if body.content is not None:
        fields.append("content = %s")
        params.append(body.content)
    if body.post_date is not None:
        fields.append("post_date = %s")
        params.append(body.post_date)

    if not fields:
        raise HTTPException(status_code=400, detail="수정할 필드가 없습니다.")

    params.append(notice_id)  # WHERE 절 파라미터 (맨 마지막)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = (
                f"UPDATE notices SET {', '.join(fields)} "
                f"WHERE notice_id = %s AND deleted_at IS NULL"
            )
            cursor.execute(sql, params)
            affected = cursor.rowcount  # 실제 수정된 행 수

        if affected == 0:
            # 한 행도 안 바뀜 = 그 notice_id 가 없거나 이미 Soft Delete 됨
            raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")

        conn.commit()
        return {"success": True}

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
        print("🔴 update_notice 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════
# 5) 공지 삭제 (Soft Delete)  DELETE /notice/{notice_id}
# ════════════════════════════════════════════════════════════

@router.delete("/{notice_id}")
def delete_notice(notice_id: str):
    """공지 Soft Delete (관리자 전용)

    [5/1 Soft Delete 규약]
        실제 DELETE 하지 않고 deleted_at 에 현재 시각을 채운다.
        이후 모든 조회(list/get)는 deleted_at IS NULL 로 필터하므로
        사용자 화면에서는 사라지지만 DB 레코드는 보존된다.

    동작:
        1. UPDATE notices SET deleted_at = NOW()
             WHERE notice_id=%s AND deleted_at IS NULL
           (AND deleted_at IS NULL → 이미 삭제된 공지 재삭제 방지 = 멱등성)
        2. rowcount == 0 이면 404
        3. commit

    반환:
        {"success": True}
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """UPDATE notices
                   SET deleted_at = NOW()
                   WHERE notice_id = %s AND deleted_at IS NULL""",
                (notice_id,),
            )
            affected = cursor.rowcount

        if affected == 0:
            raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")

        conn.commit()
        return {"success": True}

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
        print("🔴 delete_notice 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
