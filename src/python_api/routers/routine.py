# ============================================================
# 루틴(Routine) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /routine/             : 루틴 생성 (UUID v7 PK 사용)
#   GET    /routine/{user_id}    : 특정 유저의 루틴 전체 조회 (최신순)
#   DELETE /routine/{routine_id} : 루틴 삭제 (Soft Delete)
#
# 호출 흐름:
#   React(RoutinePage) → Express /routine → 이 라우터 → MySQL routines 테이블
#
# DB 테이블: routines
#   - routine_id : UUID v7 (PK)
#   - user_id    : UUID v7 (FK → users.user_id)
#   - title      : 루틴 제목
#   - category   : 카테고리 (운동, 공부, 식단 등)
#   - time_slot  : 시간대 (morning / lunch / dinner)
#   - routine_mode: 완료 방식 (check / detail)
#   - goal       : 목표 시간 문자열 (예: "07:30")
#   - repeat_cycle: 반복 주기 (예: "매일" 또는 "월, 수, 금")
#   - description: 루틴 설명
#   - created_at : 생성 일시 (자동)
#   - deleted_at : 삭제 시각 (NULL=활성, NOT NULL=삭제됨)  [추가 2026-05-01]
#
# ─────────────────────────────────────────────────────────────────
# [Soft Delete 도입 2026-05-01]
# ─────────────────────────────────────────────────────────────────
# 변경 이유:
#   기존에는 DELETE FROM routines 시 ON DELETE CASCADE 로
#   routine_completions / feeds / feed_images / feed_likes / feed_comments
#   가 모두 함께 사라졌음. 사용자 인증 글(피드)은 SNS 게시물 성격이므로
#   "내 루틴을 삭제했다고 해서 과거 인증 기록까지 사라지는 것은 부자연스럽다"
#   는 요구가 있었음.
#
# 적용 정책:
#   - 본 라우터의 DELETE 는 더 이상 행을 지우지 않고
#     UPDATE routines SET deleted_at = NOW() 만 수행한다.
#   - 모든 SELECT 는 WHERE deleted_at IS NULL 을 추가하여
#     사용자 화면에서는 삭제된 루틴이 보이지 않도록 한다.
#   - 단, 피드 화면(feed.py) 과 마이페이지 최근 활동(completion.history)
#     에서는 삭제된 루틴의 인증 기록이 그대로 표시되어야 하므로
#     해당 라우터들은 routines 의 deleted_at 을 필터링하지 않는다.
# ─────────────────────────────────────────────────────────────────
#
# ────────────────────────────────────────────────────────────────────
# [수정 2026-05-11] 신규 #18 — 라우터 트랜잭션 정합성 일괄 점검
# ────────────────────────────────────────────────────────────────────
# 오류 번호: 신규 #18 (2026-05-11 종합 리뷰 식별)
# 날짜: 2026-05-11
# 기대효과:
#   - PyMySQL 풀(2026-05-10) 환경에서 미정리 트랜잭션이 다음 요청에 새는 문제 차단
#   - 5/2 like.py 1205 락 타임아웃 패턴 재발 방지
#   - 루틴 생성/삭제(Soft Delete UPDATE)의 트랜잭션 누수 차단
# 장점:
#   - except 블록 rollback 추가만으로 로직 변경 없이 안전성 확보
#   - SELECT-only 라우터에서도 동일 패턴으로 미래 INSERT 추가에 안전
#   - 7개 라우터 일괄 패턴화로 유지보수 비용 최소
# ────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /routine 접두사 라우터 생성, Swagger UI 태그 "routine"으로 그룹화
router = APIRouter(prefix="/routine", tags=["routine"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class RoutineCreate(BaseModel):
    """루틴 생성 요청 데이터 스키마

    Express routine.js의 POST /routine 에서 전달하는 필드와 동일.
    user_id는 Express 세션에서 자동으로 주입되어 같이 전달됨.
    """
    user_id: str                         # UUID v7 (users.user_id FK) - 세션에서 자동 주입
    title: str                           # 루틴 제목 (필수)
    category: str                        # 카테고리 (운동, 공부, 식단 등) (필수)
    time_slot: str                       # 시간대 (morning/lunch/dinner) - 목표 시간으로 자동 분류됨
    routine_mode: str                    # 완료 방식: "check" (버튼) / "detail" (인증글+사진)
    goal: Optional[str] = ""            # 목표 시간 문자열 (예: "07:30"), 선택사항
    repeat_cycle: Optional[str] = ""    # 반복 주기 (예: "매일" 또는 "월, 수, 금"), 선택사항
    description: Optional[str] = ""     # 루틴 설명, 선택사항

# ── 루틴 생성 (POST /routine/) ────────────────────────────────────────────────

@router.post("/")
def create_routine(body: RoutineCreate):
    """루틴 생성 API

    UUID v7로 routine_id를 생성하고 routines 테이블에 INSERT.
    Express의 createRoutine() 에서 호출되며, user_id는 Express 세션에서 자동 주입됨.

    Args:
        body (RoutineCreate): 루틴 생성 데이터

    Returns:
        dict: {"success": True}

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            new_uuid = uuid7str()  # 시간 기반 고유 routine_id 생성 (정렬 가능한 UUID v7)
            cursor.execute(
                """INSERT INTO routines
                    (routine_id, user_id, title, category, time_slot,
                     routine_mode, goal, repeat_cycle, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (new_uuid, body.user_id, body.title, body.category,
                 body.time_slot, body.routine_mode, body.goal,
                 body.repeat_cycle, body.description)
            )
        conn.commit()  # INSERT 완료 후 트랜잭션 커밋
        return {"success": True}
    except Exception as e:
        # [수정 2026-05-11 #18] 미정리 트랜잭션 정리 — 풀 반환 시 다음 요청 오염 차단
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()  # 항상 커넥션 반환

# ── 루틴 목록 조회 (GET /routine/{user_id}) ───────────────────────────────────

@router.get("/{user_id}")
def get_routines(user_id: str):
    """특정 유저의 루틴 전체 조회

    Express의 getRoutines(user_id) 에서 호출.
    최신 생성 순(created_at DESC)으로 정렬하여 반환.

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 루틴 목록 (DictCursor 사용으로 dict 배열 반환)
                    각 항목: routine_id, user_id, title, category, time_slot,
                             routine_mode, goal, repeat_cycle, description, created_at

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # [수정 2026-05-01] Soft Delete 적용:
            #   AND deleted_at IS NULL → 삭제된 루틴은 사용자 화면에서 숨김
            #   복합 인덱스 idx_routines_user_active(user_id, deleted_at) 가
            #   이 WHERE 절을 정확히 커버함.
            cursor.execute(
                """SELECT * FROM routines
                WHERE user_id = %s
                  AND deleted_at IS NULL
                ORDER BY created_at DESC""",
                (user_id,)
            )
            routines = cursor.fetchall()  # DictCursor → dict 배열 반환 (없으면 빈 리스트)
        return routines
    except Exception as e:
        # [수정 2026-05-11 #18] SELECT-only 라우터지만 일관 패턴 유지
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 루틴 삭제 (DELETE /routine/{routine_id}) ─────────────────────────────────

@router.delete("/{routine_id}")
def delete_routine(
    routine_id: str,
    user_id: str = Query(..., description="소유자 UUID v7 — Express 세션에서 전달")
):
    """루틴 삭제 API (소유자 검증 포함, Soft Delete)

    Express의 deleteRoutine(routine_id, user_id) 에서 호출.
    WHERE routine_id = %s AND user_id = %s 조건으로 본인 소유 루틴만 처리.

    [수정 2026-05-01] Soft Delete 전환
        기존: DELETE FROM routines  → CASCADE 로 completions/feeds/이미지/좋아요/댓글 모두 삭제됨
        변경: UPDATE routines SET deleted_at = NOW()
              → DB 레코드는 보존되고, 연결된 피드/완료기록도 그대로 살아남음
              → 사용자 화면에선 deleted_at IS NULL 필터로 자동으로 숨겨짐
              → 피드/마이페이지 최근활동에서는 "(삭제된 루틴)" 라벨로 표시

        멱등성:
          - 이미 삭제된 행을 다시 호출해도 deleted_at 만 갱신될 뿐 부작용 없음
          - 단, "이미 삭제된 루틴은 삭제 불가" 처럼 보이게 하기 위해
            WHERE 절에 AND deleted_at IS NULL 을 추가 → 두 번째 호출은 0행 affected.

    Args:
        routine_id (str): 삭제할 루틴의 UUID v7 (URL 경로 파라미터)
        user_id    (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
              {"success": False, "message": "..."}  → 권한 없음/이미 삭제됨/존재하지 않음

    Raises:
        HTTPException 500: DB 업데이트 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # [수정 2026-05-01] DELETE → UPDATE deleted_at
            # WHERE 절:
            #   routine_id = %s            : 대상 루틴
            #   AND user_id = %s            : 본인 소유 검증 (타인 루틴 차단)
            #   AND deleted_at IS NULL      : 이미 삭제된 행은 다시 처리하지 않음
            cursor.execute(
                """UPDATE routines
                   SET deleted_at = NOW()
                 WHERE routine_id = %s
                   AND user_id = %s
                   AND deleted_at IS NULL""",
                (routine_id, user_id)
            )
            affected = cursor.rowcount  # 실제로 갱신된 행 수

        conn.commit()

        if affected == 0:
            # 갱신된 행이 없음 → 다음 중 하나:
            #   1) 존재하지 않는 routine_id
            #   2) 본인 소유가 아님
            #   3) 이미 deleted_at 이 채워진 상태(중복 삭제 호출)
            # 어느 경우든 사용자에게는 같은 메시지로 응답해도 보안상 문제없음.
            return {"success": False, "message": "삭제 권한이 없거나 이미 삭제된 루틴입니다."}

        return {"success": True}
    except Exception as e:
        # [수정 2026-05-11 #18] Soft Delete UPDATE 도 트랜잭션 정리
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
