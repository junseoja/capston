# ============================================================
# 루틴 완료 기록(Completion) 관련 API 라우터
# ============================================================
# 담당 엔드포인트:
#   POST   /completion/                   : 루틴 완료 기록 생성
#   GET    /completion/today/{user_id}    : 오늘 완료한 루틴 목록 조회
#   DELETE /completion/{completion_id}    : 완료 기록 삭제 (Soft Delete)
#   GET    /completion/history/{user_id}  : 전체 완료 이력 조회 (마이페이지용)
#
# DB 테이블: routine_completions
#   - completion_id : UUID v7 (PK)
#   - routine_id    : UUID v7 (FK → routines.routine_id)
#   - user_id       : UUID v7 (FK → users.user_id)
#   - proof_text    : 인증 글 (상세 루틴에서 입력)
#   - completed_at  : 완료 일시 (자동)
#   - deleted_at    : 삭제 시각 (NULL=활성, NOT NULL=취소됨)  [추가 2026-05-01]
#
# 연결 상태:
#   Express completion.js 라우터를 통해 프론트엔드와 연결 완료
#   홈 화면에서 루틴 완료/취소 시 이 API가 호출됨
#   마이페이지 "최근 활동" 섹션에서 완료 이력 조회에 사용
#
# ─────────────────────────────────────────────────────────────────
# [Soft Delete 도입 2026-05-01]
# ─────────────────────────────────────────────────────────────────
# routines 와 동일 정책: DELETE 행 제거 대신 UPDATE deleted_at = NOW().
#
# 정책 분기:
#   - GET /completion/today           → 활성 행만 조회 (deleted_at IS NULL)
#   - GET /completion/history         → 활성 행만 조회 (취소된 완료 기록은 숨김)
#                                        단, 연결된 routines 가 soft delete 됐어도
#                                        completion 자체는 살아있으면 그대로 표시 ←
#                                        사용자 결정사항 2(a) "삭제된 루틴의
#                                        완료 기록도 표시"
#   - DELETE /completion/{id}         → UPDATE deleted_at = NOW()
#                                        (CASCADE 가 더 이상 트리거되지 않으므로
#                                         연결된 피드/이미지/댓글/좋아요는 보존)
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
#   - 완료/취소가 빈번한 라우트라 자기 데드락 위험이 가장 큼 → 우선 보강
# 장점:
#   - except 블록 rollback 추가만으로 로직 변경 없이 안전성 확보
#   - 풀 반환 시 깨끗한 트랜잭션 상태 보장
#   - 7개 라우터 일괄 패턴화로 유지보수 비용 최소
# ────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from pydantic import BaseModel
from typing import Optional
import pymysql
from uuid_extensions import uuid7str  # UUID v7: 시간 순서가 보장되는 UUID 생성

# /completion 접두사 라우터 생성
router = APIRouter(prefix="/completion", tags=["completion"])

# ── 요청 데이터 모델 ──────────────────────────────────────────────────────────

class CompletionCreate(BaseModel):
    """루틴 완료 생성 요청 데이터 스키마"""
    routine_id: str               # UUID v7 (routines.routine_id FK)
    user_id: str                  # UUID v7 (users.user_id FK)
    proof_text: Optional[str] = ""  # 인증 글 (상세 루틴 시 입력값, 체크 루틴은 빈 문자열)

# ── 루틴 완료 기록 생성 (POST /completion/) ───────────────────────────────────

@router.post("/")
def create_completion(body: CompletionCreate):
    """루틴 완료 기록 생성

    홈 화면에서 루틴을 완료할 때 호출됨.
    UUID v7로 completion_id를 생성하고 routine_completions 테이블에 INSERT.
    피드 업로드 시에도 이 completion_id가 feeds 테이블에 FK로 연결됨.

    Args:
        body (CompletionCreate): 완료 데이터 (routine_id, user_id, proof_text)

    Returns:
        dict: {"success": True, "completion_id": "uuid-v7-..."}
            completion_id는 피드 생성 시 feeds.completion_id FK로 사용됨

    Raises:
        HTTPException 500: DB 저장 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # ────────────────────────────────────────────────────────────
            # [추가 2026-05-10] 완료 생성 전 루틴 소유권 검증.
            # ────────────────────────────────────────────────────────────
            # 이유:
            #   Express 는 세션에서 user_id 를 주입하지만, routine_id 는 프론트가 보낸
            #   입력값이다. FastAPI 가 이를 그대로 믿으면 사용자가 타인의 routine_id 를
            #   넣어 완료 기록을 만들 수 있고, 이후 MyPage/Stats 통계까지 오염된다.
            #
            # 동작:
            #   routine_id 가 body.user_id 소유의 "활성 루틴(deleted_at IS NULL)"인지
            #   먼저 확인한다. 결과가 없으면 INSERT 하지 않고 403으로 거부한다.
            #
            # 결과:
            #   Express 인증을 우회하거나 잘못된 routine_id 를 보내도 완료 기록이 생성되지 않는다.
            # ────────────────────────────────────────────────────────────
            cursor.execute(
                """SELECT routine_id
                FROM routines
                WHERE routine_id = %s
                    AND user_id = %s
                    AND deleted_at IS NULL""",
                (body.routine_id, body.user_id)
            )
            routine = cursor.fetchone()
            if not routine:
                raise HTTPException(status_code=403, detail="본인 소유의 활성 루틴만 완료할 수 있습니다.")

            new_uuid = uuid7str()  # 완료 기록 고유 ID 생성
            cursor.execute(
                """INSERT INTO routine_completions
                    (completion_id, routine_id, user_id, proof_text)
                VALUES (%s, %s, %s, %s)""",
                (new_uuid, body.routine_id, body.user_id, body.proof_text)
                # completed_at은 DB DEFAULT CURRENT_TIMESTAMP으로 자동 입력됨
            )
        conn.commit()
        # completion_id를 반환해야 피드 생성 시 FK로 사용 가능
        return {"success": True, "completion_id": new_uuid}
    except HTTPException:
        # [수정 2026-05-11 #18] 403 등도 트랜잭션 정리 후 재전파
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        # [수정 2026-05-11 #18] 미정리 트랜잭션 정리 — 풀 반환 시 다음 요청 오염 차단
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 오늘 완료 기록 조회 (GET /completion/today/{user_id}) ─────────────────────

@router.get("/today/{user_id}")
def get_today_completions(user_id: str):
    """오늘 완료한 루틴 목록 조회

    홈 화면 초기 로드 시 오늘 이미 완료한 루틴을 표시하기 위해 사용됨.
    DATE(completed_at) = CURDATE() 조건으로 오늘 날짜의 기록만 필터링.

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 오늘 완료한 루틴 기록 목록 (최신순)
                    각 항목: completion_id, routine_id, user_id, proof_text, completed_at

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # ────────────────────────────────────────────────────────────
            # [주석 보강 2026-04-29] CURDATE() 의 의미 확정
            # ────────────────────────────────────────────────────────────
            # database.get_connection() 에서 init_command 로
            # `SET time_zone = '+09:00'` 을 실행하므로,
            # 이 쿼리의 CURDATE() 는 항상 KST 기준 "오늘 날짜"를 반환한다.
            # DATE(completed_at) 도 동일 세션의 KST 타임존으로 해석되므로
            # 자정 전후 완료 기록이 누락되던 기존 버그는 발생하지 않는다.
            # ────────────────────────────────────────────────────────────
            # [수정 2026-05-01] Soft Delete 필터 추가:
            #   AND deleted_at IS NULL → 완료 취소된 기록은 화면에서 숨김.
            #   인덱스 idx_completions_user_active(user_id, deleted_at) 가
            #   user_id + deleted_at 조합을 빠르게 커버한다.
            cursor.execute(
                """SELECT * FROM routine_completions
                WHERE user_id = %s
                    AND deleted_at IS NULL
                    AND DATE(completed_at) = CURDATE()
                ORDER BY completed_at DESC""",
                (user_id,)
            )
            completions = cursor.fetchall()  # 오늘 완료 기록 전체 (없으면 빈 리스트)
        return completions
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

# ── 완료 기록 삭제 (DELETE /completion/{completion_id}) ───────────────────────

@router.delete("/{completion_id}")
def delete_completion(
    completion_id: str,
    user_id: str = Query(..., description="요청한 유저의 UUID v7 — 본인 완료 기록만 삭제 가능")
):
    """루틴 완료 취소 (Soft Delete)

    홈 화면에서 완료된 루틴 카드를 클릭해 완료 취소할 때 호출됨.

    [수정 2026-05-01] Soft Delete 전환:
        UPDATE routine_completions SET deleted_at = NOW() 만 수행하므로
        ON DELETE CASCADE 가 트리거되지 않는다 → 연관 피드/이미지/댓글/좋아요는
        그대로 보존되어 SNS 성격의 인증 기록이 사라지지 않는다.

    [수정] user_id 까지 WHERE 에 포함시켜 본인 완료 기록만 처리 가능하도록 강화.

    Args:
        completion_id (str): 삭제할 완료 기록의 UUID v7 (URL 경로 파라미터)
        user_id (str): 요청한 유저의 UUID v7 (Query 파라미터, 필수)

    Returns:
        dict: {"success": True}                     → 삭제 성공
            {"success": False, "message": "..."} → 권한 없음 또는 대상 없음

    Raises:
        HTTPException 500: DB 삭제 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # [수정 2026-05-01] Soft Delete 전환
            #   기존: DELETE FROM routine_completions  → CASCADE 로 연결된 피드/이미지/댓글/좋아요 모두 사라짐
            #   변경: UPDATE ... SET deleted_at = NOW()
            #         → 사용자 화면에는 안 보이지만, 연결된 피드/이미지 등은 그대로 보존됨
            #         → 사용자 결정사항 1(a)/2(a) 와 일관 (피드는 표시, 마이페이지 활동도 표시)
            #
            # WHERE 절:
            #   completion_id = %s            : 대상 완료 기록
            #   AND user_id = %s              : 본인 소유 검증
            #   AND deleted_at IS NULL        : 이미 취소된 기록은 다시 처리하지 않음
            cursor.execute(
                """UPDATE routine_completions
                    SET deleted_at = NOW()
                    WHERE completion_id = %s
                    AND user_id = %s
                    AND deleted_at IS NULL""",
                (completion_id, user_id)
            )
            affected = cursor.rowcount
        conn.commit()

        # [수정 2026-05-01] 갱신된 행이 0이면 다음 셋 중 하나:
        #   1) 존재하지 않는 completion_id
        #   2) 본인 소유 아님
        #   3) 이미 취소된 상태(중복 호출)
        if affected == 0:
            return {"success": False, "message": "삭제 권한이 없거나 이미 취소된 완료 기록입니다."}

        return {"success": True}
    except Exception as e:
        # [수정 2026-05-11 #18] UPDATE 도 INSERT 와 동일하게 트랜잭션 정리
        try:
            conn.rollback()
        except Exception:
            pass
        print("🔴 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── 전체 완료 이력 조회 (GET /completion/history/{user_id}) ──────────────────

@router.get("/history/{user_id}")
def get_completion_history(user_id: str):
    """유저 전체 완료 이력 조회 (마이페이지용)

    마이페이지의 "최근 활동" 섹션에서 사용됨.
    MyPage.jsx에서 GET /completion/history를 호출하여 실제 완료 이력을 표시.

    routines 테이블과 JOIN하여 루틴 제목, 카테고리, 완료 방식도 함께 반환.
    최신 20건만 조회 (LIMIT 20).

    Args:
        user_id (str): 조회할 유저의 UUID v7 (URL 경로 파라미터)

    Returns:
        list[dict]: 완료 이력 목록 (최신 20건, 최신순)
                    각 항목: completion_id, routine_id, user_id, proof_text,
                            completed_at, title(루틴), category, routine_mode

    Raises:
        HTTPException 500: DB 조회 오류
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # [수정 2026-05-01] Soft Delete + 삭제 루틴 fallback 처리
            #   1) JOIN → LEFT JOIN
            #      삭제된 루틴(routines.deleted_at NOT NULL)도 결과에 포함되도록.
            #      INNER JOIN 이면 삭제 루틴의 완료 기록이 결과에서 사라짐.
            #      → 사용자 결정사항 2(a) "삭제된 루틴의 완료 기록도 표시" 충족
            #   2) COALESCE(r.title, '(삭제된 루틴)')
            #      만약 routine 행 자체가 hard delete 되었거나(과거 데이터) JOIN 실패 시
            #      "(삭제된 루틴)" 라벨로 표시.
            #      현재는 routines 도 soft delete 정책이라 r.title 은 항상 조회되지만,
            #      방어 코드로 두어 데이터 정합성 변화에 견고하게.
            #   3) AND rc.deleted_at IS NULL
            #      완료 기록 자체가 취소된 것은 숨김 (이력에 남지 않음)
            #
            # 주의:
            #   r.* 를 SELECT 하지 않고 r.title / r.category / r.routine_mode 만 명시.
            #   r.deleted_at 같은 새 컬럼이 결과에 섞여 프론트 매핑을 헷갈리게 하는
            #   부작용 방지.
            cursor.execute(
                """SELECT rc.*,
                        COALESCE(r.title, '(삭제된 루틴)') AS title,
                        r.category,
                        r.routine_mode
                FROM routine_completions rc
                LEFT JOIN routines r ON rc.routine_id = r.routine_id
                WHERE rc.user_id = %s
                    AND rc.deleted_at IS NULL
                ORDER BY rc.completed_at DESC
                LIMIT 20""",
                (user_id,)
            )
            history = cursor.fetchall()
        return history
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
